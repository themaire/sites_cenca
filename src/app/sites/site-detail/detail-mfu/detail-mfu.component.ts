import { Component, Input, inject, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DetailSite } from '../../site-detail';
import { Acte } from './acte';
import { SitesService } from '../../sites.service'; // service de données

@Component({
  selector: 'app-detail-mfu',
  standalone: true,
  imports: [CommonModule,
  ],
  templateUrl: './detail-mfu.component.html',
  styleUrl: './detail-mfu.component.scss'
})
export class DetailMfuComponent {
  @Input() inputDetail?: DetailSite; // Le site selectionné pour voir son détail
  public actes: Acte[] = [];

  research: SitesService = inject(SitesService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  async ngOnChanges(changes: SimpleChanges){
    // Ce component est chargé en meme temps que sitesDetail.
    let subroute: string = "";
    
    if (this.inputDetail !== undefined) {
      // Cas d'une recherche sur critères
      subroute = `mfu/uuid=${this.inputDetail.uuid_site}`;
      console.log("Ouais on est dans le OnChanges 'onglet MFU' . UUID:" + this.inputDetail["uuid_site"]);
      
      // ChatGPT 19/07/2024
      try {
        this.actes = await this.research.getMfu(subroute);
        // console.log('Données de this.Mfus après assignation :', this.actes);
        this.cdr.detectChanges(); // Forcer la détection des changements
      } catch (error) {
        console.error('Error fetching documents', error);
      }
    }
  }
}