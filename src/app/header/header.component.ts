import {
  Component,
  // Input,
  inject,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuService } from '../menu.service';
import { RouterOutlet } from '@angular/router';

import { MatMenu } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

import { MenuItem } from '../menuItem';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterOutlet,
    MatButtonModule,
    MatMenuModule,
    CommonModule,
    MatIconModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  // Plus utilisé
  // @Input() menuItems: MenuItem[] = []; // Liste des items prevenant du menu parent.

  menuItems: MenuItem[] = [
    {
      id: 0,
      name: 'Axes du CENCA',
      children: [] // Pas de sous-menus pour celui-ci
    },{
      id: 1,
      name: 'Plus tard',
      children: [] // Pas de sous-menus pour celui-ci
    },
  ]
  menuData: MenuService = inject(MenuService);

  // Necessaire pour l'activation des sous menus
  menuMap: { [key: string]: MatMenu } = {};
  @ViewChildren(MatMenu) menus!: QueryList<MatMenu>;

  async ngAfterViewInit() {
    let subroute: string = "parent=null";
    
    // Récupération des items principaux du menu
    this.menuItems[0].children = await this.menuData.getMenu(subroute);
    
    // Utilisation d'une boucle for...of pour pouvoir utiliser await à l'intérieur
    for (let child of this.menuItems[0].children) {
      if (child.id !== undefined) {
        let subroute: string = `parent=${child.id.toString()}`;
        child.children = await this.menuData.getMenu(subroute);
      }
    }
    console.log(this.menuItems);
  };
}