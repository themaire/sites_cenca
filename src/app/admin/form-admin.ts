import { environment } from '../../environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
  AbstractControl,
  ValidationErrors,
  FormArray,
} from '@angular/forms';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AdminService } from './admin.service';
import { Salarie } from './admin';

@Injectable({
  providedIn: 'root',
})
export class FormAdmin {
  private activeUrl: string = environment.apiBaseUrl;

  constructor(
      private http: HttpClient,
      private adminService: AdminService,
      private fb: FormBuilder,
      private snackBar: MatSnackBar
  ) {}

  // Fonctions utilitaires pour les formulaires
  /**
   * Verifie si le formulaire a été modifié
   * @param form 
   * @param initialFormValue 
   * @returns 
   */
  isFormChanged(form: FormGroup, initialFormValue: FormGroup): boolean {
    // Vérifie si le formulaire a été modifié
    const CHANGED = JSON.stringify(form.value) !== JSON.stringify(initialFormValue);
    // console.log("isFormChanged retourne : " + CHANGED);
    return CHANGED;
  }

  /**
   * Fonction utilitaire pour appeller un snackbar en fonction du code (succès/erreur)
   * @param message 
   * @param code 
   * @param snackbar 
   */
  snackMessage(message: string, code: number, snackbar: MatSnackBar): void {
      // Afficher le message dans le Snackbar
      if (Number(code) === 0) {
      this.snackBar.open(message, 'Fermer', {
          duration: 3000,
          panelClass: ['snackbar-success'],
      });
      } else {
      this.snackBar.open(message, 'Fermer', {
          duration: 3000,
          panelClass: ['snackbar-error'],
      });
      }
  }

  /**
   * Formulaire pour un salarié
   * @param salarie 
   * @returns 
   */
  salarieForm(salarie?: Salarie): FormGroup {
      return this.fb.group({
      nom: [salarie?.nom || '', Validators.required],
      prenom: [salarie?.prenom || '', Validators.required],
      email: [salarie?.email || '@cen-champagne-ardenne.org', [Validators.required, Validators.email]],
      statut: [salarie?.statut || 'actif', Validators.required],
      // date_embauche: [salarie?.date_embauche || ''],
      // date_depart: [salarie?.date_depart || ''],
      typ_fonction: [salarie?.typ_fonction || ''],
      identifiant: [salarie?.identifiant || '', Validators.required],
      sal_role: [salarie?.sal_role || ''],
      });
  }

  putbdd(
      mode: string |'update' | 'insert',
      table: string,
      form: FormGroup,
      isEditMode: boolean,
      snackbar: MatSnackBar,
      id?: string,
      initialFormValues?: any
  ):
  | Observable<{ isEditMode: boolean; formValue: any; isEdited?: boolean, skipped?: boolean }>
  | undefined {
  // Cette fonction permet de sauvegarder les modifications
  // Vérifie si le formulaire est valide
  // Envoie les modifications au serveur
  // Affiche un message dans le Snackbar
  // Sort du mode édition après la sauvegarde (passe this.isEditMode à false) à false en cas de succès)

  // Si le formulaire n'a pas changé, on sort du mode édition sans faire d'appel
  if (mode === 'update' && initialFormValues != null) {
    if (!this.isFormChanged(form, initialFormValues)) {
      // Si pas changé
      this.snackBar.open('Aucune donnée modifiée', 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-info'],
      });
      isEditMode = false; // Sortir du mode édition tout simplement
      return of({
        isEditMode: false,
        formValue: form.value,
        skipped: true,
      });
    }
  }
  
  // Début du travail de sauvegarde
  if (form.valid) {
    console.log('Formulaire admin valide, préparation de la sauvegarde en mode ' + mode);

    const salarie = form.value as Salarie;
    console.log('Données du salarié à sauvegarder :', salarie);

    if (table === 'salaries') {
      if (mode === 'update' && id) {
        return this.adminService.updateUser(salarie, id).pipe(
          map((response) => {
            console.log(table + ' mis à jour avec succès:', response);
            isEditMode = false; // Sortir du mode édition après la sauvegarde

            // Afficher le message dans le Snackbar
            const message = String(response.message); // Conversion en string
            this.snackMessage(message, response.code, snackbar);

            form.disable(); // Désactiver le formulaire après la sauvegarde
            // Retourner l'objet avec isEditMode et formValue
            return {
              isEditMode: false,
              formValue: form.value,
              isEdited: true,
            };
          }),
          tap(() => {
            console.log('Mise à jour réussie');
          }),
          catchError((error) => {
            console.error('Erreur lors de la mise à jour', error);
            throw error;
          })
        );
      }
    }

  }

    // Return undefined if form is invalid or no other condition is met
    return undefined;
  }
}