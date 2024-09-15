import { Injectable, inject } from '@angular/core';
import { Resolve } from '@angular/router';
// import { Observable, of } from 'rxjs';

import { MenuService } from '../menu.service';
import { MenuItem } from '../menuItem';

@Injectable({
  providedIn: 'root',
  
})
export class MenuItemResolver implements Resolve<MenuItem[]> {
  constructor(private menuService: MenuService) {}

  /**
   * Renvoie un tableau de MenuItem, dont les enfants sont des tableaux vides,
   * représentant les axes du CENCA et les items "Plus tard".
   *
   * Les enfants sont eux-mêmes des tableaux vides, sauf pour les items
   * "Protéger" et "Gérer", qui ont des enfants.
   *
   * @returns Un tableau de MenuItem.
   */
  async resolve(): Promise<MenuItem[]> {
    //<<<<<<<<<<<<<<  ✨ Codeium Command 🌟  >>>>>>>>>>>>>>>>
    // Crée un tableau de deux éléments, dont les enfants sont des tableaux vides
    // Les tableaux vides sont créés en utilisant le spread operator [...]
    let menuItems: MenuItem[] = [
      {
        id: 0,
        name: 'Axes du CENCA',
        children: [] // Crée une copie du tableau vide
      },{
        id: 1,
        name: 'Plus tard',
        children: [] // Crée une copie du tableau vide
      },
    ]
    
    let childrenArray: MenuItem[] = await this.menuService.getMenu("parent=null");

    // console.log("childrenArray : ", childrenArray); // Affiche le contenu avant l'assignation
    menuItems[0].children = childrenArray;

    for (let child of menuItems[0].children) {
      if (child.id !== undefined) {
        let subroute: string = `parent=${child.id.toString()}`;
        child.children = await this.menuService.getMenu(subroute);
      }
    }

    // console.log("menuItems[0].children : ", menuItems[0].children); // Vérifie après l'assignation
    // console.log("menuItems : ", menuItems); // Vérifie après l'assignation

    return menuItems;
  }

  }
