import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
//Permet d'utiliser les routes de 'revolver'
import { ActivatedRoute } from '@angular/router';

import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MenuItem } from '../menuItem';
import { CardComponent } from './card/card.component';

import { MapComponent } from '../map/map.component';
import { LoginService } from '../login/login.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, CardComponent, MapComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  // stocke les données résolues
  menuItems!: MenuItem[];

  constructor(
    private route: ActivatedRoute,
    public loginService: LoginService
  ) {
    // console.log("loginService.user()?.nom" + loginService.user()?.nom);
  }

  ngOnInit(): void {
    // Abonnement à l'Observable (data) pour obtenir les données résolues
    this.route.data.subscribe((data) => {
      this.menuItems = data['menuItems'];
    });
    // console.log("menuItems de ngOnInit() du home component : ");
    // console.log(this.menuItems);
  }
}
