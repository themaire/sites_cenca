import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { NewsService } from '../../shared/services/news.service';
import { News } from '../../shared/interfaces/news';
import { NewsDetailDialogComponent } from './newsDetail/news-detail-dialog.component';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss',
})
export class NewsComponent implements OnInit {
  news: News[] = [];
  loading = true;
  error = false;

  constructor(
    private newsService: NewsService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.newsService
      .getNews(5)
      .then((news) => {
        this.news = news;
        this.loading = false;
      })
      .catch((err) => {
        console.error('Erreur lors du chargement des actualités', err);
        this.error = true;
        this.loading = false;
      });
  }

  openDetail(item: News): void {
    this.dialog.open(NewsDetailDialogComponent, {
      width: '480px',
      maxWidth: '90vw',
      data: item,
    });
  }
}
