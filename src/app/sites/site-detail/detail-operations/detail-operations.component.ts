import { Component, Input, inject, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DetailSite } from '../../site-detail';
import { Operation } from './operation';
import { SitesService } from '../../sites.service'; // service de données




@Component({
  selector: 'app-detail-operations',
  standalone: true,
  imports: [CommonModule,
  ],
  templateUrl: './detail-operations.component.html',
  styleUrl: './detail-operations.component.scss'
})
export class DetailOperationsComponent {
  @Input() inputDetail?: DetailSite; // Le site selectionné pour voir son détail
  public operations: Operation[] = [];

  research: SitesService = inject(SitesService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  async ngOnChanges(changes: SimpleChanges){
    // Ce component est chargé en meme temps que sitesDetail.
    let subroute: string = "";
    
    if (this.inputDetail !== undefined) {
      // Cas d'une recherche sur critères
      console.log(this.inputDetail);
      subroute = `operations/uuid=${this.inputDetail.uuid_espace}`;
      console.log("Ouais on est dans le OnChanges 'onglet OPERATIONS' . UUID:" + this.inputDetail["uuid_espace"]);
      
      // ChatGPT 19/07/2024
      try {
        this.operations = await this.research.getOperations(subroute);
        // console.log('Données de this.Mfus après assignation :', this.actes);
        this.cdr.detectChanges(); // Forcer la détection des changements
      } catch (error) {
        console.error('Error fetching documents', error);
      }
    }
  }
}