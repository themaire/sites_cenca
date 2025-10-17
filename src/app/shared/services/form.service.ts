import { environment } from '../../../environments/environment';

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


import { Projet } from '../../sites/site-detail/detail-projets/projets';
import {
  Operation,
  OperationCheckbox,
} from '../../sites/site-detail/detail-projets/projet/operation/operations';
import { Objectif } from '../../sites/site-detail/detail-projets/projet/objectif/objectifs';
import { ProjetMfu } from '../../sites/foncier/foncier';
import { SelectValue } from '../interfaces/formValues';

import { MatSnackBar } from '@angular/material/snack-bar';

import { SitesService } from '../../sites/sites.service';
import { ProjetService } from '../../sites/site-detail/detail-projets/projets.service';
import { DocfileService } from './docfile.service';
import { v4 as uuidv4 } from 'uuid';

// import { now } from 'moment';

// Des fonctions generalistes sont définies pour gérer les formulaires

@Injectable({
  providedIn: 'root',
})
export class FormService {
  private activeUrl: string = environment.apiBaseUrl;
  private formValiditySubject: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private sitesService: SitesService,
    private projetService: ProjetService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private docfileService: DocfileService
  ) {}

  /** Renvoie le libellé correspondant au cd_type dans une ou plusieurs listes de SelectValue
   * @param cdType Le code type à rechercher (string ou number)
   * @param liste1 Première liste de SelectValue (obligatoire)
   */
  getLibelleByCdType(
    cdType: string | number | null,
    liste1: SelectValue[],
    liste2?: SelectValue[],
    liste3?: SelectValue[],
    liste4?: SelectValue[],
    liste5?: SelectValue[]
  ): string | undefined {
    if (!liste1) {
      console.warn('getLibelleFromCd appelé avec une liste undefined');
      return '';
    }
    const listes = [liste1, liste2, liste3, liste4, liste5].filter(
      Boolean
    ) as SelectValue[][];
    for (const liste of listes) {
      const type = liste.find((t) => t.cd_type === cdType);
      if (type?.libelle) {
        return type.libelle;
      }
    }
    return undefined;
  }

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

  // Validation personnalisée pour vérifier qu'une valeur est un nombre entier
  integerValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Pas d'erreur si le champ est vide
      }
      const value = Number(control.value);
      if (isNaN(value) || !Number.isInteger(value)) {
        return { integer: true };
      }
      return null;
    };
  }

  // Récupérer les valeurs de la liste déroulante
  getSelectValues$(subroute: string): Observable<SelectValue[] | undefined> {
    const url = `${this.activeUrl}${subroute}`;
    return this.http.get<SelectValue[]>(url).pipe(
      tap((response) => {
        console.log(
          'Valeurs de la liste déroulante récupérées avec succès:',
          response
        );
      }),
      catchError((error) => {
        console.error(
          'Erreur lors de la récupération des valeurs de la liste déroulante',
          error
        );
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
  toggleFormState(
    form: FormGroup,
    isEditMode: boolean,
    initialFormValues: any
  ): void {
    if (!isEditMode) {
      // Si actuellement on est en mode edition
      form.patchValue(initialFormValues); // Réinitialiser le formulaire aux valeurs initiales
      console.log('Formulaire plus en mode édition');
    } else {
      console.log('Formulaire passé en mode édition');
      form.enable(); // Activer le formulaire pour l'édition
    }
  }

  // Vérifier si le formulaire est valide
  // Retourne le nom des champs invalides
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
    const libelle = list.find((type) => type.cd_type === cd_type);
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
      const selectedCount = (control as FormArray).controls.filter(
        (c) => c.get('checked')?.value
      ).length;
      return selectedCount > max ? { maxSelected: true } : null;
    };
  }

  // Créer un nouveau formulaire de projet

  // Le parametre est optionnel tout comme les données indiquées à l'intérieur
  // !!! Attention, projet.uuid_proj est généré automatiquement si non indiqué !!!
  newProjetForm(
    projet?: Projet,
    site?: String,
    isWebApp: boolean = true
  ): FormGroup {
    return this.fb.group({
      uuid_proj: [projet?.uuid_proj || uuidv4()],
      site: [site || projet?.site],

      pro_webapp: [
        projet?.pro_webapp !== undefined ? projet.pro_webapp : isWebApp,
      ],

      // Peut etre pas nécessaire
      document: [projet?.document || ''],
      createur: [projet?.createur || null], // Valeur par défaut définie dans le composant

      step1: this.fb.group({
        nom: [projet?.nom || ''],
        typ_projet: [projet?.typ_projet || null, Validators.required],
        statut: [projet?.statut || null],
        validite: [projet?.validite || null],

        annee: [projet?.annee || new Date().getFullYear(), Validators.required],
        date_crea: [projet?.date_crea || new Date().toISOString().slice(0, 10)],

        code: [projet?.code || ''],
        responsable: [projet?.responsable || null, Validators.required],
        pro_maitre_ouvrage: [projet?.pro_maitre_ouvrage || null],
        perspectives: [projet?.perspectives || ''],

        programme: [projet?.programme || ''],
        itin_tech: [projet?.itin_tech || ''],
      }),
    });
  }

  // Créer un nouveau formulaire de projet
  // Le parametre est optionnel tout comme les données indiquées à l'intérieur
  // !!! Attention, uuid_proj est généré automatiquement si non indiqué !!!
  newObjectifForm(objectif?: Objectif, projet?: String): FormGroup {
    return this.fb.group({
      uuid_objectif: [objectif?.uuid_objectif || uuidv4()],
      typ_objectif: [objectif?.typ_objectif || ''],
      enjeux_eco: [
        objectif?.enjeux_eco || '',
        [Validators.required, this.minWordsValidator(2)],
      ],
      nv_enjeux: [objectif?.nv_enjeux || '', Validators.required],
      pression_maitrise: [
        objectif?.pression_maitrise || null,
        [Validators.required, this.minWordsValidator(2)],
      ],
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
  newOperationForm(
    operation?: Operation,
    uuid_proj?: String,
    allFinanceurs?: OperationCheckbox[]
  ): FormGroup {
    const form = this.fb.group({
      uuid_ope: [operation?.uuid_ope || uuidv4()],
      ref_uuid_proj: [uuid_proj || operation?.ref_uuid_proj],
      date_ajout: [
        operation?.date_ajout ? new Date(operation.date_ajout) : null,
      ],

      step1: this.fb.group({
        validite: [operation?.validite],
        obj_ope: [operation?.obj_ope || ''],
        action: [operation?.action || '', Validators.required],
        action_2: [operation?.action_2 || '', Validators.required],
        description: [
          operation?.description || '',
          [this.minWordsValidator(2)],
        ],
        remarque: [operation?.remarque || '', this.minWordsValidator(2)],
      }),

      step2: this.fb.group({
        typ_intervention: [
          operation?.typ_intervention || '',
          Validators.required,
        ],
        nom_mo: [operation?.nom_mo || '', Validators.required],
        cadre_intervention: [
          operation?.cadre_intervention ?? null,
          Validators.required,
        ], // Utiliser null explicitement
        cadre_intervention_detail: [
          operation?.cadre_intervention_detail ?? null,
        ], // Pas encore requis
        ben_participants: [operation?.ben_participants || null],
        ben_heures: [operation?.ben_heures || null],
      }),

      step3: this.fb.group({
        // Ajouter un FormArray pour gérer les programmes.
        // this.putBdd() le supprimera avant de l'envoyer au backend
        // car liste_ope_programmes n'est pas un champ de la table opération
        liste_ope_financeurs: this.fb.array(
          (allFinanceurs || []).map((financeur) =>
            this.fb.group({
              lib_id: [financeur.lib_id],
              lib_libelle: [financeur.lib_libelle],
              checked: [
                // On coche si ce financeur est dans operation.ope_financeurs
                operation?.ope_financeurs?.some(
                  (f) => f.lib_id === financeur.lib_id
                ) || false,
              ],
            })
          ),
          [this.maxSelectedCheckboxes(3)]
        ),
        financeur_description: [operation?.financeur_description || null],
      }),

      step4: this.fb.group({
        date_debut: [
          operation?.date_debut ? new Date(operation.date_debut) : null,
        ],
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
          operation?.liste_ope_animaux_paturage?.map((animal) =>
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
        nom_parc: [operation?.nom_parc || ''],
        
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

  newPmfuForm(projet?: ProjetMfu, new_pmfu_id?: number): FormGroup {
    return this.fb.group({
      pmfu_id: [projet?.pmfu_id || new_pmfu_id],
      pmfu_nom: [projet?.pmfu_nom || '', Validators.required],
      pmfu_responsable: [projet?.pmfu_responsable || null],
      pmfu_createur: [projet?.pmfu_createur || ''],
      pmfu_agence: [projet?.pmfu_agence || ''],
      pmfu_associe: [projet?.pmfu_associe || ''],
      pmfu_etapes: [projet?.pmfu_etapes || ''],
      pmfu_departement: [projet?.pmfu_departement || ''],
      pmfu_territoire: [projet?.pmfu_territoire || ''],
      pmfu_type: [projet?.pmfu_type || ''],
      pmfu_commune: [projet?.pmfu_commune || ''],
      pmfu_debut: [projet?.pmfu_debut || null],
      pmfu_proprietaire: [projet?.pmfu_proprietaire || ''],
      pmfu_appui: [projet?.pmfu_appui || ''],
      pmfu_juridique: [projet?.pmfu_juridique || ''],
      pmfu_validation: [projet?.pmfu_validation || ''],
      pmfu_decision: [projet?.pmfu_decision || ''],
      pmfu_note: [projet?.pmfu_note || ''],
      pmfu_acte: [projet?.pmfu_acte || ''],
      pmfu_compensatoire: [projet?.pmfu_compensatoire || ''],
      pmfu_cout: [projet?.pmfu_cout || ''],
      pmfu_financements: [projet?.pmfu_financements || ''],
      pmfu_superficie: [projet?.pmfu_superficie || null],
      pmfu_priorite: [projet?.pmfu_priorite || ''],
      pmfu_status: [projet?.pmfu_status || ''],
      pmfu_signature: [projet?.pmfu_signature || null],
      pmfu_echeances: [projet?.pmfu_echeances || ''],
      pmfu_creation: [projet?.pmfu_creation || new Date()],
      pmfu_photos_site: [projet?.pmfu_photos_site || ''],
      pmfu_date_ajout: [projet?.pmfu_date_ajout || null],
    });
  }

  newShapeForm(uuid_ope: string, type_geometry: string): FormGroup {
    return this.fb.group({
      uuid_ope: [uuid_ope || null, Validators.required],
      type_geometry: [type_geometry || null, Validators.required],
      shapefile: [null, Validators.required],
    });
  }
  newDocForm(pmfu?: ProjetMfu): FormGroup {
    const group: any = {
      ref_id: [pmfu?.pmfu_id || null, Validators.required],
    };

    const types = this.docfileService.getTypeFields();

    types.forEach((type) => {
      group[type] = [null];

      if (pmfu) {
        const propertyName = `${type}_nb` as keyof ProjetMfu;
        if (propertyName in pmfu) {
          group[`${type}Nb`] = [pmfu[propertyName]];
        } else {
          group[`${type}Nb`] = [null];
        }
      } else {
        group[`${type}Nb`] = [null];
      }
    });

    return this.fb.group(group);
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
        panelClass: ['snackbar-success'],
      });
    } else {
      this.snackBar.open(message, 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-error'],
      });
    }
  }

  cleanFormValues(formValue: any, fields: string[]): any {
    // Sert a transformer les champs vides (undiefined) en null
    const cleanedFormValue = { ...formValue };
    fields.forEach((field) => {
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
    const fieldsToClean = ['document'];
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
      date_crea: formValue.step1.date_crea,

      nom: formValue.step1.nom,
      code: formValue.step1.code,
      responsable: formValue.step1.responsable,
      pro_maitre_ouvrage: formValue.step1.pro_maitre_ouvrage,

      programme: formValue.step1.programme,
      itin_tech: formValue.step1.itin_tech,
    };

    console.log(
      "Données du formulaire PROJET nettoyé juste avant d'etre envoyé vers le backend pour INSERT /UPDATE :"
    );
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
      ben_participants: formValue.step2?.ben_participants,
      ben_heures: formValue.step2?.ben_heures,

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
    nom_parc: formValue.step4?.nom_parc,
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
    } as Operation;

    console.log(
      "Données du formulaire OPERATION nettoyé juste avant d'être envoyé vers le backend pour INSERT / UPDATE :"
    );
    console.log(dataToSubmit);

    return dataToSubmit;
  }

  private preparePmfuDataForSubmission(form: FormGroup): ProjetMfu {
    const formValue = { ...form.value };
    const dataToSubmit: ProjetMfu = {
      pmfu_id: formValue.pmfu_id,
      pmfu_nom: formValue.pmfu_nom,
      pmfu_responsable: formValue.pmfu_responsable,
      pmfu_createur: formValue.pmfu_createur,
      pmfu_agence: formValue.pmfu_agence,
      pmfu_associe: formValue.pmfu_associe,
      pmfu_etapes: formValue.pmfu_etapes,
      pmfu_departement: formValue.pmfu_departement,
      pmfu_territoire: formValue.pmfu_territoire,
      pmfu_type: formValue.pmfu_type,
      pmfu_commune: formValue.pmfu_commune,
      pmfu_debut: formValue.pmfu_debut,
      pmfu_proprietaire: formValue.pmfu_proprietaire,
      pmfu_appui: formValue.pmfu_appui,
      pmfu_juridique: formValue.pmfu_juridique,
      pmfu_compensatoire: formValue.pmfu_compensatoire,
      pmfu_cout: formValue.pmfu_cout,
      pmfu_financements: formValue.pmfu_financements,
      pmfu_superficie: formValue.pmfu_superficie,
      pmfu_priorite: formValue.pmfu_priorite,
      pmfu_status: formValue.pmfu_status,
      pmfu_signature: formValue.pmfu_signature,
      pmfu_echeances: formValue.pmfu_echeances,
      pmfu_creation: formValue.pmfu_creation,
      pmfu_derniere_maj: formValue.pmfu_derniere_maj,
      pmfu_photos_site: formValue.pmfu_photos_site,
      pmfu_date_ajout: formValue.pmfu_date_ajout,
      pmfu_validation: formValue.pmfu_validation,
    };

    console.log(
      "Données du formulaire PROJET nettoyé juste avant d'etre envoyé vers le backend pour INSERT /UPDATE :"
    );
    console.log(dataToSubmit);

    return dataToSubmit;
  }

  putBdd(
    mode: String,
    table: String,
    form: FormGroup,
    isEditMode: boolean,
    snackbar: MatSnackBar,
    uuid?: String,
    initialFormValues?: any
  ):
    | Observable<{ isEditMode: boolean; formValue: any; isEdited?: boolean }>
    | undefined {
    // Cette fonction permet de sauvegarder les modifications
    // Vérifie si le formulaire est valide
    // Envoie les modifications au serveur
    // Affiche un message dans le Snackbar
    // Sort du mode édition après la sauvegarde (passe this.isEditMode à false) à false en cas de succès)

    // Vérifier si le formulaire a été modifié
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
        });
      }
    }
    if (form.valid) {
      console.log('Formulaire valide, préparation de la sauvegarde...');
      // Dupliquer le FormGroup en un nouvel objet nommé workingForm
      const workingForm = this.fb.group({});

      // Copier les contrôles et leurs valeurs dans workingForm
      Object.keys(form.controls).forEach((key) => {
        const control = form.get(key);
        if (control instanceof FormGroup) {
          workingForm.addControl(key, this.fb.group(control.controls));
        } else if (control instanceof FormArray) {
          workingForm.addControl(key, this.fb.array(control.controls));
        } else {
          workingForm.addControl(
            key,
            this.fb.control(
              control?.value,
              control?.validator,
              control?.asyncValidator
            )
          );
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
      const controlsToRemove = [
        'liste_ope_programmes',
        'liste_ope_animaux_paturage',
      ];
      controlsToRemove.forEach((controlName) => {
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
      } else if (table === 'projets_mfu') {
        value = this.preparePmfuDataForSubmission(workingForm);
        console.log('Données du formulaire nettoyé :', workingForm);
      } else {
        // Si ce n'est pas un projet
        value = workingForm.value;
      }

      console.log('------- DEBUG :');
      console.log('Données du formulaire value tout court :', value);
      console.log(
        'mode actuel :' + mode + '. Table de travail :',
        table,
        '. uuid :',
        uuid
      );

      // Envoi des modifications au serveur
      if (mode === 'update' && uuid != null) {
        return this.sitesService.updateTable(table, uuid, value).pipe(
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
              formValue: value,
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
      } else if (mode === 'insert') {
        console.log('PAR ICI');
        return this.sitesService.insertTable(table, value).pipe(
          map((response) => {
            console.log(table + ' insérés avec succès:', response);
            isEditMode = false; // Sortir du mode édition après la sauvegarde

            // Afficher le message dans le Snackbar
            const message = String(response.message); // Conversion en string
            this.snackMessage(message, response.code, snackbar);
            console.log(response.data);
            if (table === 'projets_mfu') {
              (value as ProjetMfu).pmfu_id = response.data;
            }
            form.disable(); // Désactiver le formulaire après la sauvegarde
            // Retourner l'objet avec isEditMode et formValue
            return {
              isEditMode: false,
              formValue: value,
            };
          }),
          tap(() => {
            console.log('Insertion réussie');
          }),
          catchError((error) => {
            console.error("Erreur lors de l'insertion", error);
            throw error;
          })
        );
      }
      return;
    } else {
      console.error('Formulaire invalide');
      const invalidFields = this.getInvalidFields(form);
      const message = `Formulaire invalide. Champs obligatoires manquants : ${invalidFields.join(
        ', '
      )}`;
      this.snackBar.open(message, 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-error'],
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
  isDateModified(
    form: FormGroup,
    fieldName: string,
    operationDate: Date | undefined
  ): boolean {
    return (form.get(fieldName)?.value ?? null) != (operationDate ?? null);
  }

  login(): FormGroup {
    return this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  forgotPassword(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  passwordStrengthValidator(): Validators {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-])[A-Za-z\d@$!%*?&_\-]{8,}$/;
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      return passwordRegex.test(control.value)
        ? null
        : { passwordStrength: true };
    };
  }

  resetPasswordForm(): FormGroup {
    return this.fb.group({
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          this.passwordStrengthValidator(),
        ],
      ],
    });
  }
}
