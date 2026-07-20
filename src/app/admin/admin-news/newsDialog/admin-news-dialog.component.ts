import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MomentDateAdapter, provideMomentDateAdapter } from '@angular/material-moment-adapter';
import 'moment/locale/fr';

import { AdminService } from '../../admin.service';
import { FormAdmin } from '../../form-admin';
import { FormService } from '../../../shared/services/form.service';
import { News } from '../../../shared/interfaces/news';
import { FormButtonsComponent } from '../../../shared/form-buttons/form-buttons.component';
import { ConfirmationService } from '../../../shared/services/confirmation.service';

// Configuration des formats de date
export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-admin-news-dialog',
  standalone: true,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    provideMomentDateAdapter(),
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    FormButtonsComponent,
  ],
  templateUrl: './admin-news-dialog.component.html',
  styleUrl: './admin-news-dialog.component.scss'
})
export class AdminNewsDialogComponent implements OnInit {
  loading = true;
  error: string | null = null;
  newsItem: News | null = null;

  // Formulaire réactif
  newsForm!: FormGroup;
  initialFormValues!: FormGroup;

  // Flags pour FormButtonsComponent
  isEditActive: boolean = false;
  isAddActive: boolean = false;
  isFormValid: boolean = false;

  isNewNews: boolean = false;

  constructor(
    private adminService: AdminService,
    private confirmationService: ConfirmationService,
    private formAdmin: FormAdmin,
    private formService: FormService,
    private dialogRef: MatDialogRef<AdminNewsDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { id: number | null, isNew?: boolean },
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      if (this.data.isNew) {
        this.isNewNews = true;
        this.isAddActive = true;
        this.newsForm = this.formAdmin.newsForm();
        this.newsForm.enable();
      } else {
        this.newsItem = await this.adminService.getNewsById(String(this.data.id));
        this.newsForm = this.formAdmin.newsForm(this.newsItem || undefined);
        this.newsForm.disable();
      }

      this.initialFormValues = this.newsForm.value;
      this.newsForm.statusChanges.subscribe(() => {
        this.isFormValid = this.newsForm.valid;
      });
    } catch (e: any) {
      console.error(e);
      this.error = 'Impossible de charger le détail de l\'actualité.';
    } finally {
      this.loading = false;
    }
  }

  toggleEdit(): void {
    this.isEditActive = !this.isEditActive;
    if (this.isEditActive) {
      this.newsForm.enable();
    } else {
      // Annuler : recharger les valeurs initiales
      this.newsForm.patchValue(this.newsItem!);
      this.newsForm.disable();
    }
  }

  onSubmit(): void {
    console.log("Modification d'un formulaire actualité :", this.newsForm.value);
    console.log("this.isNewNews =", this.isNewNews);

    this.newsForm.patchValue({
      date_publication: this.formService.formatDateToPostgres(this.newsForm.get('date_publication')?.value),
    });

    if (this.isNewNews) {
      const submitObservable = this.formAdmin.putbdd('insert', 'news', this.newsForm, this.isAddActive, this.snackBar);
      if (submitObservable) {
        submitObservable.subscribe({
          next: () => {
            this.dialogRef.close(true);
          },
          error: (error) => {
            this.snackBar.open('Erreur lors de la création de l\'actualité. ' + error.message, 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-error'],
            });
          }
        });
      }
    } else {
      const id = String(this.newsItem?.id ?? '');
      const submitObservable = this.formAdmin.putbdd('update', 'news', this.newsForm, this.isEditActive, this.snackBar, id, this.initialFormValues);

      if (submitObservable) {
        submitObservable.subscribe({
          next: (result) => {
            this.isEditActive = result.isEditMode;
            this.initialFormValues = result.formValue;
          },
          error: (error) => {
            this.snackBar.open('Erreur lors de l\'enregistrement des modifications. ' + error.message, 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-error'],
            });
          }
        });
      }

      this.isEditActive = false;
      this.newsForm.disable();
    }
  }

  /**
   * Affiche une boîte de dialogue de confirmation pour la suppression d'une actualité.
   */
  deleteItemConfirm(): void {
    const message = `Voulez-vous vraiment supprimer l'actualité "${this.newsItem?.titre}" ?\n<strong>Cette action est irréversible.</strong>`;

    this.confirmationService.confirm('Confirmation de suppression', message, 'delete').subscribe(result => {
      if (result) {
        this.adminService.deleteNews(String(this.newsItem?.id ?? '')).subscribe(response => {
          if (response.success) {
            this.close();
          }
          // En cas d'erreur, le service adminService gère l'affichage du message d'erreur
        });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
