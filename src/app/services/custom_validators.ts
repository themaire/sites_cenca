import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

export function codeSiteValidator(): ValidatorFn {
  const CODES_BASE = ['8000', '08000', '10000', '51000', '52000'];
  const REGEX_SITE = /^(08|10|51|52)[0-9]{3}$/;
  const REGEX_CAST = /^(08|10|51|52)[A-Z]{4}[0-9]{1}[1-9]{1}$/;

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if( value === null || value === undefined || value === '' ) {
      return null; // Valide
    }

    // Vérifier si la valeur est un nombre
    const numValue = Number(value);
    if (!isNaN(numValue)) {

      if ( !CODES_BASE.includes(value) && REGEX_SITE.test(value) ) {
          return null; // Valide
      } else {
        return { invalidCodeSite: true }; // Invalide
      }
    }

    // Vérifier si la valeur respecte le format spécifique d'un code CAST
    if (REGEX_CAST.test(value)) {
      return null; // Valide
    }

    return { invalidCodeSite: true }; // Invalide
  }; 
}
