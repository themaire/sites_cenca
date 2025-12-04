import { environment } from '../environments/environment';

import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
// import { catchError } from 'rxjs/operators';

// prototypes utilisés dans la promise de la fonction
import { MenuItem } from './menuItem';

@Injectable({
  providedIn: 'root',
})
export class MenuService {

  private activeUrl: string = environment.apiUrl + "menu/"; // Bureau

  private menuItemsSubject = new BehaviorSubject<MenuItem[]>([]);
  menuItems$ = this.menuItemsSubject.asObservable();

  // Cache pour éviter de recharger les données à chaque fois
  private cachedMenuItems: MenuItem[] | null = null;
  private cachedUserGroId: number | null = null;

  async getMenu(subroute: string): Promise<MenuItem[]> {
    const data = await fetch(this.activeUrl + subroute);
    return (await data.json()) ?? [];
  }

  async loadMenuItems(userGroId: number, forceReload: boolean = false): Promise<void> {
    // Si on a déjà les données en cache pour ce même utilisateur, on les retourne directement
    if (!forceReload && this.cachedMenuItems && this.cachedUserGroId === userGroId) {
      this.menuItemsSubject.next(this.cachedMenuItems);
      return;
    }

    let subroute: string = 'parent=null'

    // Surcharger la subroute pour les admins
    if (userGroId && userGroId == 5) {
      subroute += '/admin';
    }

    // Fonction pour trier par ordre alphabétique
    const sortAlphabetically = (items: MenuItem[]) => {
      return items.sort((a, b) => a.name.localeCompare(b.name));
    };

    this.getMenu(subroute).then((mainMenuItems) => {
      // Ici, compléter les sous-menus pour chaque élément
      const loadChildren = async () => {
        for (let item of mainMenuItems) {
          let subroute: string = `parent=${item.id}`;
          item.children = await this.getMenu(subroute);
          item.children = sortAlphabetically(item.children); // Trie les sous-menus
        }
        
        // Mettre en cache les données chargées
        this.cachedMenuItems = mainMenuItems;
        this.cachedUserGroId = userGroId;
        
        // Met à jour le BehaviorSubject une fois les données chargées
        this.menuItemsSubject.next(mainMenuItems);
      };

      loadChildren();
    });

  }
  
  async loadSubMenuItem(menu_parent: number): Promise<MenuItem[]> {
    const subroute: string = `parent=${menu_parent}`;
    const subMenuItems = await this.getMenu(subroute);
    return subMenuItems;
  }
}