import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { SitesResearchComponent } from './sites-research/sites-research.component';
import { SitesDisplayComponent } from './sites-display/sites-display.component';
import { BackToTopComponent } from '../back-to-top/back-to-top.component';

/**
 * Le composant principal pour la page des sites.
 * Il contient les composants de recherche et d'affichage pour les sites.
 */
@Component({
  selector: 'app-site',
  standalone: true,
  imports: [
    RouterLink,
    RouterOutlet,
    SitesResearchComponent,
    SitesDisplayComponent,
    BackToTopComponent,
  ],
  templateUrl: './sites.component.html',
  styleUrl: './sites.component.scss',
})
export class SitesComponent {}
