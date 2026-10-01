import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, shareReplay } from 'rxjs';

import { FormService } from '../shared/services/form.service';
import { SelectValue } from '../shared/interfaces/formValues';

// Toutes les listes de choix (select) des formulaires d'un site : création (new-site)
// et fiche détail (detail-infos, detail-description).
export interface SiteSelectLists {
  /** Salariés : cd_type = code salarié (valeur stockée dans sites.responsable), is_ope = éligible responsable. */
  salaries: SelectValue[];
  /** terr.bassins_agences (contient un choix 'AUCUN') */
  bassinsAgence: SelectValue[];
  /** esp.typ_rgpt (contient un choix 'AUCUN') */
  regroupements: SelectValue[];
  /** esp.typ_espaces */
  typesEspace: SelectValue[];
  /** sitcenca.typ_ouvertures */
  typesOuverture: SelectValue[];
  /** sitcenca.typ_sites */
  typesSite: SelectValue[];
}

@Injectable({ providedIn: 'root' })
export class SiteSelectListsService {
  private lists$?: Observable<SiteSelectLists>;

  constructor(private formService: FormService) {}

  /** Charge les listes une seule fois (mises en cache) ; une liste en erreur devient un tableau vide. */
  load$(): Observable<SiteSelectLists> {
    if (!this.lists$) {
      this.lists$ = forkJoin({
        salaries: this.get('admin.salaries'),
        bassinsAgence: this.get('terr.bassins_agences'),
        regroupements: this.get('esp.typ_rgpt'),
        typesEspace: this.get('esp.typ_espaces'),
        typesOuverture: this.get('sitcenca.typ_ouvertures'),
        typesSite: this.get('sitcenca.typ_sites'),
      }).pipe(shareReplay(1));
    }
    return this.lists$;
  }

  private get(table: string): Observable<SelectValue[]> {
    return this.formService.getSelectValues$(`sites/selectvalues=${table}/`).pipe(
      map((values) => values ?? []),
      catchError(() => of([] as SelectValue[])),
    );
  }
}
