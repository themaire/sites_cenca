import { environment } from '../../environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, FormControl, AbstractControl, ValidationErrors, FormArray } from '@angular/forms';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Projet } from '../sites/site-detail/detail-projets/projets';
import { Operation } from '../sites/site-detail/detail-projets/projet/operation/operations';
import { Objectif } from '../sites/site-detail/detail-projets/projet/objectif/objectifs';
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

  // Validation personnalisée pour vérifier qu'un champ contient au moins 2 mots si non vide
  minWordsValidator(minWords: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || control.value.trim().length === 0) {
        return null; // Pas d'erreur si le champ est vide
      }
      const wordCount = control.value.trim().split(/\s+/).length;
      return wordCount >= minWords ? null : { minWords: true };
    };
  }

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

  public getLibelleFromCd(cd_type: string, list: SelectValue[]): string {
    const libelle = list.find(type => type.cd_type === cd_type);
    return libelle ? libelle.libelle : '';
  }

  /**
   * Valide qu'un nombre maximum de cases à cocher sélectionnées n'est pas dépassé.
   * 
   * @param max - Le nombre maximum de cases à cocher autorisées.
   * @returns Une fonction de validation qui prend un contrôle `AbstractControl` 
   *          et retourne une erreur de validation si le nombre de cases cochées 
   *          dépasse la limite spécifiée, ou `null` si la validation est réussie.
   * 
   * @example
   * ```typescript
   * const formArray = new FormArray([
   *   new FormGroup({ checked: new FormControl(true) }),
   *   new FormGroup({ checked: new FormControl(false) }),
   *   new FormGroup({ checked: new FormControl(true) }),
   * ]);
   * 
   * const validator = maxSelectedCheckboxes(2);
   * const result = validator(formArray); // null (validation réussie)
   * 
   * formArray.at(2).get('checked')?.setValue(true);
   * const result2 = validator(formArray); // { maxSelected: true } (validation échouée)
   * ```
   */
  maxSelectedCheckboxes(max: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const selectedCount = (control as FormArray).controls.filter(c => c.get('checked')?.value).length;
      return selectedCount > max ? { maxSelected: true } : null;
    };
  }
  

  // Créer un nouveau formulaire de projet

  // Le parametre est optionnel tout comme les données indiquées à l'intérieur
  // !!! Attention, projet.uuid_proj est généré automatiquement si non indiqué !!!
  newProjetForm(projet?: Projet, site?: String, isWebApp: boolean = true): FormGroup {
    return this.fb.group({
      uuid_proj: [projet?.uuid_proj || uuidv4()],
      site: [site || projet?.site],
      
      pro_webapp: [projet?.pro_webapp !== undefined ? projet.pro_webapp : isWebApp],
      pro_surf_totale: [projet?.pro_surf_totale || true],
      
      // Peut etre pas nécessaire
      document: [projet?.document || ''],
      createur: [projet?.createur || null],

      step1: this.fb.group({
        typ_projet: [projet?.typ_projet || null, Validators.required],
        statut: [projet?.statut || null],
        validite: [projet?.validite || '', Validators.required],
        
        annee: [projet?.annee || null],
        pro_debut: [projet?.pro_debut || null],
        pro_fin: [projet?.pro_fin || ''],
        date_crea: [projet?.date_crea || null],
        
        nom: [projet?.nom || ''],
        code: [projet?.code || ''],
        responsable: [projet?.responsable || null],
        pro_maitre_ouvrage: [projet?.pro_maitre_ouvrage || null],
        perspectives: [projet?.perspectives || ''],

        programme: [projet?.programme || ''],
        itin_tech: [projet?.itin_tech || ''],
      }),
      step2: this.fb.group({
        pro_pression_ciblee: [projet?.pro_pression_ciblee || null],
        pro_results_attendus: [projet?.pro_results_attendus || null],
      }),
    });
  }

  // Créer un nouveau formulaire de projet
  // Le parametre est optionnel tout comme les données indiquées à l'intérieur
  // !!! Attention, uuid_proj est généré automatiquement si non indiqué !!!
  newObjectifForm(objectif?: Objectif, projet?: String): FormGroup {
    return this.fb.group({
      uuid_objectif: [objectif?.uuid_objectif || uuidv4()],
      typ_objectif: [objectif?.typ_objectif || '', Validators.required],
      enjeux_eco: [objectif?.enjeux_eco || '', Validators.required],
      nv_enjeux: [objectif?.nv_enjeux || '', Validators.required],
      obj_ope: [objectif?.obj_ope || '', Validators.required],
      attentes: [objectif?.attentes || ''],
      surf_totale: [objectif?.surf_totale || ''],
      unite_gestion: [objectif?.unite_gestion || ''],
      validite: [objectif?.validite || true, Validators.required],
      projet: [projet || objectif?.projet],
      surf_prevue: [objectif?.surf_prevue || null],
    });
  }


  // Créer un nouveau formulaire d'opération
  // Le parametre est optionnel tout comme les données indiquées à l'intérieur
  newOperationForm(operation?: Operation, uuid_proj?: String): FormGroup {
    const form = this.fb.group({
      uuid_ope: [operation?.uuid_ope || uuidv4()],
      ref_uuid_proj: [uuid_proj || operation?.ref_uuid_proj],
      obj_ope: [operation?.obj_ope || '', Validators.required],
      code: [operation?.code || ''],
      titre: [operation?.titre || ''],
      inscrit_pdg: [operation?.inscrit_pdg || ''],
      rmq_pdg: [operation?.rmq_pdg || ''],
      description: [operation?.description || '', [this.minWordsValidator(2)]],
      interv_zh: [operation?.interv_zh || ''],
  
      surf: [operation?.surf || null],
      lin: [operation?.lin || null],
      app_fourr: [operation?.app_fourr || null],
      pression_moy: [operation?.pression_moy || null],
      ugb_moy: [operation?.ugb_moy || null],
      nbjours: [operation?.nbjours || null],
      charge_moy: [operation?.charge_moy || null],
      charge_inst: [operation?.charge_inst || null],
      remarque: [operation?.remarque || '', this.minWordsValidator(2)],
      validite: [operation?.validite],
      action: [operation?.action || '', Validators.required],
      action_2: [operation?.action_2 || '', Validators.required],
      cadre_intervention: [operation?.cadre_intervention ?? null, Validators.required], // Utiliser null explicitement
      cadre_intervention_detail: [operation?.cadre_intervention_detail ?? null], // Pas encore requis
      objectif: [operation?.objectif || ''],
  
      typ_intervention: [operation?.typ_intervention || '', Validators.required],
      nom_mo: [operation?.nom_mo || '', Validators.required],
      date_debut: [operation?.date_debut || null],
      date_fin: [operation?.date_fin || null],
      date_approx: [operation?.date_approx || ''],
      ben_participants: [operation?.ben_participants || null],
      ben_heures: [operation?.ben_heures || null],
      description_programme: [operation?.description_programme || null],
      
      // Ajouter un FormArray pour gérer les programmes
      liste_ope_programmes: this.fb.array(
        operation?.liste_ope_programmes?.map(programme =>
          this.fb.group({
            lib_id: [programme.lib_id],
            lib_libelle: [programme.lib_libelle],
            checked: [programme.checked || false], // Initialise avec la valeur actuelle
          })
        ) || [],
        [this.maxSelectedCheckboxes(3)] // Validateur pour limiter le nombre de cases cochées
      ),
      
    });
  
    // Ajouter une validation conditionnelle pour cadre_intervention_detail
    // Cela rechange le formulaire en fonction de la valeur de cadre_intervention
    // La valeur 12 est utilisée pour les chantiers nature.
    form.get('cadre_intervention')?.valueChanges.subscribe((value) => {
      const cadreDetailControl = form.get('cadre_intervention_detail');
      if (value === 12) {
        cadreDetailControl?.setValidators(Validators.required); // Rendre requis
      } else {
        cadreDetailControl?.clearValidators(); // Supprimer les validateurs
      }
      cadreDetailControl?.updateValueAndValidity(); // Mettre à jour la validité
    });
  
    return form;
  }

  newShapeForm(uuid_ope: string, type_geometry: string): FormGroup {
    return this.fb.group({
      uuid_ope: [uuid_ope || null, Validators.required],
      type_geometry: [type_geometry || null, Validators.required],
      shapefile: [null, Validators.required]
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
  
  cleanFormValues(formValue: any, fields: string[]): any {
    // Sert a transformer les champs vides (undiefined) en null
    const cleanedFormValue = { ...formValue };
    fields.forEach(field => {
      if (!cleanedFormValue[field]) {
        cleanedFormValue[field] = null; // ou une valeur par défaut
      }
    });
    return cleanedFormValue;
  }

  /**
   * Prépare les données d'un projet pour soumission en nettoyant les valeurs du formulaire
   * et en structurant les données dans un objet conforme au type `Projet`.
   *
   * @param form - Le formulaire Angular (`FormGroup`) contenant les données du projet.
   * @returns Un objet `Projet` contenant les données nettoyées et structurées prêtes à être envoyées au backend.
   *
   * @remarks
   * - Les champs spécifiés dans `fieldsToClean` sont nettoyés avant la soumission.
   * - Les données sont organisées en fonction des étapes du formulaire (Step 1 et Step 2).
   * - Un log des données nettoyées est affiché dans la console avant la soumission.
   */
  private prepareProjetDataForSubmission(form: FormGroup): Projet {
    const fieldsToClean = [
      'document',
      'pro_debut',
      'pro_fin',
      'pro_pression_ciblee',
      'pro_results_attendus',
    ];
    const formValue = this.cleanFormValues(form.value, fieldsToClean);
    const dataToSubmit: Projet = {
      uuid_proj: formValue.uuid_proj,
      site: formValue.site,
      pro_webapp: formValue.pro_webapp,
      document: formValue.document,
      createur: formValue.createur,

      // Step 1
      typ_projet: formValue.step1.typ_projet,
      statut: formValue.step1.statut,
      validite: formValue.step1.validite,

      annee: formValue.step1.annee,
      pro_debut: formValue.step1.pro_debut,
      pro_fin: formValue.step1.pro_fin,
      date_crea: formValue.step1.date_crea,

      nom: formValue.step1.nom,
      code: formValue.step1.code,
      responsable: formValue.step1.responsable,
      pro_maitre_ouvrage: formValue.step1.pro_maitre_ouvrage,
      perspectives: formValue.step1.pro_pression_ciblee,

      programme: formValue.step1.programme,
      itin_tech: formValue.step1.itin_tech,

      // Step 2
      pro_pression_ciblee: formValue.step2.pro_pression_ciblee,
      pro_results_attendus: formValue.step2.pro_results_attendus,
    };

    console.log("Données du formulaire PROJET nettoyé juste avant d'etre envoyé vers le backend pour INSERT /UPDATE :");
    console.log(dataToSubmit);

    return dataToSubmit;
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
      // Dupliquer le FormGroup en un nouvel objet nommé workingForm
      const workingForm = this.fb.group({});

      // Copier les contrôles et leurs valeurs dans workingForm
      Object.keys(form.controls).forEach(key => {
        const control = form.get(key);
        if (control instanceof FormGroup) {
          workingForm.addControl(key, this.fb.group(control.controls));
        } else if (control instanceof FormArray) {
          workingForm.addControl(key, this.fb.array(control.controls));
        } else {
          workingForm.addControl(key, this.fb.control(control?.value, control?.validator, control?.asyncValidator));
        }
      });

      console.log('Formulaire original :', form.value);
      

      // Supprimer le contrôle 'liste_ope_programmes' du workingForm s'il existe
      if (workingForm.contains('liste_ope_programmes')) {
        workingForm.removeControl('liste_ope_programmes');
        console.log('Contrôle liste_ope_programmes supprimé du workingForm');
      }
      
      console.log('Formulaire dupliqué (workingForm) :', workingForm.value);
      
      let value = {};

      // Nettoyer les champs de date pour les projets 
      if (table === 'projets') {
        // Commenté depuis l'utilisation de la fonction prepareProjetDataForSubmission()
        // const fieldsToClean = [
        //   'document',
        //   'pro_debut',
        //   'pro_fin',
        //   'pro_pression_ciblee',
        //   'pro_results_attendus',
        // ];

        // Nettoyer les champs de date
        value = this.prepareProjetDataForSubmission(workingForm);

        console.log('Données du formulaire nettoyé :', workingForm);
      } else if (table === 'objectifs') {
        

      }
       else {
        // Si ce n'est pas un projet
        value = workingForm.value;
      }

      console.log('------- DEBUG :');
      console.log('Données du formulaire value tout court :', value);
      console.log('mode actuel :' + mode + '. Table de travail :', table, '. uuid :', uuid);

      
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
              formValue: value
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
              formValue: value
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