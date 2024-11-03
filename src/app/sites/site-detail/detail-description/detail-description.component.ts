import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar'; // Importer MatSnackBar e

import { DetailSite } from '../../site-detail';
import { SitesService } from '../../sites.service';
import { FormService } from '../../../services/form.service';
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

  initialFormValues!: FormGroup; // Propriété pour stocker les valeurs initiales du formulaire

  private snackBar = inject(MatSnackBar); // Injecter MatSnackBar

  constructor(
    private sitesService: SitesService, 
    private formService: FormService,
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

ngOnInit() {
  // Détecter si c'est la version mobile
  this.breakpointObserver
    .observe([Breakpoints.Handset])
    .subscribe((result) => {
      this.isMobile = result.matches;
    });
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

  onUpdate(): void {
    // Mettre à jour le formulaire

    const updateObservable = this.formService.onUpdate('espace_site', this.inputDetail!.uuid_site, this.form, this.initialFormValues, this.isEditMode, this.snackBar);
    // S'abonner à l'observable

    if (updateObservable) {
      updateObservable.subscribe(
        (result) => {
          this.isEditMode = result.isEditMode;
          this.initialFormValues = result.formValue;
          console.log('Formulaire mis à jour avec succès:', result.formValue);
        },
        (error) => {
          console.error('Erreur lors de la mise à jour du formulaire', error);
        }
      );
    }
  }
}
