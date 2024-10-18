import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FicheMFUlite, FicheMFU } from '../acte';
import { ActeService } from './acte.service';

import { FormsModule } from '@angular/forms';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import {
  MatDialog,
  MatDialogModule,
  MatDialogTitle,
  MatDialogContent,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-fiche-mfu',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogTitle,
  ],
  templateUrl: './fiche-mfu.component.html',
  styleUrl: './fiche-mfu.component.scss',
})
export class FicheMfuComponent implements OnInit {
  public ficheMFU!: FicheMFU;
  isEditMode: boolean = false;
  form: FormGroup;
  isMobile: boolean = false;

  constructor(
    // Inject le service de recherche des sites
    private serviceActeMFU: ActeService,
    private cdr: ChangeDetectorRef, // Injecter ChangeDetectorRef

    @Inject(MAT_DIALOG_DATA) public data: FicheMFUlite,
    private fb: FormBuilder,

    private breakpointObserver: BreakpointObserver
  ) {
    this.form = this.fb.group({
      // Initialiser le formulaire avec des contrôles vides
      uuid_acte: [''],
      nom_site: ['', Validators.required],
      typ_mfu: ['', Validators.required],
      typ_mfu_lib: ['', Validators.required],
      validite: ['', Validators.required],
      debut: ['', Validators.required],
      fin: ['', Validators.required],
      tacit_rec: ['', Validators.required],
      detail_rec: [''],
      remarque: [''],
      notaire: [''],
      cout: [''],
      date_crea: [''],
      date_modif: [''],
      actuel: [''],
    });
  }

  async ngOnInit() {
    // Désactiver le formulaire avant toute choses car
    // nous ne sommes pas en mode édition au moment de l'instantiation (init)
    if (!this.isEditMode) {
      this.form.disable();
    }

    // Détecter si l'utilisateur est sur un appareil mobile
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.isMobile = result.matches;
      });

    // Va chercher les données de la fiche MFU en utilisant l'UUID d'un acte
    // au travers du service de recherche des actes
    if (this.data !== undefined) {
      // si on a des données ( si data n'est pas undefined)

      const subroute = `fullmfu/uuid=${this.data.uuid_acte}`;
      console.log(
        "Ouais on est dans le OnInit 'boite de dialog MFU' . UUID:" +
          this.data.uuid_acte
      );

      // ChatGPT 19/07/2024
      try {
        this.ficheMFU = await this.serviceActeMFU.getFullMFU(subroute);
        console.log(
          'Données de this.Mfus avant assignation dans le formulaire :',
          this.ficheMFU
        );

        this.form.patchValue({
          nom_site: this.ficheMFU.nom_site,
          typ_mfu: this.ficheMFU.typ_mfu,
          typ_mfu_lib: this.ficheMFU.typ_mfu_lib,
          validite: this.ficheMFU.validite,
          debut: this.ficheMFU.debut,
          fin: this.ficheMFU.fin,
          tacit_rec: this.ficheMFU.tacit_rec,
          detail_rec: this.ficheMFU.detail_rec,
          remarque: this.ficheMFU.remarque,
          notaire: this.ficheMFU.notaire,
          cout: this.ficheMFU.cout,
          date_crea: this.ficheMFU.date_crea,
          date_modif: this.ficheMFU.date_modif,
          actuel: this.ficheMFU.actuel,
        });

        // console.log('Données de this.Mfus après assignation :', this.actes);
        this.cdr.detectChanges(); // Forcer la détection des changements
      } catch (error) {
        console.error('Error fetching documents', error);
      }
    }
  }
}
