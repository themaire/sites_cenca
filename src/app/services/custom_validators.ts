import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

export function codeSiteValidator(): ValidatorFn {
  const REGEX_SITE_00X = /^(08|10|51|52)[0-9]{2}[1-9]{1}$/;
  const REGEX_SITE_XX0 = /^(08|10|51|52)[0-9]{2}[0-9]{3}$/;
  const REGEX_CAST = /^(08|10|51|52)[A-Z]{4}[0-9]{1}[1-9]{1}$/;

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null; // Ne pas valider si le champ est vide
    }

    // Vérifier si la valeur est un nombre
    const numValue = Number(value);
    if (!isNaN(numValue)) {

      if (REGEX_SITE_00X.test(value) || REGEX_SITE_XX0.test(value)) {
          return null; // Invalide
      } else {
        return { invalidCodeSite: true }; // Invalide
      }
    }

    // Vérifier si la valeur respecte le format spécifique d'un code CAST
    if (typeof value === 'string' && REGEX_CAST.test(value)) {
      return null; // Valide
    }

    return { invalidCodeSite: true }; // Invalide
  }; 
}