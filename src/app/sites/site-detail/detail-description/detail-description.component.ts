import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { DetailSite } from '../../site-detail';

@Component({
  selector: 'app-detail-description',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detail-description.component.html',
  styleUrl: './detail-description.component.scss',
})
export class DetailDescriptionComponent {
  @Input() inputDetail?: DetailSite; // Le site selectionné pour voir son détail

  constructor() {}
}
