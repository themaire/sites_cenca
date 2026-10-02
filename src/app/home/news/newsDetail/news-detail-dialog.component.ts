import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { News, NewsComment } from '../../../shared/interfaces/news';
import { NewsService } from '../../../shared/services/news.service';
import { AdminService } from '../../../admin/admin.service';
import { LoginService } from '../../../login/login.service';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { NewsReactionsComponent } from '../reactions/news-reactions.component';
import { TempsEcoulePipe } from '../temps-ecoule.pipe';

/** Longueur maximale d'un commentaire (doit correspondre à la contrainte SQL) */
const COMMENT_MAX = 1000;

@Component({
  selector: 'app-news-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    NewsReactionsComponent,
    TempsEcoulePipe,
  ],
  templateUrl: './news-detail-dialog.component.html',
  styleUrl: './news-detail-dialog.component.scss'
})
export class NewsDetailDialogComponent implements OnInit {
  loadingContenu = true;
  savingPublie = false;

  /** null = commentaires indisponibles (backend pas encore à jour) : la section est masquée */
  comments: NewsComment[] | null = null;
  loadingComments = true;
  sendingComment = false;

  readonly commentMax = COMMENT_MAX;
  publieControl = new FormControl<boolean>(true, { nonNullable: true });
  commentControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(COMMENT_MAX)],
  });

  constructor(
    private newsService: NewsService,
    private adminService: AdminService,
    public loginService: LoginService,
    private confirmationService: ConfirmationService,
    private snackbarService: SnackbarService,
    private dialogRef: MatDialogRef<NewsDetailDialogComponent>,
    // Objet partagé avec le fil d'accueil : il est modifié en place (Object.assign)
    // pour que réactions, compteur de commentaires et statut « lu » y soient reflétés.
    @Inject(MAT_DIALOG_DATA) public news: News,
  ) {}

  get canEditPublie(): boolean {
    return this.loginService.isAdmin();
  }

  ngOnInit(): void {
    // La liste (GET /news) ne renvoie pas `contenu` : il faut le détail (GET /news/:id)
    this.newsService.getNewsById(this.news.id)
      .then((full) => {
        Object.assign(this.news, full);
      })
      .catch((err) => {
        console.error('Erreur lors du chargement du détail de l\'actualité', err);
      })
      .finally(() => {
        this.loadingContenu = false;
      });

    this.loadComments();

    if (this.news.lu === false) {
      this.newsService.markAsRead(this.news.id)
        .then(() => (this.news.lu = true))
        .catch((err) => console.error('Erreur lors du marquage comme lue', err));
    }

    // Les routes publiques ne renvoient jamais `publie` (elles ne montrent que des news
    // déjà publiées) : si cette news est visible ici, elle est forcément publiée.
    this.publieControl.setValue(this.news.publie ?? true, { emitEvent: false });

    this.publieControl.valueChanges.subscribe((publie) => this.savePublie(publie));
  }

  private loadComments(): void {
    this.newsService.getComments(this.news.id)
      .then((comments) => {
        this.comments = comments;
        this.news.nb_commentaires = comments.length;
      })
      .catch((err) => {
        console.error('Erreur lors du chargement des commentaires', err);
        this.comments = null;
      })
      .finally(() => (this.loadingComments = false));
  }

  /** L'auteur peut supprimer son commentaire ; un admin (groupe 5) peut supprimer n'importe lequel (modération).
   * Revérifié côté backend. */
  canDelete(comment: NewsComment): boolean {
    return comment.cd_salarie === this.loginService.user()?.cd_salarie || this.loginService.isAdmin();
  }

  initiales(comment: NewsComment): string {
    return comment.initiales || `${comment.prenom?.[0] ?? ''}${comment.nom?.[0] ?? ''}`.toUpperCase();
  }

  sendComment(): void {
    const contenu = this.commentControl.value.trim();
    if (!contenu || this.commentControl.invalid || this.sendingComment || !this.comments) return;
    this.sendingComment = true;
    this.newsService.addComment(this.news.id, contenu)
      .then((comment) => {
        this.comments = [...this.comments!, comment];
        this.news.nb_commentaires = this.comments.length;
        this.commentControl.reset();
      })
      .catch((err) => {
        console.error('Erreur lors de l\'envoi du commentaire', err);
        this.snackbarService.error('Impossible d\'envoyer le commentaire');
      })
      .finally(() => (this.sendingComment = false));
  }

  deleteComment(comment: NewsComment): void {
    this.confirmationService.confirm('Supprimer le commentaire', 'Supprimer ce commentaire ?', 'delete').subscribe((ok) => {
      if (!ok) return;
      this.newsService.deleteComment(comment.id)
        .then(() => {
          this.comments = (this.comments ?? []).filter((c) => c.id !== comment.id);
          this.news.nb_commentaires = this.comments.length;
        })
        .catch((err) => {
          console.error('Erreur lors de la suppression du commentaire', err);
          this.snackbarService.error('Impossible de supprimer le commentaire');
        });
    });
  }

  private savePublie(publie: boolean): void {
    // AdminService.updateNews() ne fait jamais échouer l'observable (catchError interne) :
    // seul `response.success` indique un échec, et le snackbar est déjà géré par le service.
    this.savingPublie = true;
    // On n'envoie que les champs de la table gestint.news (pas les champs sociaux calculés)
    const { reactions, nb_commentaires, lu, ...newsData } = this.news;
    this.adminService.updateNews({ ...newsData, publie }, String(this.news.id)).subscribe((response) => {
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
