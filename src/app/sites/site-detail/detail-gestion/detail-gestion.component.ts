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
  @Input() inputUUIDsite?: String; // L'uuid du site selectionné
  public docPlan: DocPlan[] = [];

  research: SitesService = inject(SitesService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  async ngOnChanges(changes: SimpleChanges) {
    if (this.inputDetail !== undefined) {
      const subroute = `pgestion/uuid=${this.inputDetail.uuid_site}`;
      // console.log("subroute pour les plans de gestion : " + subroute);
      console.log("Ouais on est dans le OnChanges 'onglet GESTION' . UUID:" + this.inputDetail["uuid_site"]);
      await this.fetchDocPlan(subroute);
    }
  }

  async ngOnInit() {
    if (this.inputUUIDsite !== undefined) {
      const subroute = `pgestion/uuid=${this.inputUUIDsite}`;
      console.log("subroute pour les plans de gestion dans ngOnInit : " + subroute);
      await this.fetchDocPlan(subroute);
    }
  }

  private async fetchDocPlan(subroute: string) {
    try {
      this.docPlan = await this.research.getDocPlan(subroute);
      console.log('docPlan après assignation :', this.docPlan);
      this.cdr.detectChanges(); // Forcer la détection des changements
    } catch (error) {
      console.error('Error fetching documents', error);
    }
  }





}