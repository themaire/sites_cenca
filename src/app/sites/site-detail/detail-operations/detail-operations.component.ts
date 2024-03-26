import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';



import { DetailSite } from '../../site-detail';

@Component({
  selector: 'app-detail-operations',
  standalone: true,
  imports: [CommonModule,
  ],
  templateUrl: './detail-operations.component.html',
  styleUrl: './detail-operations.component.scss'
})
export class DetailOperationsComponent {
  @Input() inputOperations?: DetailSite; // Le site selectionné pour voir son détail

}
