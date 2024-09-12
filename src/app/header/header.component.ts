import {
  Component,
  Input,
  ViewChildren,
  QueryList,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

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
    RouterModule,
    MatButtonModule,
    MatMenuModule,
    CommonModule,
    MatIconModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Input() menuItems: MenuItem[] = []; // Liste des items prevenant du menu parent.
  menuMap: { [key: string]: MatMenu } = {};

  @ViewChildren(MatMenu) menus!: QueryList<MatMenu>;

  ngAfterViewInit() {
    this.menus.forEach((menu) => {
      const menuName = menu['_elementRef'].nativeElement.getAttribute('id');
      if (menuName) {
        this.menuMap[menuName] = menu;
      }
    });
  }
  constructor(private router: Router) {}

  navigateToHome() {
    this.router.navigate(['/']);
  }
}
