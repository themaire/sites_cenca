import {
  Component,
  OnInit,
  Input,
  inject,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';


import { MenuService } from '../menu.service';
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
export class HeaderComponent implements OnInit {
  constructor(private router: Router, 
              private menuService: MenuService,
              private breakpointObserver: BreakpointObserver
  ) {}

  isMobile: boolean = false;
  menuItems: MenuItem[] = [
    {
      id: 0,
      name: 'Axes du CENCA',
      children: [] // A remplir par le service this.menuService
    },{
      id: 1,
      name: 'Plus tard',
      children: [{
        id: 3,
        name: 'Vraiment plus tard',
        children: []
      }]
    },
  ];

  ngOnInit() {
    this.menuService.menuItems$.subscribe((items) => {
      this.menuItems[0].children = items;
    });

    // Si ce n'est pas déjà fait, charger les données
    this.menuService.loadMenuItems();

    console.log('Menu Items at end of onInit() :');
    console.log(this.menuItems);

    // Détecter si c'est la version mobile
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });
  }


  navigateToHome() {
    this.router.navigate(['/']);
  }
}