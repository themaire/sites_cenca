import { environment } from '../../../environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, FormControl, AbstractControl, ValidationErrors, FormArray } from '@angular/forms';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Projet } from '../../sites/site-detail/detail-projets/projets';
import { Operation } from '../../sites/site-detail/detail-projets/projet/operation/operations';
import { Objectif } from '../../sites/site-detail/detail-projets/projet/objectif/objectifs';
import { SelectValue } from '../interfaces/formValues';

import { MatSnackBar } from '@angular/material/snack-bar';

import { SitesService } from '../../sites/sites.service';
import { ProjetService } from '../../sites/site-detail/detail-projets/projets.service';

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
      createur: [projet?.createur || null], // Valeur par défaut définie dans le composant

      step1: this.fb.group({
        // nom: [projet?.nom || ''],
        typ_projet: [projet?.typ_projet || null, Validators.required],
        statut: [projet?.statut || null],
        validite: [projet?.validite || '', Validators.required],
        
        annee: [projet?.annee || null],
        // pro_debut: [projet?.pro_debut || null],
        // pro_fin: [projet?.pro_fin || ''],
        date_crea: [projet?.date_crea || null],
        
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
      validite: [objectif?.validite || true],
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
      date_ajout: [operation?.date_ajout ? new Date(operation.date_ajout) : null],
      
      step1: this.fb.group({
        validite: [operation?.validite],
        obj_ope: [operation?.obj_ope || '', Validators.required],
        action: [operation?.action || '', Validators.required],
        action_2: [operation?.action_2 || '', Validators.required],
        description: [operation?.description || '', [this.minWordsValidator(2)]],
        remarque: [operation?.remarque || '', this.minWordsValidator(2)],
      }),
      
      step2: this.fb.group({
        typ_intervention: [operation?.typ_intervention || '', Validators.required],
        nom_mo: [operation?.nom_mo || '', Validators.required],
        cadre_intervention: [operation?.cadre_intervention ?? null, Validators.required], // Utiliser null explicitement
        cadre_intervention_detail: [operation?.cadre_intervention_detail ?? null], // Pas encore requis
      }),
      
      step3: this.fb.group({
        // Ajouter un FormArray pour gérer les programmes. 
        // this.putBdd() le supprimera avant de l'envoyer au backend
        // car liste_ope_programmes n'est pas un champ de la table opération
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
        description_programme: [operation?.description_programme || null],
      }),
      
      step4: this.fb.group({
        date_debut: [operation?.date_debut ? new Date(operation.date_debut) : null],
        date_fin: [operation?.date_fin ? new Date(operation.date_fin) : null],
        
        quantite: [operation?.quantite || null],
        unite: [operation?.unite || null],
        
        exportation_fauche: [operation?.exportation_fauche || false],
        total_exporte_fauche: [operation?.total_exporte_fauche || null],
        productivite_fauche: [operation?.productivite_fauche || null],
        
        // Ajouter un FormArray pour gérer les animaux d'un paturage.
        // this.putBdd() le supprimera avant de l'envoyer au backend
        // car liste_ope_animaux_paturage n'est pas un champ de la table opération
        liste_ope_animaux_paturage: this.fb.array(
          operation?.liste_ope_animaux_paturage?.map(animal =>
            this.fb.group({
              lib_id: [animal.lib_id],
              lib_libelle: [animal.lib_libelle],
              checked: [animal.checked || false], // Initialise avec la valeur actuelle
            })
          ) || [],
          [] // Validateur pour limiter le nombre de cases cochées
        ),
        effectif_paturage: [operation?.effectif_paturage || null],
        nb_jours_paturage: [operation?.nb_jours_paturage || null],
        chargement_paturage: [operation?.chargement_paturage || null],
        abroutissement_paturage: [operation?.abroutissement_paturage || null],
        recouvrement_ligneux_paturage: [operation?.recouvrement_ligneux_paturage || null],
        
        interv_cloture: [operation?.interv_cloture || null],
        
        type_intervention_hydro: [operation?.type_intervention_hydro || null],
      }),
      
      step5: this.fb.group({
        // Peut etre non utilisés pour la nouvelle version de la gestion des opérations
        // mais ils sont là pour le moment
        titre: [operation?.titre || ''],
        code: [operation?.code || ''],
        inscrit_pdg: [operation?.inscrit_pdg || ''],
        rmq_pdg: [operation?.rmq_pdg || ''],
        nbjours: [operation?.nbjours || null],
        app_fourr: [operation?.app_fourr || null],
        ugb_moy: [operation?.ugb_moy || null],
        pression_moy: [operation?.pression_moy || null],
        charge_moy: [operation?.charge_moy || null],
        charge_inst: [operation?.charge_inst || null],
        interv_zh: [operation?.interv_zh || ''],
        surf: [operation?.surf || null],
        lin: [operation?.lin || null],
        date_approx: [operation?.date_approx || ''],
        objectif: [operation?.objectif || ''],
        ben_participants: [operation?.ben_participants || null],
        ben_heures: [operation?.ben_heures || null],
      }),
    });
    
    // Ajouter une validation conditionnelle pour cadre_intervention_detail
    // Cela rechange le formulaire en fonction de la valeur de cadre_intervention
    // La valeur 12 est utilisée pour les chantiers nature.
    form.get('step2.cadre_intervention')?.valueChanges.subscribe((value) => {
      const cadreDetailControl = form.get('step2.cadre_intervention_detail');
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
  
  // A verifier dans le code si snackbar est bien passé en parametre
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
   * Prépare les données à plat d'un projet pour soumission en nettoyant les valeurs du formulaire
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
      // pro_debut: formValue.step1.pro_debut,
      // pro_fin: formValue.step1.pro_fin,
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

/**
 * Prépare les données à plat d'une opération pour soumission en nettoyant les valeurs du formulaire
 * et en structurant les données dans un objet conforme au type `Operation`.
 *
 * @param form - Le formulaire Angular (`FormGroup`) contenant les données de l'opération.
 * @returns Un objet `Operation` contenant les données nettoyées et structurées prêtes à être envoyées au backend.
 *
 * @remarks
 * - Les champs inutiles (comme les listes de cases à cocher) sont supprimés.
 * - Les données sont organisées en fonction des étapes du formulaire (step1 à step5).
 * - Un log des données nettoyées est affiché dans la console avant la soumission.
 */
private prepareOperationDataForSubmission(form: FormGroup): Operation {
  // On clone la valeur brute du formulaire
  const formValue = { ...form.value };

  // Construction de l'objet final
  const dataToSubmit: Operation = {
    uuid_ope: formValue.uuid_ope,
    ref_uuid_proj: formValue.ref_uuid_proj,
    date_ajout: formValue.date_ajout,

    // Step 1
    validite: formValue.step1?.validite,
    obj_ope: formValue.step1?.obj_ope,
    action: formValue.step1?.action,
    action_2: formValue.step1?.action_2,
    description: formValue.step1?.description,
    remarque: formValue.step1?.remarque,

    // Step 2
    typ_intervention: formValue.step2?.typ_intervention,
    nom_mo: formValue.step2?.nom_mo,
    cadre_intervention: formValue.step2?.cadre_intervention,
    cadre_intervention_detail: formValue.step2?.cadre_intervention_detail,

    // Step 3
    description_programme: formValue.step3?.description_programme,

    // Step 4
    date_debut: formValue.step4?.date_debut,
    date_fin: formValue.step4?.date_fin,
    quantite: formValue.step4?.quantite,
    unite: formValue.step4?.unite,
    exportation_fauche: formValue.step4?.exportation_fauche,
    total_exporte_fauche: formValue.step4?.total_exporte_fauche,
    productivite_fauche: formValue.step4?.productivite_fauche,
    effectif_paturage: formValue.step4?.effectif_paturage,
    nb_jours_paturage: formValue.step4?.nb_jours_paturage,
    chargement_paturage: formValue.step4?.chargement_paturage,
    abroutissement_paturage: formValue.step4?.abroutissement_paturage,
    recouvrement_ligneux_paturage: formValue.step4?.recouvrement_ligneux_paturage,
    interv_cloture: formValue.step4?.interv_cloture,
    type_intervention_hydro: formValue.step4?.type_intervention_hydro,

    // Step 5
    titre: formValue.step5?.titre,
    code: formValue.step5?.code,
    inscrit_pdg: formValue.step5?.inscrit_pdg,
    rmq_pdg: formValue.step5?.rmq_pdg,
    nbjours: formValue.step5?.nbjours,
    app_fourr: formValue.step5?.app_fourr,
    ugb_moy: formValue.step5?.ugb_moy,
    pression_moy: formValue.step5?.pression_moy,
    charge_moy: formValue.step5?.charge_moy,
    charge_inst: formValue.step5?.charge_inst,
    interv_zh: formValue.step5?.interv_zh,
    surf: formValue.step5?.surf,
    lin: formValue.step5?.lin,
    date_approx: formValue.step5?.date_approx,
    objectif: formValue.step5?.objectif,
    ben_participants: formValue.step5?.ben_participants,
    ben_heures: formValue.step5?.ben_heures,
  } as Operation;

  console.log("Données du formulaire OPERATION nettoyé juste avant d'être envoyé vers le backend pour INSERT / UPDATE :");
  console.log(dataToSubmit);

  return dataToSubmit;
}

  putBdd(mode: String, table: String, form: FormGroup, isEditMode: boolean, snackbar: MatSnackBar, uuid?: String, initialFormValues?: any): Observable<{ isEditMode: boolean, formValue: any }> | undefined {
    // Cette fonction permet de sauvegarder les modifications
    // Vérifie si le formulaire est valide
    // Envoie les modifications au serveur
    // Affiche un message dans le Snackbar
    // Sort du mode édition après la sauvegarde (passe this.isEditMode à false) à false en cas de succès)
    
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
      

      // Supprimer les contrôles 'liste_ope_programmes' et 'liste_ope_animaux_paturage' du workingForm s'il existe
      // Rappel, un controle de type FormArray est un tableau de FormGroup
      // et chaque FormGroup contient un tableau de FormControl
      // et chaque FormControl contient une valeur
      // et une fonction de validation
      // Donc un controle est un champ de formulaire en quelque sorte !!
      // Liste des contrôles à supprimer du workingForm
      const controlsToRemove = ['liste_ope_programmes', 'liste_ope_animaux_paturage'];
      controlsToRemove.forEach(controlName => {
        if (workingForm.contains(controlName)) {
          workingForm.removeControl(controlName);
          console.log(`Contrôle ${controlName} supprimé du workingForm`);
        }
      });
      
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

        // Mettre les steps du form Angular à plat et nettoyer les champs de date
        value = this.prepareProjetDataForSubmission(workingForm);

        console.log('Données du formulaire nettoyé :', workingForm);
      } else if (table === 'operations') {
        
        // Mettre les steps du form Angular à plat et nettoyer les champs de date
        value = this.prepareOperationDataForSubmission(workingForm);

        console.log('Données du formulaire nettoyé :', workingForm);

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

  /**
   * Convertir les dates javascript en format PostgreSQL (YYYY-MM-DD)
   * Ne prend pas en compte les heures, minutes et secondes donc le fuseau horaire n'est pas pris en compte
   * @param date 
   * @returns annee-mois-jour
   */
  formatDateToPostgres(date: any): string {
    console.log('Valeur de date avant conversion :', date);

    if (date?._isAMomentObject) {
      // Si c'est un objet Moment.js, utilisez ses méthodes pour extraire les informations
      // console.log('La date est un objet Moment.js');
      date = date.format('YYYY-MM-DD'); // Utilisez Moment.js pour formater la date
    }
  
    if (!(date instanceof Date)) {
      // Si la date est une chaîne ou un autre type, essayez de la convertir en objet Date
      // console.log('Conversion de la chaîne en objet Date');
      // console.log('Valeur de date :', date);
      date = new Date(date);
    } else {
      console.log('Date déjà un objet Date');
      console.log('Valeur de date :', date);
    }
  
    // Vérifiez à nouveau si c'est une date valide
    if (isNaN(date.getTime())) {
      console.error('La date fournie est invalide :', date);
      return ''; // Retournez une chaîne vide ou gérez l'erreur selon vos besoins
    }
  
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Les mois commencent à 0
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Vérifie si une date a été modifiée dans un formulaire.
   *
   * @param fieldName - Le nom du champ dans le formulaire à vérifier.
   * @param operationDate - La date de l'opération à comparer (peut être null).
   * @param form - Le groupe de formulaire Angular contenant le champ.
   * @returns `true` si la valeur du champ est différente de la date de l'opération, sinon `false`.
   */
  isDateModified(form: FormGroup, fieldName: string, operationDate: Date | undefined): boolean {
          return (form.get(fieldName)?.value ?? null) != (operationDate ?? null);
  }

}