import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormService {
  constructor(private fb: FormBuilder) {}

  toggleEditMode(form: FormGroup, isEditMode: boolean, initialFormValues: any): boolean {
    if (isEditMode) { // Si actuellement on est en mode edition
      form.patchValue(initialFormValues); // Réinitialiser le formulaire aux valeurs initiales
      form.disable();
      console.log('Nous sortons du mode édition');
    } else {
      form.enable();
      console.log('Nous sommes en mode édition');
    }
    return !isEditMode;
  }

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

  newOperationForm(): FormGroup {
    return this.fb.group({
      uuid_ope: [''],
      ref_uuid_proj: [''],
      code: [''],
      titre: ['', Validators.required],
      inscrit_pdg: [''],
      rmq_pdg: [''],
      description: [''],
      interv_zh: [''],
      surf: [null],
      lin: [null],
      app_fourr: [null],
      pression_moy: [null],
      ugb_moy: [null],
      nbjours: [null],
      charge_moy: [null],
      charge_inst: [null],
      remarque: [''],
      validite: [false],
      action: [''],
      objectif: [''],
      typ_intervention: [''],
      date_debut: [null],
      date_fin: [null],
      date_approx: [''],
      ben_participants: [null],
      ben_heures: [null]
    });
  }
}