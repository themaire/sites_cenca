import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

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

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    // Récupère la donnée résolue via le resolver
    this.route.data.subscribe(data => {
      this.menuItems = data['menuItems'];
    });
  }
}