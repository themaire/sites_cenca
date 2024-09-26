import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { SitesResearchComponent } from './sites-research/sites-research.component';
import { SitesDisplayComponent } from './sites-display/sites-display.component';
import { BackToTopComponent } from '../back-to-top/back-to-top.component';

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
