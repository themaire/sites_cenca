import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chiro-accueil',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './chiro-accueil.component.html',
  styleUrl: './chiro-accueil.component.scss',
})
export class ChiroAccueilComponent {
  constructor(private router: Router) {}

  consulterReleves() { this.router.navigate(['/chiro/releves']); }
  consulterSites() { this.router.navigate(['/chiro/sites']); }
}
