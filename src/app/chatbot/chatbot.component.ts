import { Component, ElementRef, OnDestroy, ViewChild, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { marked } from 'marked';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AppelOutil, ChatbotService, ErreurChat, MessageChat, SONNEUR_OCCUPE } from '../shared/services/chatbot.service';
import { ChantSonneur } from './chant-sonneur';

/** État d'affichage du chatbot : bouton seul, panneau ou plein écran. */
export type ModeChatbot = 'replie' | 'panneau' | 'agrandi';

/** Libellés lisibles des requêtes métier du serveur MCP. */
const LIBELLES_OUTILS: Record<string, string> = {
  rechercher_sites: 'Recherche de sites',
  fiche_site: 'Fiche du site',
  geometrie_site: 'Contour du site',
  sites_autour_point: "Sites autour d'un point",
  sites_par_commune: 'Sites de la commune',
  synthese_sites: 'Synthèse des sites',
  foncier_site: 'Maîtrise foncière',
  echeances_actes: 'Échéances des actes',
  rechercher_projets: 'Recherche de projets',
  operations_projet: 'Opérations du projet',
  bilan_operations: 'Bilan des opérations',
  travaux_site: 'Travaux du site',
};

const CLE_HISTORIQUE = 'chatbot_historique';
const CLE_MODE = 'chatbot_mode';
/** Préférence durable (localStorage) : chant de fin de réponse activé ou coupé. */
const CLE_SON = 'chatbot_son';
/** Intervalle d'interrogation de `GET chat/etat` quand le panneau est ouvert. */
const INTERVALLE_ETAT_MS = 15_000;

/**
 * Sonneur, l'assistant IA des sites du CENCA (nommé d'après le sonneur à ventre jaune).
 *
 * Toujours ancré en bas à droite : replié (bouton), en panneau ou agrandi dans la fenêtre.
 * Le front porte la conversation (le backend est sans état) et la sauvegarde
 * dans le sessionStorage pour qu'elle survive à la navigation.
 */
@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss'
})
export class ChatbotComponent implements OnDestroy {
  @ViewChild('listeMessages') listeMessages?: ElementRef<HTMLElement>;
  @ViewChild('zoneSaisie') zoneSaisie?: ElementRef<HTMLTextAreaElement>;

  readonly avatar = 'assets/chatbot/sonneur.svg';
  readonly exemples = [
    'Quels actes fonciers arrivent à échéance dans les 6 mois ?',
    'Quels sont les nouveaux sites de 2025 dans l\'Aube ?',
    'Quels sont les plus grands sites gérés par Romaric ?',
  ];
  /** Questions d'aide, pour découvrir ce que sait faire Sonneur. */
  readonly aides = ['Que sais-tu faire ?', 'Aide', 'Des exemples ?'];

  mode = signal<ModeChatbot>(this.lireMode());
  messages = signal<MessageChat[]>(this.lireHistorique());
  enCours = signal(false);
  outilEnCours = signal<string | null>(null);
  /** File d'attente du serveur : message affiché tant que la génération n'a pas commencé. */
  attente = signal<string | null>(null);
  /** Réponse arrivée pendant que le chatbot était replié. */
  reponseNonLue = signal(false);
  /** Sonneur chante quand une réponse arrive hors de vue (coupable depuis l'en-tête). */
  sonActif = signal(this.lireSon());
  /** Sonneur répond déjà à la question d'un autre utilisateur : message du serveur, sinon null. */
  occupe = signal<string | null>(null);
  /** Question restée sans réponse après un rechargement de la page : remise dans la saisie. */
  questionInterrompue = signal(false);
  /** Saisie bloquée tant que Sonneur est occupé (les questions d'aide restent possibles). */
  bloqueParOccupation = computed(() => !!this.occupe() && !this.enCours());
  saisie = '';
  avatarIndisponible = false;

  /** Questions encore possibles, d'après le dernier `fin` reçu (null si inconnu). */
  questionsRestantes = computed<number | null>(() => {
    const derniere = [...this.messages()].reverse()
      .find(m => m.role === 'assistant' && m.questionsRestantes !== undefined);
    return derniere?.questionsRestantes ?? null;
  });

  /** Conversation pleine : plus de question possible (limite atteinte ou 413). */
  conversationTerminee = computed(() =>
    this.questionsRestantes() === 0 || !!this.messages().at(-1)?.conversationPleine
  );

  private controleur: AbortController | null = null;
  private abonnement: Subscription | null = null;
  /** Cache du rendu Markdown, pour ne pas reparser à chaque détection de changements. */
  private rendus = new WeakMap<MessageChat, { source: string; html: string }>();
  private chant = new ChantSonneur();
  private minuterieEtat: ReturnType<typeof setInterval> | null = null;

  constructor(private chatbotService: ChatbotService, private router: Router) {
    this.reprendreQuestionInterrompue();

    // Panneau ouvert : on surveille la disponibilité de Sonneur ; replié : on arrête
    effect(() => {
      if (this.mode() === 'replie') {
        this.arreterSurveillance();
      } else {
        this.surveillerEtat();
      }
    });
  }

  ngOnDestroy(): void {
    this.arreterSurveillance();
    this.interrompre();
    this.chant.fermer();
  }

  // --- Disponibilité de Sonneur --------------------------------------------

  private surveillerEtat(): void {
    if (this.minuterieEtat) return;
    void this.verifierEtat();
    this.minuterieEtat = setInterval(() => void this.verifierEtat(), INTERVALLE_ETAT_MS);
  }

  private arreterSurveillance(): void {
    if (this.minuterieEtat) clearInterval(this.minuterieEtat);
    this.minuterieEtat = null;
  }

  /** Inutile pendant sa propre question : c'est elle qui occupe Sonneur. */
  private async verifierEtat(): Promise<void> {
    if (this.enCours()) return;
    try {
      const etat = await this.chatbotService.etat();
      if (!this.enCours()) {
        this.occupe.set(etat.occupe ? (etat.message || 'Sonneur est occupé. Réessayez dans quelques minutes.') : null);
      }
    } catch {
      // État indisponible (réseau, session) : on ne bloque pas, l'envoi dira ce qu'il en est
      this.occupe.set(null);
    }
  }

  // --- Affichage -----------------------------------------------------------

  ouvrir(): void {
    this.reponseNonLue.set(false);
    this.changerMode('panneau');
    this.defilerEnBas();
    setTimeout(() => this.zoneSaisie?.nativeElement.focus());
  }

  /** Replie le chatbot ; une génération en cours continue en arrière-plan. */
  fermer(): void {
    this.changerMode('replie');
  }

  /** Active ou coupe le chant ; à l'activation, Sonneur fait entendre son chant. */
  basculerSon(): void {
    const actif = !this.sonActif();
    this.sonActif.set(actif);
    try {
      localStorage.setItem(CLE_SON, actif ? 'oui' : 'non');
    } catch {
      // localStorage indisponible : le choix vaut pour cette page seulement
    }
    if (actif) {
      this.chant.preparer();
      this.chant.jouer();
    }
  }

  basculerTaille(): void {
    this.changerMode(this.mode() === 'agrandi' ? 'panneau' : 'agrandi');
    this.defilerEnBas();
  }

  private changerMode(mode: ModeChatbot): void {
    this.mode.set(mode);
    try {
      sessionStorage.setItem(CLE_MODE, mode);
    } catch {
      // sessionStorage indisponible : sans conséquence
    }
  }

  // --- Conversation --------------------------------------------------------

  nouvelleConversation(): void {
    this.interrompre();
    this.messages.set([]);
    this.questionInterrompue.set(false);
    this.sauvegarder();
    this.zoneSaisie?.nativeElement.focus();
  }

  /** Entrée envoie, Maj+Entrée fait un retour à la ligne. */
  surTouche(evenement: KeyboardEvent): void {
    if (evenement.key === 'Enter' && !evenement.shiftKey && !evenement.isComposing) {
      evenement.preventDefault();
      this.envoyer();
    }
  }

  envoyer(texte: string = this.saisie): void {
    const question = texte.trim();
    if (!question || this.enCours() || this.conversationTerminee()) return;
    // Sonneur occupé : seules les questions d'aide passent (réponse immédiate du backend)
    if (this.occupe() && !this.estQuestionAide(question)) return;

    const avant = this.messages();
    this.saisie = '';
    // L'envoi est un geste de l'utilisateur : le navigateur autorisera le chant à la fin
    if (this.sonActif()) this.chant.preparer();
    const reponse: MessageChat = { role: 'assistant', content: '', outils: [] };
    const historique = [...this.messages(), { role: 'user' as const, content: question }];
    this.messages.set([...historique, reponse]);
    this.questionInterrompue.set(false);
    // Sauvegardée dès l'envoi : un rechargement de page pendant la réponse ne perd pas la question
    this.sauvegarder();
    this.enCours.set(true);
    this.outilEnCours.set(null);
    this.attente.set(null);
    this.defilerEnBas();

    this.controleur = new AbortController();
    this.abonnement = this.chatbotService.envoyer(historique, this.controleur.signal).subscribe({
      next: evenement => {
        // Tout autre événement signifie que la question est sortie de la file d'attente
        if (evenement.type !== 'attente') this.attente.set(null);
        switch (evenement.type) {
          case 'attente':
            this.attente.set(evenement.donnees.message);
            break;
          case 'outil':
            reponse.outils = [...(reponse.outils ?? []), evenement.donnees];
            this.outilEnCours.set(this.libelleOutil(evenement.donnees.nom));
            break;
          case 'texte':
            reponse.content += evenement.donnees.texte;
            this.outilEnCours.set(null);
            break;
          case 'fin':
            reponse.modele = evenement.donnees.modele;
            reponse.questionsRestantes = evenement.donnees.questions_restantes;
            break;
          case 'erreur':
            reponse.content = evenement.donnees.message;
            reponse.erreur = true;
            reponse.occupe = evenement.donnees.code === SONNEUR_OCCUPE;
            break;
        }
        this.rafraichir();
      },
      error: (erreur: Error) => {
        reponse.content = erreur.message || 'Une erreur est survenue.';
        reponse.erreur = true;
        if (erreur instanceof ErreurChat) {
          reponse.conversationPleine = erreur.statut === 413;
          reponse.occupe = erreur.statut === 503 || erreur.code === SONNEUR_OCCUPE;
          // Session expirée : la question revient dans la saisie, à renvoyer après reconnexion
          if (erreur.statut === 401 || erreur.statut === 403) this.saisie = question;
        }
        this.terminer();
        if (reponse.occupe) this.refuserPourOccupation(avant, question, reponse.content);
      },
      complete: () => {
        this.terminer();
        if (reponse.occupe) {
          this.refuserPourOccupation(avant, question, reponse.content);
          return;
        }
        // Réponse arrivée jusqu'au bout (pas d'erreur ; un Stop n'appelle pas complete),
        // pendant que l'utilisateur ne regarde pas : panneau replié ou onglet en arrière-plan
        const horsDeVue = this.mode() === 'replie' || document.hidden;
        if (this.sonActif() && horsDeVue && reponse.content.trim() && !reponse.erreur) this.chant.jouer();
      },
    });
  }

  /**
   * Refus « Sonneur occupé » : la question n'entre pas dans l'historique, elle revient
   * dans la saisie pour être renvoyée quand Sonneur sera libre.
   */
  private refuserPourOccupation(avant: MessageChat[], question: string, message: string): void {
    this.messages.set(avant);
    this.sauvegarder();
    this.saisie = question;
    this.occupe.set(message);
  }

  estQuestionAide(question: string): boolean {
    const normalisee = question.trim().toLowerCase();
    return this.aides.some(aide => aide.toLowerCase() === normalisee);
  }

  /** Bouton Stop : arrête la génération (le backend arrête le modèle). */
  interrompre(): void {
    if (!this.controleur) return;
    this.controleur.abort();
    this.abonnement?.unsubscribe();
    this.terminer();
  }

  private terminer(): void {
    this.controleur = null;
    this.abonnement = null;
    this.enCours.set(false);
    this.outilEnCours.set(null);
    this.attente.set(null);
    // Réponse interrompue avant tout texte : on retire la bulle vide
    const derniere = this.messages().at(-1);
    if (derniere?.role === 'assistant' && !derniere.content.trim()) {
      this.messages.set(this.messages().slice(0, -1));
    } else if (derniere?.role === 'assistant' && this.mode() === 'replie') {
      this.reponseNonLue.set(true);
    }
    this.rafraichir();
    this.sauvegarder();
  }

  /** Nouvelle référence du tableau pour notifier le signal, puis défilement. */
  private rafraichir(): void {
    this.messages.set([...this.messages()]);
    this.defilerEnBas();
  }

  // --- Rendu ---------------------------------------------------------------

  /** Markdown → HTML (assaini par Angular via [innerHTML]). */
  rendreMarkdown(message: MessageChat): string {
    const cache = this.rendus.get(message);
    if (cache && cache.source === message.content) return cache.html;
    const html = marked.parse(message.content, { breaks: true, gfm: true, async: false }) as string;
    this.rendus.set(message, { source: message.content, html });
    return html;
  }

  /**
   * Liens des réponses : un lien interne (ex. `/site/<uuid>`) ouvre la page dans l'application,
   * sans recharger ; un lien externe s'ouvre dans un nouvel onglet.
   */
  surClicMarkdown(evenement: MouseEvent): void {
    const lien = (evenement.target as HTMLElement).closest('a');
    const href = lien?.getAttribute('href');
    if (!lien || !href) return;
    // Ctrl/Maj/clic molette : on laisse le navigateur ouvrir un nouvel onglet
    if (evenement.ctrlKey || evenement.metaKey || evenement.shiftKey || evenement.button !== 0) return;

    const url = new URL(href, window.location.origin);
    evenement.preventDefault();
    if (url.origin !== window.location.origin) {
      window.open(url.href, '_blank', 'noopener');
      return;
    }

    this.router.navigateByUrl(url.pathname + url.search + url.hash);
    // Laisser voir la page ouverte : en plein écran ou sur mobile, le chatbot cède la place
    if (window.matchMedia('(max-width: 545px)').matches) {
      this.fermer();
    } else if (this.mode() === 'agrandi') {
      this.changerMode('panneau');
    }
  }

  /** Libellé lisible ; un outil récent du serveur MCP, encore absent de la table, reste lisible. */
  libelleOutil(nom: string): string {
    if (LIBELLES_OUTILS[nom]) return LIBELLES_OUTILS[nom];
    const texte = nom.replace(/_/g, ' ');
    return texte.charAt(0).toUpperCase() + texte.slice(1);
  }

  formaterArguments(outil: AppelOutil): string {
    const valeurs = Object.entries(outil.arguments ?? {})
      .map(([cle, valeur]) => `${cle} : ${typeof valeur === 'string' ? valeur : JSON.stringify(valeur)}`);
    return valeurs.length ? valeurs.join(', ') : 'sans argument';
  }

  /** Conversation enregistrable : au moins une réponse aboutie, aucune génération en cours. */
  conversationEnregistrable = computed(() =>
    !this.enCours() && this.messages().some(m => m.role === 'assistant' && !m.erreur && m.content.trim())
  );

  /**
   * Enregistre toute la conversation dans un fichier texte : chaque question, sa réponse
   * (Markdown brut, lisible tel quel) et les requêtes utilisées, pour garder la trace de la
   * provenance des données. Les messages d'erreur sont écartés.
   */
  enregistrerConversation(): void {
    if (!this.conversationEnregistrable()) return;

    const maintenant = new Date();
    const deux = (n: number) => String(n).padStart(2, '0');
    const jour = `${maintenant.getFullYear()}-${deux(maintenant.getMonth() + 1)}-${deux(maintenant.getDate())}`;
    const heure = `${deux(maintenant.getHours())}h${deux(maintenant.getMinutes())}`;
    const separateur = '-'.repeat(60);

    const lignes = [
      `Conversation avec Sonneur, assistant sites du CENCA — ${maintenant.toLocaleDateString('fr-FR')} à ${heure}`,
    ];
    const modeles = new Set<string>();
    for (const message of this.messages()) {
      if (message.erreur || !message.content.trim()) continue;
      if (message.role === 'user') {
        lignes.push('', separateur, `QUESTION : ${message.content.trim()}`, separateur, '');
        continue;
      }
      lignes.push(message.content.trim());
      if (message.outils?.length) {
        lignes.push('', `Requêtes utilisées (${message.outils.length}) :`);
        message.outils.forEach(outil =>
          lignes.push(`- ${this.libelleOutil(outil.nom)} (${outil.nom}) : ${this.formaterArguments(outil)}`)
        );
      }
      if (message.modele) modeles.add(message.modele);
    }
    lignes.push('', separateur);
    if (modeles.size) lignes.push(`Modèle : ${[...modeles].join(', ')}`);
    lignes.push('Assistant IA local, lecture seule : vérifiez les informations importantes.');

    // BOM UTF-8 : accents corrects à l'ouverture dans le Bloc-notes et les vieux éditeurs Windows
    const fichier = new Blob(['﻿' + lignes.join('\r\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(fichier);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = `sonneur_${jour}_${heure}.txt`;
    lien.click();
    setTimeout(() => URL.revokeObjectURL(url));
  }

  estEnCoursDeGeneration(index: number): boolean {
    return this.enCours() && index === this.messages().length - 1;
  }

  private defilerEnBas(): void {
    setTimeout(() => {
      const liste = this.listeMessages?.nativeElement;
      // Écran d'accueil (pas encore de message) : on garde le début du message de bienvenue visible
      if (liste) liste.scrollTop = this.messages().length ? liste.scrollHeight : 0;
    });
  }

  // --- Persistance ---------------------------------------------------------

  private sauvegarder(): void {
    try {
      sessionStorage.setItem(CLE_HISTORIQUE, JSON.stringify(this.messages()));
    } catch {
      // sessionStorage indisponible ou plein : l'historique reste en mémoire
    }
  }

  /**
   * Page rechargée pendant une réponse : la conversation sauvegardée se termine par la
   * question (et une bulle de réponse vide). On retire la question de l'historique et on
   * la remet dans la saisie, pour la renvoyer en un clic.
   */
  private reprendreQuestionInterrompue(): void {
    const messages = [...this.messages()];
    const derniere = messages.at(-1);
    if (derniere?.role === 'assistant' && !derniere.content.trim()) messages.pop();
    const question = messages.at(-1);
    if (question?.role !== 'user') return;

    messages.pop();
    this.messages.set(messages);
    this.sauvegarder();
    this.saisie = question.content;
    this.questionInterrompue.set(true);
  }

  private lireHistorique(): MessageChat[] {
    try {
      const brut = sessionStorage.getItem(CLE_HISTORIQUE);
      const messages = brut ? JSON.parse(brut) : [];
      return Array.isArray(messages) ? messages : [];
    } catch {
      return [];
    }
  }

  private lireSon(): boolean {
    try {
      return localStorage.getItem(CLE_SON) !== 'non';
    } catch {
      return true;
    }
  }

  private lireMode(): ModeChatbot {
    try {
      const mode = sessionStorage.getItem(CLE_MODE);
      return mode === 'panneau' || mode === 'agrandi' ? mode : 'replie';
    } catch {
      return 'replie';
    }
  }
}
