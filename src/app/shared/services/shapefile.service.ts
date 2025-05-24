import { Injectable, ElementRef } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiResponse } from '../interfaces/api';
import { ProjetService } from '../../sites/site-detail/detail-projets/projets.service';
import { Localisation } from '../../shared/interfaces/localisation';

import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError } from 'rxjs/operators';
import { FormGroup } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class ShapefileService {
  constructor(private projetService: ProjetService, private snackBar: MatSnackBar) {}

  /** Lance le téléchargement d'un exemple de fichier shapefile en créant un élément
   * d'ancrage temporaire, en définissant son `href` sur le chemin du shapefile,
   * et en déclenchant un événement de clic.
   * Le fichier téléchargé sera nommé `shapefile_polygone_modele.zip`.
   *
   * @remarks
   * Cette méthode utilise l'API `document.createElement` pour créer dynamiquement
   * un élément d'ancrage et déclencher un téléchargement programmatique. Assurez-vous
   * que le chemin du fichier `'assets/shapefile_polygone_modele.zip'` est correct
   * et accessible dans votre projet.
  */
  downloadShapefileExample() {
    const link = document.createElement('a');
    link.href = 'assets/shapefile_polygone_modele.zip';
    link.download = 'shapefile_polygone_modele.zip';
    link.click();
  }

  onFileSelected(event: any, shapeForm: FormGroup) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      shapeForm.patchValue({ shapefile: file });
    }
  }

  /** Méthode pour gérer la soumission du formulaire de shape
   * Verifie et affiche un snackbar en cas d'erreur
   * @param shapeForm - Formulaire contenant les données du shapefile
   * @param fileInput - Référence à l'élément input de type fichier
   * @param getLocalisation - Fonction pour récupérer la localisation après l'import
   */
  handleShapefileSubmission(shapeForm: FormGroup, fileInput: ElementRef, getLocalisation: (uuid: string) => Promise<any>) {
    if (!shapeForm?.get('type_geometry')?.value) {
      this.snackBar.open('Type de géométrie manquant', 'Fermer', { duration: 3000, panelClass: ['error-snackbar'] });
      return;
    }
    if (!shapeForm?.get('uuid_ope')?.value) {
      this.snackBar.open('uuid_ope manquant', 'Fermer', { duration: 3000, panelClass: ['error-snackbar'] });
      return;
    }
    if (!shapeForm?.get('shapefile')?.value) {
      this.snackBar.open('Fichier shapefile manquant', 'Fermer', { duration: 3000, panelClass: ['error-snackbar'] });
      return;
    }

    this.submitShapefile(shapeForm).subscribe({
      next: async (response: ApiResponse) => {
        if (response.success) {
          shapeForm.patchValue({ shapefile: null });
          if (fileInput) fileInput.nativeElement.value = '';
          await getLocalisation(shapeForm.get('uuid_ope')?.value);
          this.snackBar.open('Shapefile importé avec succès', 'Fermer', { duration: 3000, panelClass: ['success-snackbar'] });
        } else {
          this.snackBar.open(response.message || 'Erreur lors de l\'import', 'Fermer', { duration: 3000, panelClass: ['error-snackbar'] });
        }
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'import du shapefile', 'Fermer', { duration: 3000, panelClass: ['error-snackbar'] });
      }
    });
  }

  /** Soumettre le shapefile au backend */
  submitShapefile(shapeForm: FormGroup): Observable<ApiResponse> {
    if (!shapeForm) {
      return of({ success: false, message: 'Formulaire de shapefile introuvable.' } as ApiResponse);
    }
    const formData = new FormData();
    const file: File = shapeForm.get('shapefile')?.value;
    const typeGeometry: string = shapeForm.get('type_geometry')?.value;
    const uuid_ope: string = shapeForm.get('uuid_ope')?.value;

    if (!file || !typeGeometry) {
      return of({ 
        success: false, 
        message: 'Formulaire invalide. Fichier ou type de géométrie manquant.' 
      } as ApiResponse);
    }

    formData.append('file', file);
    formData.append('type_geometry', typeGeometry);
    formData.append('uuid_ope', uuid_ope);

    return this.projetService.uploadShapefile(formData).pipe(
      catchError(error => {
        return of({ 
          success: false, 
          message: 'Erreur lors de l\'envoi du shapefile' 
        } as ApiResponse);
      })
    );
  }

  /** Méthode pour récupérer la localisations d'une opération
   * @param uuid_ope - UUID de l'opération
   * @returns Un tableau de localisations associées à l'opération à donner au composant de carte
   */
  async getLocalisation(uuid_ope: string): Promise<Localisation[]> {
    const subrouteLocalisation = `localisations/uuid=${uuid_ope}/operation`;
    try {
      return await this.projetService.getLocalisations(subrouteLocalisation);
    } catch (error) {
      console.error("Erreur lors de la récupération de la localisation de l'opération : ", error);
      return [];
    }
  }

}