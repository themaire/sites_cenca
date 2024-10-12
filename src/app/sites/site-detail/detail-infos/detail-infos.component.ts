import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Importer MatSnackBar et MatSnackBarModule
import { MapComponent } from '../../../map/map.component';

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { DetailSite } from '../../site-detail';
import { Commune } from './commune';
import { SitesService } from '../../sites.service';
import { UniqueSelectionDispatcher } from '@angular/cdk/collections';

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
    MatSnackBarModule // Ajouter MatSnackBarModule ici
  ],
  templateUrl: './detail-infos.component.html',
  styleUrls: ['./detail-infos.component.scss'], // Attention ici c'était styleUrl sans 's'
})
export class DetailInfosComponent implements OnChanges, OnInit {
  @Input() inputDetail?: DetailSite;
  isEditMode: boolean = false;
  public communes: Commune[] = [];
  research: SitesService = inject(SitesService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  form: FormGroup;
  initialFormValues: any; // Propriété pour stocker les valeurs initiales du formulaire
  isMobile: boolean = false;
  private snackBar = inject(MatSnackBar); // Injecter MatSnackBar

  constructor(private sitesService: SitesService, 
    private fb: FormBuilder,
    private breakpointObserver: BreakpointObserver) {
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
          const commGuetted = await this.research.getCommune(subroute);
          this.communes = commGuetted;
          this.cdr.detectChanges();
        } catch (error) {
          console.error('Error fetching documents', error);
        }
      }
    }
  }

  toggleEditMode() {
  // Cette fonction permet de basculer entre le mode édition et le mode lecture seule
  // Utilisée pour rentrer et sortir du mode édition
  // Réinitialise le formulaire aux valeurs initiales si on sort du mode édition
    if (this.isEditMode) {
      this.form.patchValue(this.initialFormValues); // Réinitialiser le formulaire aux valeurs initiales
      this.form.disable();
      console.log('Nous sortons du mode édition');
    } else {
      this.form.enable();
      console.log('Nous sommes en mode édition');
    }
    this.isEditMode = !this.isEditMode;
  }

  getInvalidFields(): string[] {
    const invalidFields: string[] = [];
    const controls = this.form.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalidFields.push(name);
      }
    }
    return invalidFields;
  }

  isFormChanged(): boolean {
    // Vérifie si le formulaire a été modifié
    return JSON.stringify(this.form.value) !== JSON.stringify(this.initialFormValues);
  }

  saveChanges() {
  // Cette fonction permet de sauvegarder les modifications
  // Vérifie si le formulaire est valide
  // Envoie les modifications au serveur
  // Affiche un message dans le Snackbar
  // Sort du mode édition après la sauvegarde (passe this.isEditMode à false)à false en cas de succès)
  
    // Vérifier si le formulaire a été modifié
    if (!this.isFormChanged()) {
      this.snackBar.open('Aucune donnée modifiée', 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-info']
      });
      this.isEditMode = false; // Sortir du mode édition tout simplement
      return;
    }
  
    if (this.form.valid) {
      const updatedDetail = this.form.value;
      console.log('Données du formulaire:', updatedDetail);
      this.sitesService.updateDetail(updatedDetail).subscribe(
        response => {
          console.log('Détails mis à jour avec succès:', response);
          this.isEditMode = false; // Sortir du mode édition après la sauvegarde

          // Afficher le message dans le Snackbar
          const message = String(response.message); // Conversion en string
          if (Number(response.code) === 0) {
            this.snackBar.open(message, 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-success']
            });
          } else {
            this.snackBar.open(message, 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-error']
            });
          }
        },
        error => {
          console.error('Erreur lors de la mise à jour des détails:', error);
          this.snackBar.open('Erreur lors de la mise à jour des détails', 'Fermer', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        }
      );
    } else {
      console.error('Formulaire invalide');
      const invalidFields = this.getInvalidFields();
      const message = `Formulaire invalide. Champs obligatoires manquants : ${invalidFields.join(', ')}`;
      this.snackBar.open(message, 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
    }
  }
}
