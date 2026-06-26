import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { DocplanResearchComponent } from './docplan-research/docplan-research.component';
import { DocplanDisplayComponent } from './docplan-display/docplan-display.component';
import { BackToTopComponent } from '../../back-to-top/back-to-top.component';

@Component({
  selector: 'app-docplan',
  standalone: true,
  imports: [
    RouterLink,
    RouterOutlet,
    DocplanResearchComponent,
    DocplanDisplayComponent,
    BackToTopComponent,
  ],
  templateUrl: './docplan.component.html',
  styleUrl: './docplan.component.scss',
})
export class DocplanComponent {}
