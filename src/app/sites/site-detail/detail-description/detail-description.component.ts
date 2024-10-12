import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  form: FormGroup;

  // Pour le bouton "Modifier"
  // Variable pour activer/désactiver le mode édition
  isEditMode: boolean = false;
  // Stocker les changements temporaires
  editedDetail: DetailSite | null = null;
  isMobile: boolean = false;

  constructor(
    private sitesService: SitesService, 
    private fb: FormBuilder,
    private breakpointObserver: BreakpointObserver
  ) {this.form = this.fb.group({
    // Initialiser le formulaire avec des contrôles vides
    description_site: ['', Validators.required],
    sensibilite: ['', Validators.required],
    remq_sensibilite: [''],
    ref_public: [''],
    typ_site: [''],
    url: ['']
    })
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.form.enable();
      console.log('Nous sommes en mode édition');
    } else {
      this.form.disable();
      console.log('Nous sortons du mode édition');
    }
  }

  saveChanges() {
    if (this.form.valid) {
      const updatedDetail = this.form.value;
      console.log('Données du formulaire:', updatedDetail);
      this.sitesService.updateDetail(updatedDetail).subscribe(
        response => {
          console.log('Détails mis à jour avec succès:', response);
          this.toggleEditMode(); // Sortir du mode édition après la sauvegarde
        },
        error => {
          console.error('Erreur lors de la mise à jour des détails:', error);
        }
      );
    } else {
      console.error('Formulaire invalide');
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
