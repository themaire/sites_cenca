import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';



import { DetailSite } from '../../site-detail';

@Component({
  selector: 'app-detail-mfu',
  standalone: true,
  imports: [CommonModule,
  ],
  templateUrl: './detail-mfu.component.html',
  styleUrl: './detail-mfu.component.scss'
})
export class DetailMfuComponent {
  @Input() inputMFU?: DetailSite; // Le site selectionné pour voir son détail

}
