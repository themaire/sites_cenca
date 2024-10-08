import {
  Component,
  Input,
  SimpleChanges,
  ChangeDetectorRef,
  AfterViewInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { MapComponent } from '../../../map/map.component';

import { DetailSite } from '../../site-detail';
import { Commune } from './commune';
import { SitesService } from '../../sites.service';

@Component({
  selector: 'app-detail-infos',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule,
    MatSlideToggleModule,
    MapComponent,
  ],
  templateUrl: './detail-infos.component.html',
  styleUrls: ['./detail-infos.component.scss'], // Attention ici c'était styleUrl sans 's'
})
export class DetailInfosComponent {
  @Input() inputDetail?: DetailSite;

  // Pour le bouton "Modifier"
  // Variable pour activer/désactiver le mode édition
  isEditMode: boolean = false;
  // Stocker les changements temporaires
  editedDetail: DetailSite | null = null;

  constructor(private sitesService: SitesService) {}

  // Pour les communes
  public communes: Commune[] = [];

  research: SitesService = inject(SitesService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  async ngOnChanges(changes: SimpleChanges) {
    if (this.inputDetail !== undefined) {
      // console.log('geojson ' + this.inputDetail.geojson);
    }

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

  // Pour le bouton "Modifier"
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      // Créer une copie des données pour l'édition
      this.editedDetail = { ...this.inputDetail } as DetailSite;
    } else {
      this.editedDetail = null; // Annuler les modifications
    }
    console.log('-------------------->', this.editedDetail);
  }

  saveChanges() {
    if (this.editedDetail) {
      // Appeler le service pour sauvegarder les modifications
      this.sitesService.updateDetail(this.editedDetail).then(() => {
        this.inputDetail = this.editedDetail!;
        this.isEditMode = false;
      });
    }
  }
}
