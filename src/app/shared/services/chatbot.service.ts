import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/** Appel d'une requête métier (outil MCP) par le modèle. */
export interface AppelOutil {
  nom: string;
  arguments: Record<string, unknown>;
}

/** Message de la conversation, tel que conservé côté front. */
export interface MessageChat {
  role: 'user' | 'assistant';
  content: string;
  /** Requêtes métier utilisées pour produire la réponse (assistant). */
  outils?: AppelOutil[];
  /** Message d'erreur : affiché mais jamais renvoyé au backend. */
  erreur?: boolean;
  /** Modèle ayant répondu (assistant). */
  modele?: string;
  /** Questions encore possibles dans la conversation après cette réponse (assistant). */
  questionsRestantes?: number;
  /** Erreur 413 : la conversation est pleine, il faut en ouvrir une nouvelle. */
  conversationPleine?: boolean;
  /** Refus « Sonneur occupé » (503) : jamais conservé dans l'historique. */
  occupe?: boolean;
}

/** Erreur HTTP de `POST /chat` (hors flux), avec le statut et le code éventuel du backend. */
export class ErreurChat extends Error {
  constructor(message: string, readonly statut: number, readonly code?: string) {
    super(message);
  }
}

/** Événements SSE émis par `POST /chat`. */
export type EvenementChat =
  | { type: 'attente'; donnees: { message: string; questions_en_cours: number } }
  | { type: 'outil'; donnees: AppelOutil }
  | { type: 'texte'; donnees: { texte: string } }
  | { type: 'fin'; donnees: { outils: string[]; duree_ms: number; modele?: string; questions_restantes?: number } }
  | { type: 'erreur'; donnees: { message: string; code?: string } };

/** Réponse de `GET chat/etat` : Sonneur peut-il prendre une question ? */
export interface EtatSonneur {
  occupe: boolean;
  questions_en_cours: number;
  capacite: number;
  /** Message à afficher quand Sonneur est occupé (null s'il est libre). */
  message: string | null;
}

/** Code d'erreur du backend quand une autre question occupe déjà le modèle (503 ou événement `erreur`). */
export const SONNEUR_OCCUPE = 'sonneur_occupe';

/**
 * Service du chatbot métier.
 *
 * Le backend est sans état : on lui envoie tout l'historique à chaque question
 * et il répond par un flux SSE. `HttpClient` ne sait pas lire un flux SSE en POST,
 * on passe donc par `fetch` (et l'en-tête Bearer est ajouté à la main, car
 * l'intercepteur ne s'applique pas à `fetch`).
 */
@Injectable({
  providedIn: 'root'
})
export class ChatbotService {

  /**
   * Envoie la conversation au backend et émet les événements du flux SSE.
   *
   * @param messages Historique complet (le dernier message doit être `user`).
   * @param signal Signal d'interruption : `abort()` arrête la génération côté backend.
   */
  envoyer(messages: MessageChat[], signal: AbortSignal): Observable<EvenementChat> {
    return new Observable<EvenementChat>(observateur => {
      // Seuls role et content partent au backend, sans les messages en erreur
      const historique = messages
        .filter(m => !m.erreur)
        .map(m => ({ role: m.role, content: m.content }));

      const lire = async () => {
        const reponse = await fetch(environment.apiBaseUrl + 'chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...this.entetesAuth() },
          body: JSON.stringify({ messages: historique }),
          signal
        });

        if (!reponse.ok) {
          throw await this.erreurHttp(reponse);
        }
        if (!reponse.body) {
          throw new Error('Réponse vide du serveur.');
        }

        const lecteur = reponse.body.getReader();
        const decodeur = new TextDecoder();
        let tampon = '';

        while (true) {
          const { done, value } = await lecteur.read();
          if (done) break;
          tampon += decodeur.decode(value, { stream: true }).replace(/\r\n/g, '\n');

          // Un événement SSE se termine par une ligne vide ; le reste incomplet reste dans le tampon
          let fin = tampon.indexOf('\n\n');
          while (fin !== -1) {
            const evenement = this.analyserEvenement(tampon.slice(0, fin));
            tampon = tampon.slice(fin + 2);
            if (evenement) observateur.next(evenement);
            fin = tampon.indexOf('\n\n');
          }
        }

        // Dernier événement éventuel non suivi d'une ligne vide
        const dernier = this.analyserEvenement(tampon + decodeur.decode());
        if (dernier) observateur.next(dernier);
        observateur.complete();
      };

      lire().catch(erreur => {
        // Interruption volontaire (Stop, fermeture) : fin silencieuse
        if (signal.aborted || erreur?.name === 'AbortError') {
          observateur.complete();
        } else if (erreur instanceof TypeError) {
          observateur.error(new Error('Serveur injoignable. Vérifiez votre connexion.'));
        } else {
          observateur.error(erreur);
        }
      });
    });
  }

  /** Disponibilité de Sonneur (une seule question traitée à la fois sur le serveur). */
  async etat(): Promise<EtatSonneur> {
    const reponse = await fetch(environment.apiBaseUrl + 'chat/etat', { headers: this.entetesAuth() });
    if (!reponse.ok) throw await this.erreurHttp(reponse);
    return reponse.json();
  }

  /**
   * En-tête Bearer ajouté à la main (l'intercepteur ne s'applique pas à `fetch`).
   * Jeton expiré (valable 1 h) : on prévient tout de suite plutôt que d'attendre le 401.
   */
  private entetesAuth(): Record<string, string> {
    const token = localStorage.getItem('token');
    if (token && this.jetonExpire(token)) {
      throw new ErreurChat('Session expirée, reconnectez-vous puis reposez votre question.', 401, 'TOKEN_EXPIRE');
    }
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /** Lit `exp` dans la charge utile du JWT (sans vérifier la signature : simple confort d'affichage). */
  private jetonExpire(token: string): boolean {
    try {
      const charge = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const { exp } = JSON.parse(atob(charge));
      return typeof exp === 'number' && exp * 1000 <= Date.now();
    } catch {
      return false;
    }
  }

  /** Transforme un bloc `event: ...\ndata: ...` en événement typé. */
  private analyserEvenement(bloc: string): EvenementChat | null {
    let type = 'message';
    const lignesData: string[] = [];

    for (const ligne of bloc.split('\n')) {
      if (ligne.startsWith('event:')) {
        type = ligne.slice(6).trim();
      } else if (ligne.startsWith('data:')) {
        lignesData.push(ligne.slice(5).replace(/^ /, ''));
      }
    }
    if (lignesData.length === 0) return null;

    try {
      return { type, donnees: JSON.parse(lignesData.join('\n')) } as EvenementChat;
    } catch {
      console.warn('Événement SSE illisible :', bloc);
      return null;
    }
  }

  /** Erreur lisible pour une réponse HTTP en erreur (hors flux). */
  private async erreurHttp(reponse: Response): Promise<ErreurChat> {
    let corps: { message?: string; code?: string } | null = null;
    try {
      corps = await reponse.json();
    } catch {
      // Corps non JSON : message par défaut
    }
    const message = corps?.message || this.messageParDefaut(reponse.status);
    return new ErreurChat(message, reponse.status, corps?.code);
  }

  private messageParDefaut(statut: number): string {
    switch (statut) {
      case 401:
      case 403:
        return 'Session expirée, reconnectez-vous puis reposez votre question.';
      case 503:
        return 'Sonneur est occupé à répondre à une autre question. Réessayez dans quelques minutes.';
      case 429:
        return 'Trop de questions en peu de temps, patientez quelques minutes.';
      case 400:
        return 'Conversation invalide, lancez une nouvelle conversation.';
      case 413:
        return 'Conversation trop longue : ouvrez une nouvelle conversation pour continuer.';
      default:
        return `Erreur du serveur (${statut}).`;
    }
  }
}
