import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { Operation } from '../sites/site-detail/detail-projets/projet/operation/operations';
import { Extraction } from '../sites/foncier/foncier';

import { MatSnackBar } from '@angular/material/snack-bar';

import { SitesService } from '../sites/sites.service';
import { FoncierService } from '../sites/foncier/foncier.service';

// Des fonctions sont définies pour gérer les formulaires

@Injectable({
  providedIn: 'root'
})
export class FormService {
    private formValiditySubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(
    private sitesService: SitesService, 
    private fb: FormBuilder, 
    private snackBar: MatSnackBar,
  ) {}
  
  simpleToggle(bool: boolean): boolean {
    // Pour ajouter une opération dans le template
    bool = !bool;
    return bool;
  }
  
  // Changer l'état du formulaire
  toggleFormState(form: FormGroup, isEditMode: boolean, initialFormValues: any): void {
    if (!isEditMode) { // Si actuellement on est en mode edition
      form.patchValue(initialFormValues); // Réinitialiser le formulaire aux valeurs initiales
      form.disable();
      console.log('Formulaire plus en mode édition');
    } else {
      form.enable();
      console.log('Formulaire passé en mode édition');
    }
  }
  
  // Vérifier si le formulaire est valide
  // Retourne un booléen
  getInvalidFields(form: FormGroup): string[] {
    const invalidFields: string[] = [];
    const controls = form.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalidFields.push(name);
      }
    }
    return invalidFields;
  }
  
  // Créer un nouveau formulaire d'opération avec des champs vides
  // Le parametre est optionnel tout comme les données indiquées à l'intérieur
  newOperationForm(operation?: Operation, uuid_proj?: String): FormGroup {
    return this.fb.group({
      uuid_ope: [operation?.uuid_ope || ''],
      ref_uuid_proj: [uuid_proj || operation?.ref_uuid_proj],
      code: [operation?.code || ''],
      titre: [operation?.titre || '', Validators.required],
      inscrit_pdg: [operation?.inscrit_pdg || ''],
      rmq_pdg: [operation?.rmq_pdg || ''],
      description: [operation?.description || ''],
      interv_zh: [operation?.interv_zh || ''],
      surf: [operation?.surf || null],
      lin: [operation?.lin || null],
      app_fourr: [operation?.app_fourr || null],
      pression_moy: [operation?.pression_moy || null],
      ugb_moy: [operation?.ugb_moy || null],
      nbjours: [operation?.nbjours || null],
      charge_moy: [operation?.charge_moy || null],
      charge_inst: [operation?.charge_inst || null],
      remarque: [operation?.remarque || ''],
      validite: [operation?.validite || false],
      action: [operation?.action || '100'],
      objectif: [operation?.objectif || ''],
      typ_intervention: [operation?.typ_intervention || 'BEN'],
      date_debut: [operation?.date_debut || null],
      date_fin: [operation?.date_fin || null],
      date_approx: [operation?.date_approx || ''],
      ben_participants: [operation?.ben_participants || null],
      ben_heures: [operation?.ben_heures || null]
    });
  }
  
  // Créer un nouveau formulaire d'extraction foncier avec des champs vides
  // Le parametre est optionnel tout comme les données indiquées à l'intérieur
  newExtractionForm(extraction?: Extraction): FormGroup {
    return this.fb.group({
      ext_id: [extraction?.ext_id || null],
      ref_cd_salarie: [extraction?.ref_cd_salarie || '', Validators.required],
      ext_code_site: [extraction?.ext_code_site || '', Validators.required],
      ext_description: [extraction?.ext_description || '', Validators.required],
    });
  }

  getFormValidityObservable(): Observable<boolean> {
    return this.formValiditySubject.asObservable();
  }

  setFormValidity(isValid: boolean): void {
    this.formValiditySubject.next(isValid);
  }

  isFormChanged(form: FormGroup, initialFormValue: FormGroup): boolean {
    // Vérifie si le formulaire a été modifié
    return JSON.stringify(form.value) !== JSON.stringify(initialFormValue);
  }

  cleanFormValues(formValue: any, fields: string[]): any {
    const cleanedFormValue = { ...formValue };
    fields.forEach(field => {
      if (!cleanedFormValue[field]) {
        cleanedFormValue[field] = null; // ou une valeur par défaut
      }
    });
    return cleanedFormValue;
  }

  onUpdate(table: String, uuid: String, form: FormGroup, initialFormValues: any, isEditMode: boolean, snackbar: MatSnackBar): Observable<{ isEditMode: boolean, formValue: any }> | undefined {
    // Cette fonction permet de sauvegarder les modifications
    // Vérifie si le formulaire est valide
    // Envoie les modifications au serveur
    // Affiche un message dans le Snackbar
    // Sort du mode édition après la sauvegarde (passe this.isEditMode à false)à false en cas de succès)
    
    // Vérifier si le formulaire a été modifié
    if (!this.isFormChanged(form, initialFormValues)) {
      // Si pas changé
      this.snackBar.open('Aucune donnée modifiée', 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-info']
      });
      isEditMode = false; // Sortir du mode édition tout simplement
      return of({
        isEditMode: false,
        formValue: form.value
      });
    }
  
    if (form.valid) {
      let value = {};

      if (table === 'projets') {
        // Champs à nettoyer
        const fieldsToClean = [
          'pro_debut',
          'pro_fin',
          'pro_pression_ciblee',
          'pro_typ_objectif',
          'pro_obj_ope',
          'pro_results_attendus',
          'pro_surf_totale'
        ];

        // Nettoyer les champs de date
        const value = this.cleanFormValues(form.value, fieldsToClean);

        console.log('Données du formulaire:', value);
      } else {
        console.log('------- DEBUG :');
        console.log('Données du formulaire form.value :', form.value);

        value = form.value;
      }

      console.log('------- DEBUG :');
      console.log('Données du formulaire value tout court :', value);

      // Envoi des modifications au serveur
      return this.sitesService.updateTable(table, uuid, value).pipe(
        map(response => {
          console.log('Détails mis à jour avec succès:', response);
          isEditMode = false; // Sortir du mode édition après la sauvegarde

          // Afficher le message dans le Snackbar
          const message = String(response.message); // Conversion en string
          if (Number(response.code) === 0) {
            this.snackBar.open(message, 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-success']
            });
          } else {
            this.snackBar.open(message, 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-error']
            });
          }

          form.disable(); // Désactiver le formulaire après la sauvegarde
          // Retourner l'objet avec isEditMode et formValue
          return {
            isEditMode: false,
            formValue: form.value
          };
        }),
        tap(() => {
          console.log('Mise à jour réussie');
        }),
        catchError(error => {
          console.error('Erreur lors de la mise à jour', error);
          throw error;
        })
      );
    } else {
      console.error('Formulaire invalide');
      const invalidFields = this.getInvalidFields(form);
      const message = `Formulaire invalide. Champs obligatoires manquants : ${invalidFields.join(', ')}`;
      this.snackBar.open(message, 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
      return undefined;
    }
  }
}