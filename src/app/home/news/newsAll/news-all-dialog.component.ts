import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { News } from '../../../shared/interfaces/news';
import { NewsService } from '../../../shared/services/news.service';
import { NewsDetailDialogComponent } from '../newsDetail/news-detail-dialog.component';
import { TempsEcoulePipe } from '../temps-ecoule.pipe';

/** Nombre de billets chargés à chaque « Voir plus » de la liste complète */
const PAGE = 20;

/**
 * Fenêtre listant tous les billets d'actualité, y compris ceux masqués de l'accueil,
 * du plus récent au plus ancien.
 * Ouverte depuis la carte « Toutes les actualités » du fil d'accueil ;
 * un clic sur un billet ouvre la fenêtre de détail habituelle par-dessus.
 */
@Component({
  selector: 'app-news-all-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule, TempsEcoulePipe],
  templateUrl: './news-all-dialog.component.html',
  styleUrl: './news-all-dialog.component.scss',
})
export class NewsAllDialogComponent implements OnInit {
  news: News[] = [];
  loading = true;
  loadingMore = false;
  error = false;
  /** Faux dès qu'une page revient incomplète : plus rien à charger */
  hasMore = true;

  constructor(
    private newsService: NewsService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<NewsAllDialogComponent>,
  ) {}

  ngOnInit(): void {
    this.newsService
      .getNews(PAGE, 0, true)
      .then((news) => {
        this.news = news;
        this.hasMore = news.length === PAGE;
      })
      .catch((err) => {
        console.error('Erreur lors du chargement de toutes les actualités', err);
        this.error = true;
      })
      .finally(() => (this.loading = false));
  }

  loadMore(): void {
    this.loadingMore = true;
    this.newsService
      .getNews(PAGE, this.news.length, true)
      .then((news) => {
        this.news = [...this.news, ...news];
        this.hasMore = news.length === PAGE;
      })
      .catch((err) => console.error('Erreur lors du chargement des actualités suivantes', err))
      .finally(() => (this.loadingMore = false));
  }

  openDetail(item: News): void {
    this.dialog
      .open(NewsDetailDialogComponent, {
        width: '560px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        data: item,
      })
      .afterClosed()
      .subscribe(() => {
        // La fenêtre de détail modifie l'objet en place (lu, commentaires) : rafraîchir la liste
        this.news = [...this.news];
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
