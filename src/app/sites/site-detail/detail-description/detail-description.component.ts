import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DetailSite } from '../../site-detail';
import { SitesService } from '../../sites.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-detail-description',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './detail-description.component.html',
  styleUrl: './detail-description.component.scss',
})
export class DetailDescriptionComponent {
  @Input() inputDetail?: DetailSite; // Le site selectionné pour voir son détail

  // Pour le bouton "Modifier"
  // Variable pour activer/désactiver le mode édition
  isEditMode: boolean = false;
  // Stocker les changements temporaires
  editedDetail: DetailSite | null = null;
  isMobile: boolean = false;

  constructor(
    private sitesService: SitesService,
    private breakpointObserver: BreakpointObserver
  ) {}

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
  ngOnInit() {
    // Détecter si c'est la version mobile
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.isMobile = result.matches;
      });
  }
}
