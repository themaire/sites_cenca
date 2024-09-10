import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { SitesResearchComponent } from './sites-research/sites-research.component';
import { SitesDisplayComponent } from './sites-display/sites-display.component';

@Component({
  selector: 'app-site',
  standalone: true,
  imports: [
    RouterLink,
    RouterOutlet,
    SitesResearchComponent,
    SitesDisplayComponent,
  ],
  templateUrl: './sites.component.html',
  styleUrl: './sites.component.scss',
})
export class SitesComponent {}
