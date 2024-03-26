import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';



import { DetailSite } from '../../site-detail';

@Component({
  selector: 'app-detail-gestion',
  standalone: true,
  imports: [CommonModule,
  ],
  templateUrl: './detail-gestion.component.html',
  styleUrl: './detail-gestion.component.scss'
})
export class DetailGestionComponent {
  @Input() inputGestion?: DetailSite; // Le site selectionné pour voir son détail

}
