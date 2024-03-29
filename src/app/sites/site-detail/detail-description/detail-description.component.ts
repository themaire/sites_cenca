import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';



import { DetailSite } from '../../site-detail';

@Component({
  selector: 'app-detail-description',
  standalone: true,
  imports: [CommonModule,
            ],
  templateUrl: './detail-description.component.html',
  styleUrl: './detail-description.component.scss'
})
export class DetailDescriptionComponent {
  @Input() inputDescription?: DetailSite; // Le site selectionné pour voir son détail

  constructor(    ) {

  }
}
