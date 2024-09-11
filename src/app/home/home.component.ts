import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { MenuService } from '../menu.service';

import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MenuItem } from '../menuItem';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {

  menuItems!: MenuItem[];

  constructor(private route: ActivatedRoute, private MenuService: MenuService) { }

  // ngOnInit(): void {
  //   // Récupère la donnée résolue via le resolver
  //   this.route.data.subscribe(data => {
  //     this.menuItems = data['menuItems'];
  //   });
  // }

  ngOnInit(): void {
    // Abonnement à l'Observable pour obtenir les données résolues
    this.route.data.subscribe(data => {
      this.menuItems = data['menuItems'];

    });
    // console.log("menuItems de ngOnInit() du home component : ");
    console.log(this.menuItems);
  }
  
}