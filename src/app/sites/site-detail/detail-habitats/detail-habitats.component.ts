import { Component, Input, inject, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DetailSite } from '../../site-detail';
import { MilNat } from './docmilnat';
import { SitesService } from '../../sites.service'; // service de données

@Component({
  selector: 'app-detail-habitats',
  standalone: true,
  imports: [CommonModule,
  ],
  templateUrl: './detail-habitats.component.html',
  styleUrls: ['./detail-habitats.component.scss']
})
export class DetailHabitatsComponent {
  @Input() inputDetail?: DetailSite; // Le site selectionné pour voir son détail
  public milNat: MilNat[] = [];

  research: SitesService = inject(SitesService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  async ngOnChanges(changes: SimpleChanges){
    // Ce component est chargé en meme temps que sitesDetail.
    let subroute: string = "";
    
    if (this.inputDetail !== undefined) {
      // Cas d'une recherche sur critères
      subroute = `milnat/uuid=${this.inputDetail.uuid_site}`;
      console.log("On est dans le OnChanges 'onglet Habitats Milieu naturels' . UUID:" + this.inputDetail["uuid_site"]);
      
      // ChatGPT 19/07/2024
      try {
        this.milNat = await this.research.getMilNat(subroute);
        // console.log('docPlan après assignation :', this.docPlan);
        this.cdr.detectChanges(); // Forcer la détection des changements
      } catch (error) {
        console.error('Error fetching documents', error);
      }
    
    }
  }
}
