import {
  Component,
  Input,
  inject,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { DetailSite } from '../../site-detail';
import { Commune } from './commune';
import { SitesService } from '../../sites.service'; // service de données

@Component({
  selector: 'app-detail-infos',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, MatSlideToggleModule],
  templateUrl: './detail-infos.component.html',
  styleUrl: './detail-infos.component.scss',
})
export class DetailInfosComponent {
  @Input() inputDetail?: DetailSite; // Le site selectionné pour voir son détail
  public communes: Commune[] = [];

  research: SitesService = inject(SitesService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  constructor() {}

  async ngOnChanges(changes: SimpleChanges) {
    // Ce component est chargé en meme temps que sitesDetail.
    let subroute: string = '';

    if (this.inputDetail !== undefined) {
      // Cas d'une recherche sur critères
      subroute = `commune/uuid=${this.inputDetail.uuid_site}`;
      console.log(
        "Ouais on est dans le OnChanges 'onglet Infos générales' . UUID:" +
          this.inputDetail['uuid_site']
      );

      // ChatGPT 19/07/2024
      try {
        const commGuetted = await this.research.getCommune(subroute);
        this.communes = commGuetted;
        // console.log('communes après assignation :', this.communes);
        this.cdr.detectChanges(); // Forcer la détection des changements
      } catch (error) {
        console.error('Error fetching documents', error);
      }
    }
  }
  // Vous pouvez ajouter une fonction de sauvegarde ici qui persiste les données modifiées
  // editDetail() {
  //   if (this.inputDetail) {
  //     // You can use your service to send updates to the backend
  //     this.research.updateDetailSite(this.inputDetail).subscribe(
  //       (response) => {
  //         console.log('Update successful:', response);
  //       },
  //       (error) => {
  //         console.error('Update failed:', error);
  //       }
  //     );
  //   }
  // }

  isEditMode = false; // Par défaut, le mode est désactivé

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
  }
}
