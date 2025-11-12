import { AbstractControl, ValidationErrors } from '@angular/forms';
import { ValidatorFn } from '@angular/forms';

/**
 * Validateur personnalisé pour le code INSEE de commune (5 chiffres)
 * Usage : [Validators.required, inseeCommuneValidator()]
 */
export function inseeCommuneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || value === '') {
      return { insee: 'Le code INSEE est requis.' };
    }
    if (!/^\d{5}$/.test(value)) {
      return { insee: 'Le code INSEE doit comporter 5 chiffres.' };
    }
    return null;
  };
}
