import { AbstractControl, ValidationErrors } from '@angular/forms';
import { ValidatorFn } from '@angular/forms';

/**
 * Validateur personnalisé pour un (ou plusieurs) code(s) INSEE de commune (5 chiffres)
 * L'absence de valeur est laissée à Validators.required : ce validateur ne vérifie que le format.
 * Usage : [Validators.required, inseeCommuneValidator()]
 */
export function inseeCommuneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value == null || (Array.isArray(value) && value.length === 0) || value === '') {
      return null;
    }
    const codes: string[] = Array.isArray(value) ? value : [value];
    const invalid = codes.some((code) => !/^\d{5}$/.test(code));
    if (invalid) {
      return { insee: 'Chaque code INSEE doit comporter 5 chiffres.' };
    }
    return null;
  };
}
