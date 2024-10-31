import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { Operation } from '../sites/site-detail/detail-projets/projet/operation/operations';

// Des fonctions sont définies pour gérer les formulaires

@Injectable({
  providedIn: 'root'
})
export class FormService {
    private formValiditySubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private fb: FormBuilder) {}

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
      ref_uuid_proj: [uuid_proj || ''],
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
}