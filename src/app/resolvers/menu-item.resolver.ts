import { Injectable, inject } from '@angular/core';
import { MenuService } from '../menu.service';
import { Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';

import { MenuItem } from '../menuItem';

@Injectable({
  providedIn: 'root',
  
})
export class MenuItemResolver implements Resolve<MenuItem[]> {
  constructor(private menuService: MenuService) {}

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

    console.log("childrenArray : ", childrenArray); // Affiche le contenu avant l'assignation
    menuItems[0].children = childrenArray;

    for (let child of menuItems[0].children) {
      if (child.id !== undefined) {
        let subroute: string = `parent=${child.id.toString()}`;
        child.children = await this.menuService.getMenu(subroute);
      }
    }

    console.log("menuItems[0].children : ", menuItems[0].children); // Vérifie après l'assignation
    console.log("menuItems : ", menuItems); // Vérifie après l'assignation

    return menuItems;
  }

  //   const mmenuItems: MenuItem[] = [
  //     {
  //       name: 'Axes du CENCA',
  //       class_color: 'c-menu',
  //       children: [
  //         {
  //           name: 'Protéger',
  //           class_color: 'c-proteger',
  //           children: [
  //             { name: 'Stratégie, animation et veille foncière' },
  //             { name: 'Liste des sites' },
  //             { name: 'Police et surveillance' },
  //             { name: 'Classements de sites' },
  //             { name: 'Patrtenariats et foncier' },
  //           ],
  //         },
  //         {
  //           name: 'Connaitre',
  //           class_color: 'c-connaitre',
  //           children: [
  //             { name: 'Tableau de bord' },
  //             { name: 'Inventaires et suivis scientifique' },
  //             { name: 'Plans de gestion' },
  //           ],
  //         },
  //         {
  //           name: 'Gérer',
  //           class_color: 'c-gerer',
  //           children: [
  //             { name: 'Travaux de gestion' },
  //             { name: 'Libre évolution' },
  //             { name: 'Partenariat et ancrage territorial' },
  //             { name: 'Partenariats et sources de financement' },
  //           ],
  //         },
  //         {
  //           name: 'Valoriser',
  //           class_color: 'c-valoriser',
  //           children: [
  //             { name: "Traveaux d'aménagement" },
  //             { name: 'Sembilisations' },
  //           ],
  //         },
  //         {
  //           name: 'Accompagner',
  //           class_color: 'c-accompagner',
  //           children: [
  //             { name: 'Mesure compensatoires' },
  //             { name: 'Natura 2000' },
  //             { name: 'Assistance technique' },
  //           ],
  //         },
  //         {
  //           name: 'Administratif',
  //           class_color: 'c-administratif',
  //           children: [],
  //         },
  //         { name: 'Liens utiles', class_color: 'c-liens-utils', children: [] },
  //       ],
  //     },
  //     // {
  //     //   name: 'Gerer',
  //     //   class_color: 'c-gerer',
  //     //   children: [{ name: 'Insects' }, { name: 'Molluscs' }],
  //     // },
  //   ];

  //   console.log("menuItems du resolver : ");
  //   console.log(menuItems);
  //   // console.log("");
  //   // console.log("MMmenuItems du resolver : ");
  //   // console.log(mmenuItems);

  // }
}
