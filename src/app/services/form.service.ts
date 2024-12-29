import { environment } from '../../environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Operation } from '../sites/site-detail/detail-projets/projet/operation/operations';
import { Projet } from '../sites/site-detail/detail-projets/projets';
import { SelectValue } from '../shared/interfaces/formValues';

import { MatSnackBar } from '@angular/material/snack-bar';

import { SitesService } from '../sites/sites.service';
import { ProjetService } from '../sites/site-detail/detail-projets/projets.service';

import { v4 as uuidv4 } from 'uuid';

// Des fonctions generalistes sont définies pour gérer les formulaires

@Injectable({
  providedIn: 'root'
})
export class FormService {
  private activeUrl: string = environment.apiUrl;
  private formValiditySubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private sitesService: SitesService, 
    private projetService: ProjetService, 
    private fb: FormBuilder, 
    private snackBar: MatSnackBar,
  ) {}

  // Récupérer les valeurs de la liste déroulante
  getSelectValues$(subroute: string): Observable<SelectValue[] | undefined> {
    const url = `${this.activeUrl}${subroute}`;
    return this.http.get<SelectValue[]>(url).pipe(
      tap(response => {
        console.log('Valeurs de la liste déroulante récupérées avec succès:', response);
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des valeurs de la liste déroulante', error);
        throw error;
      })
    );
  }
  
  // Fonction pour basculer entre deux états
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
  
  // Créer un nouveau formulaire de projet avec des champs vides
  // Le parametre est optionnel tout comme les données indiquées à l'intérieur
  // !!! Attention, uuid_proj est généré automatiquement si non indiqué !!!
  newProjetForm(projet?: Projet, site?: String): FormGroup {
    return this.fb.group({
      uuid_proj: [projet?.uuid_proj || uuidv4()],
      site: [site || projet?.site],
      code: [projet?.code || ''],
      itin_tech: [projet?.itin_tech || ''],
      validite: [projet?.validite || '', Validators.required],
      document: [projet?.document || ''],
      programme: [projet?.programme || ''],
      nom: [projet?.nom || ''],
      perspectives: [projet?.perspectives || ''],
      annee: [projet?.annee || null],
      statut: [projet?.statut || null],
      responsable: [projet?.responsable || null],
      typ_projet: [projet?.typ_projet || null, Validators.required],
      createur: [projet?.createur || null],
      date_crea: [projet?.date_crea || null],
      pro_debut: [projet?.pro_debut || null],
      pro_fin: [projet?.pro_fin || ''],
      pro_pression_ciblee: [projet?.pro_pression_ciblee || false],
      pro_surf_totale: [projet?.pro_surf_totale || false],
      pro_nv_enjeux: [projet?.pro_nv_enjeux || false],
      pro_enjeux_eco: [projet?.pro_enjeux_eco || false],
      pro_obj_ope: [projet?.pro_obj_ope || false],
      pro_results_attendus: [projet?.pro_results_attendus || null],
      pro_maitre_ouvrage: [projet?.pro_maitre_ouvrage || null],
      pro_webapp: [projet?.pro_webapp || true]
    });
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

  snackMessage(message: string, code: number, snackbar: MatSnackBar): void {
    // Afficher le message dans le Snackbar
    if (Number(code) === 0) {
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
  }

  putBdd(mode: String, table: String, form: FormGroup, isEditMode: boolean, snackbar: MatSnackBar, uuid?: String, initialFormValues?: any): Observable<{ isEditMode: boolean, formValue: any }> | undefined {
    // Cette fonction permet de sauvegarder les modifications
    // Vérifie si le formulaire est valide
    // Envoie les modifications au serveur
    // Affiche un message dans le Snackbar
    // Sort du mode édition après la sauvegarde (passe this.isEditMode à false)à false en cas de succès)
    
    // Vérifier si le formulaire a été modifié
    if(mode === 'update' && initialFormValues != null) {
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
    }
  
    if (form.valid) {
      let value = {};

      if (table === 'projets') {
        // Champs à nettoyer
        const fieldsToClean = [
          'document',
          'pro_debut',
          'pro_fin',
          'pro_pression_ciblee',
          'pro_typ_objectif',
          'pro_obj_ope',
          'pro_results_attendus',
          'pro_surf_totale'
        ];

        // Nettoyer les champs de date
        value = this.cleanFormValues(form.value, fieldsToClean);

        console.log('Données du formulaire nettoyé :', value);
      } else {
        console.log('------- DEBUG :');
        console.log('Données du formulaire form.value :', form.value);

        value = form.value;
      }

      console.log('------- DEBUG :');
      console.log('Données du formulaire value tout court :', value);

      
      // Envoi des modifications au serveur
      if (mode === 'update' && uuid != null) {
        return this.sitesService.updateTable(table, uuid, value).pipe(
          map(response => {
            console.log(table + ' mis à jour avec succès:', response);
            isEditMode = false; // Sortir du mode édition après la sauvegarde

            // Afficher le message dans le Snackbar
            const message = String(response.message); // Conversion en string
            this.snackMessage(message, response.code, snackbar);

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
      }else if (mode = 'insert') {
        return this.sitesService.insertTable(table, value).pipe(
          map(response => {
            console.log(table + ' insérés avec succès:', response);
            isEditMode = false; // Sortir du mode édition après la sauvegarde

            // Afficher le message dans le Snackbar
            const message = String(response.message); // Conversion en string
            this.snackMessage(message, response.code, snackbar);

            form.disable(); // Désactiver le formulaire après la sauvegarde
            // Retourner l'objet avec isEditMode et formValue
            return {
              isEditMode: false,
              formValue: form.value
            };
          }),
          tap(() => {
            console.log('Insertion réussie');
          }),
          catchError(error => {
            console.error('Erreur lors de l\'insertion', error);
            throw error;
          })
        );
      }
      return;
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