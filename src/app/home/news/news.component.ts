import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

import { NewsService } from '../../shared/services/news.service';
import { News } from '../../shared/interfaces/news';
import { NewsDetailDialogComponent } from './newsDetail/news-detail-dialog.component';
import { NewsReactionsComponent } from './reactions/news-reactions.component';
import { TempsEcoulePipe } from './temps-ecoule.pipe';

/** Nombre d'actualités chargées à chaque page du fil (2 lignes de 4 cartes) */
const PAGE = 8;

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatButtonModule, NewsReactionsComponent, TempsEcoulePipe],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss',
})
export class NewsComponent implements OnInit {
  news: News[] = [];
  loading = true;
  loadingMore = false;
  error = false;
  /** Faux dès qu'une page revient incomplète : plus rien à charger */
  hasMore = true;

  constructor(
    private newsService: NewsService,
    private dialog: MatDialog,
  ) {}

  /** Nombre d'actualités chargées que l'utilisateur n'a pas encore ouvertes */
  get nbNonLues(): number {
    return this.news.filter((n) => n.lu === false).length;
  }

  ngOnInit(): void {
    this.newsService
      .getNews(PAGE)
      .then((news) => {
        this.news = news;
        this.hasMore = news.length === PAGE;
        this.loading = false;
      })
      .catch((err) => {
        console.error('Erreur lors du chargement des actualités', err);
        this.error = true;
        this.loading = false;
      });
  }

  loadMore(): void {
    this.loadingMore = true;
    this.newsService
      .getNews(PAGE, this.news.length)
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
        // La fenêtre de détail met à jour l'objet partagé (réactions, commentaires, lu) :
        // nouvelle référence de tableau pour rafraîchir l'affichage
        this.news = [...this.news];
      });
  }
}
