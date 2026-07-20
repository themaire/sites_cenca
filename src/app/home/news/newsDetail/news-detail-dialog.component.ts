import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { News } from '../../../shared/interfaces/news';
import { NewsService } from '../../../shared/services/news.service';
import { AdminService } from '../../../admin/admin.service';
import { LoginService } from '../../../login/login.service';

const ADMIN_GROUP = 5;

@Component({
  selector: 'app-news-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    ReactiveFormsModule,
  ],
  templateUrl: './news-detail-dialog.component.html',
  styleUrl: './news-detail-dialog.component.scss'
})
export class NewsDetailDialogComponent implements OnInit {
  loadingContenu = true;
  savingPublie = false;

  publieControl = new FormControl<boolean>(true, { nonNullable: true });

  constructor(
    private newsService: NewsService,
    private adminService: AdminService,
    private loginService: LoginService,
    private dialogRef: MatDialogRef<NewsDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public news: News,
  ) {}

  get canEditPublie(): boolean {
    const groups = this.loginService.user()?.groups || [];
    return groups.map(Number).includes(ADMIN_GROUP);
  }

  ngOnInit(): void {
    // La liste (GET /news) ne renvoie pas `contenu` : il faut le détail (GET /news/:id)
    this.newsService.getNewsById(this.news.id)
      .then((full) => {
        this.news = { ...this.news, ...full };
      })
      .catch((err) => {
        console.error('Erreur lors du chargement du détail de l\'actualité', err);
      })
      .finally(() => {
        this.loadingContenu = false;
      });

    // Les routes publiques ne renvoient jamais `publie` (elles ne montrent que des news
    // déjà publiées) : si cette news est visible ici, elle est forcément publiée.
    this.publieControl.setValue(this.news.publie ?? true, { emitEvent: false });

    this.publieControl.valueChanges.subscribe((publie) => this.savePublie(publie));
  }

  private savePublie(publie: boolean): void {
    // AdminService.updateNews() ne fait jamais échouer l'observable (catchError interne) :
    // seul `response.success` indique un échec, et le snackbar est déjà géré par le service.
    this.savingPublie = true;
    this.adminService.updateNews({ ...this.news, publie }, String(this.news.id)).subscribe((response) => {
      this.savingPublie = false;
      if (response.success) {
        this.news.publie = publie;
      } else {
        // Revenir à l'état précédent sans redéclencher une sauvegarde
        this.publieControl.setValue(!publie, { emitEvent: false });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
