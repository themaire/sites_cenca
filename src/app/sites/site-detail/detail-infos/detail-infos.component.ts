import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar'; // Importer MatSnackBar
import { MapComponent } from '../../../map/map.component';

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { DetailSite } from '../../site-detail';
import { Commune } from './commune';
import { SitesService } from '../../sites.service';
import { FormService } from '../../../shared/services/form.service';
// import { UniqueSelectionDispatcher } from '@angular/cdk/collections';

@Component({
  selector: 'app-detail-infos',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MapComponent,
    MatTooltipModule,
 // Ajouter MatSnackBarModule ici
  ],
  templateUrl: './detail-infos.component.html',
  styleUrls: ['./detail-infos.component.scss'], // Attention ici c'était styleUrl sans 's'
})
export class DetailInfosComponent implements OnChanges, OnInit {
  @Input() inputDetail?: DetailSite;
  isEditMode: boolean = false;
  public communes: Commune[] = [];
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  form: FormGroup;
  initialFormValues!: FormGroup; // Propriété pour stocker les valeurs initiales du formulaire
  isMobile: boolean = false;

  constructor(
    private sitesService: SitesService, 
    private formService: FormService,
    private fb: FormBuilder,
    private breakpointObserver: BreakpointObserver,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      // Initialiser le formulaire avec des contrôles vides
      uuid_espace: [''],
      uuid_site: [''],
      nom: ['', Validators.required],
      code: ['', Validators.required],
      surface: ['', Validators.required],
      responsable: ['', Validators.required],
      typ_site: ['', Validators.required],
      validite: ['', Validators.required],
      prem_ctr: ['', Validators.required],
      ref_public: [''],
      typ_espace: [''],
      bassin_agence: [''],
      zh: [''],
      id_mnhn: [''],
      ref_fcen: [''],
      rgpt: ['']
    });
  }

  ngOnInit() {
    // Désactiver le formulaire si on n'est pas en mode édition
    if (!this.isEditMode) {
      this.form.disable();
    }

    // Détecter si c'est la version mobile
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.isMobile = result.matches;
      });
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (this.inputDetail !== undefined) {
      this.form.patchValue({
        uuid_espace: this.inputDetail.uuid_espace,
        uuid_site: this.inputDetail.uuid_site,
        nom: this.inputDetail.nom,
        code: this.inputDetail.code,
        surface: this.inputDetail.surface,
        responsable: this.inputDetail.responsable,
        typ_site: this.inputDetail.typ_site,
        validite: this.inputDetail.validite,
        prem_ctr: this.inputDetail.prem_ctr,
        ref_public: this.inputDetail.ref_public,
        typ_espace: this.inputDetail.typ_espace,
        bassin_agence: this.inputDetail.bassin_agence,
        zh: this.inputDetail.zh,
        id_mnhn: this.inputDetail.id_mnhn,
        ref_fcen: this.inputDetail.ref_fcen,
        rgpt: this.inputDetail.rgpt
      });

      // Stocker les valeurs initiales du formulaire
      this.initialFormValues = this.form.value;

      let subroute: string = '';
      if (this.inputDetail !== undefined) {
        subroute = `commune/uuid=${this.inputDetail.uuid_site}`;
        try {
          const commGuetted = await this.sitesService.getCommune(subroute);
          this.communes = commGuetted;
          this.cdr.detectChanges();
        } catch (error) {
          console.error('Error fetching documents', error);
        }
      }
    }
  }

  toggleEditMode(): void {
    this.isEditMode = this.formService.simpleToggle(this.isEditMode); // Changer le mode du booleen
    this.formService.toggleFormState(this.form, this.isEditMode, this.initialFormValues); // Changer l'état du formulaire
  }

  getInvalidFields(): string[] {
    return this.formService.getInvalidFields(this.form);
  }

  isFormChanged(): boolean {
    // Vérifie si le formulaire a été modifié
    return JSON.stringify(this.form.value) !== JSON.stringify(this.initialFormValues);
  }

  onUpdate(): void {
    // Mettre à jour le formulaire

    const updateObservable = this.formService.putBdd('update', 'espace_site', this.form, this.isEditMode, this.snackBar, this.inputDetail!.uuid_site, this.initialFormValues);
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
