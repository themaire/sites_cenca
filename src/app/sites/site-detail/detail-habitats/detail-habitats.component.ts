import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';



import { DetailSite } from '../../site-detail';

@Component({
  selector: 'app-detail-habitats',
  standalone: true,
  imports: [CommonModule,
  ],
  templateUrl: './detail-habitats.component.html',
  styleUrl: './detail-habitats.component.scss'
})
export class DetailHabitatsComponent {
  @Input() inputHabitats?: DetailSite; // Le site selectionné pour voir son détail

}
