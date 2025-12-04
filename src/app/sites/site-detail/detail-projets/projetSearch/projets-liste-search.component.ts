import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { DetailProjetsComponent } from '../detail-projets.component';

@Component({
  selector: 'app-projets-liste-search',
  standalone: true,
  imports: [
    CommonModule,
    DetailProjetsComponent
  ],
  template: `
    <div class="projets-search-results">
      <h2>Résultats de la recherche</h2>
      <app-detail-projets></app-detail-projets>
    </div>
  `,
  styles: [`
    .projets-search-results {
      padding: 20px;
      
      h2 {
        margin-bottom: 20px;
        color: #2c3e50;
      }
    }
  `]
})
export class ProjetsListeSearchComponent {
  // Ce composant wrapper utilise detail-projets qui détectera automatiquement
  // qu'il est en mode 'search' via les paramètres de route
}
