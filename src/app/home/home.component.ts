import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MenuItem } from '../menuItem';
import { CardComponent } from './card/card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, CardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  menuItems!: MenuItem[];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Abonnement à l'Observable pour obtenir les données résolues
    this.route.data.subscribe((data) => {
      this.menuItems = data['menuItems'];
    });
    // console.log("menuItems de ngOnInit() du home component : ");
    console.log(this.menuItems);
  }
}
