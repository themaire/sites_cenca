import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, catchError, of } from 'rxjs';

import { MenuService } from '../menu.service';
import { MenuItem } from '../menuItem';

@Injectable({
  providedIn: 'root',
})

export class MenuItemResolver implements Resolve<MenuItem[]> {
  constructor(private menuService: MenuService) {}

  /**
   * Renvoie l'arbre complet du menu (axes du CENCA et leurs sous-menus),
   * chargé en un seul appel et partagé avec le header.
   * La page d'accueil y retient les entrées `accueil: true`.
   *
   * @returns Un tableau de MenuItem (vide si le chargement échoue).
   */
  resolve(): Observable<MenuItem[]> {
    return this.menuService.getMenu().pipe(catchError(() => of([])));
  }
}
