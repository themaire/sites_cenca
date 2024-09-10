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
  menuItems!: MenuItem[];

  // Plus utilisé
  // @Input() menuItems: MenuItem[] = []; // Liste des items prevenant du menu parent.

  research: MenuService = inject(MenuService);


  menuMap: { [key: string]: MatMenu } = {};

  @ViewChildren(MatMenu) menus!: QueryList<MatMenu>;

  ngAfterViewInit() {
    let subroute: string = "class=" + this.site["uuid_site"];
    this.research.getParentMenu(subroute).then((resultMenu) => {
      this.menuItems = resultMenu;
    });

    this.menus.forEach((menu) => {
      const menuName = menu['_elementRef'].nativeElement.getAttribute('id');
      if (menuName) {
        this.menuMap[menuName] = menu;
      }
    });
  }
}
