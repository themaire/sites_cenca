import { environment } from '../environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, firstValueFrom, map, shareReplay } from 'rxjs';

// prototypes utilisés dans la promise de la fonction
import { MenuItem } from './menuItem';
import { LoginService } from './login/login.service';

/** Nœud tel que renvoyé par GET menu/arbre : les sous-menus sont dans `enfants`. */
type MenuNode = Omit<MenuItem, 'children'> & { enfants?: MenuNode[] };

@Injectable({
  providedIn: 'root',
})
export class MenuService {

  private activeUrl: string = environment.apiUrl + "menu/";

  private menuItemsSubject = new BehaviorSubject<MenuItem[]>([]);
  menuItems$ = this.menuItemsSubject.asObservable();

  // Arbre complet du menu, chargé en un seul appel et gardé en mémoire
  // (une entrée pour l'arbre public, une pour l'arbre admin avec « Paramètres »)
  private arbres = new Map<boolean, Observable<MenuItem[]>>();

  constructor(
    private http: HttpClient,
    private loginService: LoginService
  ) {}

  /**
   * Arbre complet du menu, déjà trié côté backend.
   * - menu/arbre : sans « Paramètres »
   * - menu/arbre/admin : avec « Paramètres » (JWT obligatoire)
   */
  getMenu(admin: boolean = this.loginService.isAdmin()): Observable<MenuItem[]> {
    let arbre$ = this.arbres.get(admin);
    if (!arbre$) {
      arbre$ = this.http
        .get<MenuNode[]>(this.activeUrl + (admin ? 'arbre/admin' : 'arbre'))
        .pipe(
          map((nodes) => MenuService.toMenuItems(nodes)),
          shareReplay(1)
        );
      this.arbres.set(admin, arbre$);
    }
    return arbre$;
  }

  /** Charge l'arbre du menu et le diffuse via menuItems$ (header). */
  loadMenuItems(admin: boolean = this.loginService.isAdmin()): void {
    this.getMenu(admin).subscribe({
      next: (items) => this.menuItemsSubject.next(items),
      error: () => this.arbres.delete(admin), // pas de cache en cas d'échec
    });
  }

  /**
   * Enfants d'une entrée du menu, recherchée dans l'arbre en mémoire (aucun appel supplémentaire).
   * Renvoie une copie : les appelants (foncier, admin) modifient route/parent_name
   * et ne doivent pas altérer l'arbre partagé avec le header.
   */
  async loadSubMenuItem(menu_parent: number): Promise<MenuItem[]> {
    const arbre = await firstValueFrom(this.getMenu());
    return structuredClone(MenuService.findById(arbre, menu_parent)?.children ?? []);
  }

  /** Vide l'arbre en mémoire (à appeler à la déconnexion). */
  clearCache(): void {
    this.arbres.clear();
    this.menuItemsSubject.next([]);
  }

  private static toMenuItems(nodes: MenuNode[]): MenuItem[] {
    return nodes.map(({ enfants, ...item }) => ({
      ...item,
      children: MenuService.toMenuItems(enfants ?? []),
    }));
  }

  private static findById(items: MenuItem[], id: number): MenuItem | undefined {
    for (const item of items) {
      if (item.id === id) return item;
      const found = MenuService.findById(item.children ?? [], id);
      if (found) return found;
    }
    return undefined;
  }
}
