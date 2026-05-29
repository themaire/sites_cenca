import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { TravauxResearchComponent } from './travaux-research/travaux-research.component';
import { TravauxDisplayComponent } from './travaux-display/travaux-display.component';
import { BackToTopComponent } from '../../back-to-top/back-to-top.component';

@Component({
  selector: 'app-travaux',
  standalone: true,
  imports: [
    RouterLink,
    RouterOutlet,
    TravauxResearchComponent,
    TravauxDisplayComponent,
    BackToTopComponent,
  ],
  templateUrl: './travaux.component.html',
  styleUrl: './travaux.component.scss',
})
export class TravauxComponent {}
