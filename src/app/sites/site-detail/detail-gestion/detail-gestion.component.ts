import { Component, Input, inject, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DetailSite } from '../../site-detail';
import { DocPlan } from './docplan';
import { SitesService } from '../../sites.service'; // service de données

@Component({
  selector: 'app-detail-gestion',
  standalone: true,
  imports: [CommonModule,
  ],
  templateUrl: './detail-gestion.component.html',
  styleUrls: ['./detail-gestion.component.scss']
})
export class DetailGestionComponent {
  @Input() inputDetail?: DetailSite; // Le site selectionné pour voir son détail vient du composant parent
  public docPlan: DocPlan[] = [];

  research: SitesService = inject(SitesService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  async ngOnChanges(changes: SimpleChanges){
    // Ce component est chargé en meme temps que sitesDetail.
    let subroute: string = "";
    
    if (this.inputDetail !== undefined) {
      // Cas d'une recherche sur critères
      subroute = `pgestion/uuid=${this.inputDetail.uuid_site}`;
      console.log("Ouais on est dans le OnChanges 'onglet GESTION' . UUID:" + this.inputDetail["uuid_site"]);
      
      // ChatGPT 19/07/2024
      try {
        const docGuetted = await this.research.getDocPlan(subroute);
        this.docPlan = docGuetted;
        console.log('docPlan après assignation :', this.docPlan);
        this.cdr.detectChanges(); // Forcer la détection des changements
      } catch (error) {
        console.error('Error fetching documents', error);
      }
      
    }

  }
}
