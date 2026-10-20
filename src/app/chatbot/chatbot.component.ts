import { Component, ElementRef, OnDestroy, ViewChild, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { marked } from 'marked';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AppelOutil, ChatbotService, ErreurChat, MessageChat } from '../shared/services/chatbot.service';
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
};

const CLE_HISTORIQUE = 'chatbot_historique';
const CLE_MODE = 'chatbot_mode';
/** Préférence durable (localStorage) : chant de fin de réponse activé ou coupé. */
const CLE_SON = 'chatbot_son';

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
    'Quels sites gérons-nous à Reims ?',
    'Bilan des travaux réalisés en 2025 par type d\'action',
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

  constructor(private chatbotService: ChatbotService, private router: Router) {}

  ngOnDestroy(): void {
    this.interrompre();
    this.chant.fermer();
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

    this.saisie = '';
    // L'envoi est un geste de l'utilisateur : le navigateur autorisera le chant à la fin
    if (this.sonActif()) this.chant.preparer();
    const reponse: MessageChat = { role: 'assistant', content: '', outils: [] };
    const historique = [...this.messages(), { role: 'user' as const, content: question }];
    this.messages.set([...historique, reponse]);
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
            break;
        }
        this.rafraichir();
      },
      error: (erreur: Error) => {
        reponse.content = erreur.message || 'Une erreur est survenue.';
        reponse.erreur = true;
        reponse.conversationPleine = erreur instanceof ErreurChat && erreur.statut === 413;
        this.terminer();
      },
      complete: () => {
        this.terminer();
        // Réponse arrivée jusqu'au bout (pas d'erreur ; un Stop n'appelle pas complete),
        // pendant que l'utilisateur ne regarde pas : panneau replié ou onglet en arrière-plan
        const horsDeVue = this.mode() === 'replie' || document.hidden;
        if (this.sonActif() && horsDeVue && reponse.content.trim() && !reponse.erreur) this.chant.jouer();
      },
    });
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

  libelleOutil(nom: string): string {
    return LIBELLES_OUTILS[nom] ?? nom;
  }

  formaterArguments(outil: AppelOutil): string {
    const valeurs = Object.entries(outil.arguments ?? {})
      .map(([cle, valeur]) => `${cle} : ${typeof valeur === 'string' ? valeur : JSON.stringify(valeur)}`);
    return valeurs.length ? valeurs.join(', ') : 'sans argument';
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
