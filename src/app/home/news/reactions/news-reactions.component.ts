import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

import { News, NewsReaction } from '../../../shared/interfaces/news';
import { NEWS_REACTIONS, NewsService } from '../../../shared/services/news.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';

/**
 * Barre de réactions d'une actualité (fil d'accueil et fenêtre de détail).
 * Met à jour `news.reactions` en place avec la réponse du backend.
 */
@Component({
  selector: 'app-news-reactions',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './news-reactions.component.html',
  styleUrl: './news-reactions.component.scss',
})
export class NewsReactionsComponent {
  @Input({ required: true }) news!: News;
  @Output() changed = new EventEmitter<NewsReaction[]>();

  readonly choix = NEWS_REACTIONS;
  saving = false;

  constructor(
    private newsService: NewsService,
    private snackbarService: SnackbarService,
  ) {}

  reaction(emoji: string): NewsReaction | undefined {
    return this.news.reactions?.find((r) => r.emoji === emoji);
  }

  toggle(emoji: string, event: Event): void {
    // La barre est posée sur une carte cliquable : ne pas ouvrir le détail
    event.stopPropagation();
    if (this.saving) return;
    this.saving = true;
    this.newsService
      .toggleReaction(this.news.id, emoji)
      .then((reactions) => {
        this.news.reactions = reactions;
        this.changed.emit(reactions);
      })
      .catch((err) => {
        console.error('Erreur lors de la réaction', err);
        this.snackbarService.error("Impossible d'enregistrer la réaction");
      })
      .finally(() => (this.saving = false));
  }
}
