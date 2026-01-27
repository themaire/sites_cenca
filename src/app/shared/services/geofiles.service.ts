import { Injectable, ElementRef } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiResponse } from '../interfaces/api';
import { ProjetService } from '../../sites/site-detail/detail-projets/projets.service';
import { SitesService } from '../../sites/sites.service';
import { Localisation } from '../../shared/interfaces/localisation';

import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError } from 'rxjs/operators';
import { FormGroup } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class GeofilesService {
  constructor(private projetService: ProjetService, 
              private sitesService: SitesService,
              private snackBar: MatSnackBar,
            ) {}

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
  downloadShapefileExample(type: 'polygone' | 'ligne' | 'point'): void {
    const url = `assets/shapefile_${type}_modele.zip`;
    fetch(url)
    .then(response => response.blob())
    .then(blob => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `shapefile_${type}_modele.zip`;
        link.click();
        window.URL.revokeObjectURL(link.href);
    });
  }

  /** Méthode pour gérer la sélection de fichier dans un input de type fichier
   * sert à mettre à jour le formulaire avec le fichier sélectionné
   * @param event - Événement de changement déclenché lors de la sélection du fichier
   * @param geoFileForm - Formulaire contenant les données du fichier
   */
  onFileSelected(event: any, geoFileForm: FormGroup) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0] as File;
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const type = extension === 'geojson' ? 'geojson' : extension === 'zip' ? 'shapefile' : null;

      geoFileForm.patchValue({
        file,
        type,
      });
    }
  }

  /** Méthode pour gérer la soumission du formulaire de fichier géographique
   * Verifie et affiche un snackbar en cas d'erreur
   * @param geoFileForm - Formulaire contenant les données du fichier
   * @param fileInput - Référence à l'élément input de type fichier
   * @param getLocalisation - Fonction pour récupérer la localisation après l'import
   */
  handleGeoFileSubmission(geoFileForm: FormGroup, fileInput: ElementRef, getLocalisation: (uuid: string) => Promise<any>) {
    // Gestion des cas qui peuvent poser problème avant l'envoi
    if (!geoFileForm?.get('type_geometry')?.value) {
      this.snackBar.open('Type de géométrie manquant', 'Fermer', { duration: 3000, panelClass: ['error-snackbar'] });
      return;
    }
    if (!geoFileForm?.get('uuid_ope')?.value) {
      this.snackBar.open('uuid_ope manquant', 'Fermer', { duration: 3000, panelClass: ['error-snackbar'] });
      return;
    }
    if (!geoFileForm?.get('file')?.value) {
      this.snackBar.open('Fichier manquant', 'Fermer', { duration: 3000, panelClass: ['error-snackbar'] });
      return;
    }
    if (!geoFileForm?.get('type')?.value) {
      this.snackBar.open('Type de fichier invalide', 'Fermer', { duration: 3000, panelClass: ['error-snackbar'] });
      return;
    }

    // C'est parti pour l'envoi du fichier
    this.submitGeoFile(geoFileForm).subscribe({
      next: async (response: ApiResponse) => {
        if (response.success) {
          // Réinitialiser le formulaire après un envoi réussi
          // puis charger la localisation associée sur la carte
          // Avertir l'utilisateur du succès
          geoFileForm.patchValue({ file: null, type: null });
          if (fileInput) fileInput.nativeElement.value = '';
          await getLocalisation(geoFileForm.get('uuid_ope')?.value);
          this.snackBar.open('Fichier géographique importé avec succès', 'Fermer', { duration: 3000, panelClass: ['success-snackbar'] });
        } else {
          this.snackBar.open(response.message || 'Erreur lors de l\'import', 'Fermer', { duration: 3000, panelClass: ['error-snackbar'] });
        }
      },
      error: (error) => {
        console.error('Erreur fichier géographique:', error.error?.message);
        const errorMessage = error.error?.message || 'Erreur lors de l\'import du fichier';
        this.snackBar.open(errorMessage, 'Fermer', { duration: 3000, panelClass: ['error-snackbar'] });
      }
    });
  }

  /** Soumettre le fichier géographique au backend */
  submitGeoFile(geoFileForm: FormGroup): Observable<ApiResponse> {
    // Cas qui pose problème
    if (!geoFileForm) {
      return of({ success: false, message: 'Formulaire de fichier introuvable.' } as ApiResponse);
    }

    const formData = new FormData(); // formulaire uniquement pour dans cette methode
    const file: File = geoFileForm.get('file')?.value;
    const typeGeometry: string = geoFileForm.get('type_geometry')?.value;
    const uuid_ope: string = geoFileForm.get('uuid_ope')?.value;
    const type: string = geoFileForm.get('type')?.value;

    // Encore des cas qui posent problème
    if (!file || !typeGeometry || !type) {
      return of({ 
        success: false, 
        message: 'Formulaire invalide. Fichier, type de fichier ou type de géométrie manquant.' 
      } as ApiResponse);
    }

    // Préparation du formulaire pour l'envoi
    formData.append('file', file);
    formData.append('type_geometry', typeGeometry);
    formData.append('uuid_ope', uuid_ope);
    formData.append('type', type);

    return this.projetService.uploadGeofile(formData).pipe(
      catchError(error => {
        return of({ 
          success: false, 
          message: 'Erreur lors de l\'envoi du fichier' 
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
      return await this.sitesService.getLocalisations(subrouteLocalisation);
    } catch (error) {
      console.error("Erreur lors de la récupération de la localisation de l'opération : ", error);
      return [];
    }
  }

}