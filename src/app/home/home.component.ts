import { Component, Input } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MenuItem } from '../menuItem';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatSlideToggleModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  @Input() menuItems: MenuItem[] = []; // Liste des items prevenant du menu parent.
}
