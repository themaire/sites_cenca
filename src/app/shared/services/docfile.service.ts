import { Injectable, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ApiResponse } from '../interfaces/api';
import { ProjetService } from '../../sites/site-detail/detail-projets/projets.service';
import { SitesService } from '../../sites/sites.service';
import { Localisation } from '../../shared/interfaces/localisation';

import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError } from 'rxjs/operators';
import { FormGroup } from '@angular/forms';

import { DetailPmfuComponent } from '../../sites/foncier/fon-pmfu/detail-pmfu/detail-pmfu.component';

@Injectable({ providedIn: 'root' })
export class DocfileService {
  hasFiles!: boolean;
  @ViewChildren('fileInput') fileInputs!: QueryList<
    ElementRef<HTMLInputElement>
  >;
  constructor(
    private projetService: ProjetService,
    private sitesService: SitesService,
    private snackBar: MatSnackBar
  ) {}

  onFileSelected(event: any, controlName: string, docForm: FormGroup) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files =
        controlName === 'photosSite'
          ? Array.from(input.files) // plusieurs fichiers
          : input.files[0]; // un seul fichier
      docForm.patchValue({ [controlName]: files });
      docForm.get(controlName)?.updateValueAndValidity();
    }
  }

  /** Méthode pour gérer la soumission du formulaire de doc
   * Verifie et affiche un snackbar en cas d'erreur
   * @param docForm - Formulaire contenant les données du docfiles
   * @param fileInputs - Référence aux éléments input de type fichier
   */
  handleDocfileSubmission(docForm: FormGroup, fileInputs: ElementRef, pmfu_id: number): void {
    if (!this.hasFiles) {
      this.snackBar.open('Aucun fichier sélectionné', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }
    console.log('pmfu_id dans handleDocfileSubmission():', pmfu_id);
    this.submitDocfiles(docForm, pmfu_id).subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
          // Vide les controls
          docForm.patchValue({
            noteBureau: null,
            decisionBureau: null,
            projetActe: null,
            photosSite: null,
          });

          // Vide les <input type="file">
          if (fileInputs) {
            this.fileInputs.forEach((ref) => (ref.nativeElement.value = ''));
          }

          this.snackBar.open('Docfiles importés avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
        } else {
          this.snackBar.open(
            response.message || "Erreur lors de l'import",
            'Fermer',
            { duration: 3000, panelClass: ['error-snackbar'] }
          );
        }
      },
      error: (error) => {
        console.error('Erreur de docfiles:', error?.error?.message);
        this.snackBar.open(
          error?.error?.message || "Erreur lors de l'import du docfiles",
          'Fermer',
          { duration: 3000, panelClass: ['error-snackbar'] }
        );
      },
    });
  }

  /** Soumettre le docfiles au backend */
  submitDocfiles(docForm: FormGroup, pmfu_id: number): Observable<ApiResponse> {
    if (!docForm) {
      return of({
        success: false,
        message: 'Formulaire introuvable.',
      } as ApiResponse);
    }
    console.log('Dans submitDocfiles() avec docForm:', docForm.value);
    const formData = new FormData();
    console.log('pmfu_id dans submitDocfiles():', pmfu_id);
    formData.append('pmfu_id', pmfu_id?.toString());
    console.log('pmfu_id à envoyer :', formData.get('pmfu_id'));
    // ajouter les fichiers un par un
    const noteBureau: File = docForm.get('noteBureau')?.value;
    if (noteBureau) formData.append('noteBureau', noteBureau);

    const decisionBureau: File = docForm.get('decisionBureau')?.value;
    if (decisionBureau) formData.append('decisionBureau', decisionBureau);

    const projetActe: File = docForm.get('projetActe')?.value;
    if (projetActe) formData.append('projetActe', projetActe);

    const photosSite: File[] = docForm.get('photosSite')?.value;
    if (photosSite && photosSite.length > 0) {
      photosSite.forEach((file) => {
        formData.append('photosSite', file);
      });
    }

    console.log('Fichiers envoyés :', formData);
    return this.projetService
      .uploadDocfile(formData)
      .pipe(
        catchError(() =>
          of({
            success: false,
            message: "Erreur lors de l'envoi des docfiles",
          } as ApiResponse)
        )
      );
  }
}
