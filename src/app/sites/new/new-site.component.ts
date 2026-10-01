import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { FormService } from '../../shared/services/form.service';
import { SitesService } from '../sites.service';
import { SiteSelectListsService } from '../site-select-lists.service';
import { SelectValue } from '../../shared/interfaces/formValues';
import { ListSite } from '../site';
import { FormButtonsComponent } from '../../shared/form-buttons/form-buttons.component';
import { FilterByPipe } from '../../shared/pipes/filter-by.pipe';

// Données que peut transmettre un composant parent (ex: la fiche d'un projet MFU signé)
// pour préremplir le formulaire et éviter de ressaisir des informations déjà connues.
export interface NewSiteDialogData {
  /** Nom du projet MFU d'origine. Si un " - " y est trouvé, seul le texte après le premier
   * " - " est conservé (ex: "ACQ - Prairie du Brune" -> "Prairie du Brune"). */
  nomPrefill?: string;
  /** Code salarié (cd_type de admin.salaries) du responsable, repris tel quel : c'est aussi
   * ce que stocke le contrôle "responsable" du formulaire (le select affiche le libellé). */
  responsablePrefill?: string;
  /** Identifiant du projet MFU d'origine, mémorisé dans sites.ref_pmfu_id pour garder le lien. */
  pmfuId?: number;
}

@Component({
  selector: 'app-new-site',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormButtonsComponent,
    FilterByPipe,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  templateUrl: './new-site.component.html',
  styleUrl: './new-site.component.scss',
})
export class NewSiteComponent implements OnInit {
  form: FormGroup;
  saving = false;

  salaries: SelectValue[] = [];
  bassinsAgence: SelectValue[] = [];
  regroupements: SelectValue[] = [];
  typesEspace: SelectValue[] = [];
  typesOuverture: SelectValue[] = [];
  typeSites: SelectValue[] = [];

  // Champs facultatifs du formulaire : une chaîne vide envoyée telle quelle au backend
  // fait échouer certaines contraintes SQL (colonnes FK/booléennes/numériques). On les
  // convertit en null juste avant l'envoi (voir onSubmit()). bassin_agence et rgpt n'en
  // font pas partie : ils ont toujours une valeur par défaut ('AUCUN'), jamais vides.
  private readonly optionalFields = [
    'typ_espace',
    'prem_ctr',
    'id_mnhn',
    'ref_fcen',
    'remq_sensibilite',
    'typ_ouverture',
    'url_cen',
    'url_mnhn',
  ];

  constructor(
    private formService: FormService,
    private sitesService: SitesService,
    private selectLists: SiteSelectListsService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<NewSiteComponent>,
    @Inject(MAT_DIALOG_DATA) private data: NewSiteDialogData | null,
  ) {
    this.form = this.formService.newSiteForm();

    // "Description sensibilité" n'a de sens que pour un site sensible : le champ est verrouillé
    // (et vidé, car getRawValue() renvoie aussi les contrôles désactivés) tant que le toggle est off.
    const remqSensibilite = this.form.get('remq_sensibilite');
    const syncRemqSensibilite = (sensible: boolean) => {
      if (sensible) {
        remqSensibilite?.enable({ emitEvent: false });
      } else {
        remqSensibilite?.reset('', { emitEvent: false });
        remqSensibilite?.disable({ emitEvent: false });
      }
    };
    syncRemqSensibilite(!!this.form.get('sensibilite')?.value);
    this.form.get('sensibilite')?.valueChanges.subscribe(syncRemqSensibilite);

    if (this.data?.nomPrefill) {
      this.form.patchValue({ nom: this.deriveNomSite(this.data.nomPrefill) });
    }
    if (this.data?.responsablePrefill) {
      this.form.patchValue({ responsable: this.data.responsablePrefill });
    }
    if (this.data?.pmfuId != null) {
      this.form.patchValue({ ref_pmfu_id: this.data.pmfuId });
    }
  }

  ngOnInit(): void {
    this.selectLists.load$().subscribe((lists) => {
      this.salaries = lists.salaries;
      this.bassinsAgence = lists.bassinsAgence;
      this.regroupements = lists.regroupements;
      this.typesEspace = lists.typesEspace;
      this.typesOuverture = lists.typesOuverture;
      this.typeSites = lists.typesSite;
    });
  }

  /** "CODE - Nom du site" -> "Nom du site" ; renvoie la chaîne telle quelle si aucun " - " trouvé. */
  private deriveNomSite(pmfuNom: string): string {
    const sep = ' - ';
    const idx = pmfuNom.indexOf(sep);
    return idx === -1 ? pmfuNom : pmfuNom.slice(idx + sep.length).trim();
  }

  onSubmit(): void {
    if (this.saving) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formService.snackMessage('Formulaire invalide. Veuillez compléter les champs obligatoires.', 1, this.snackBar);
      return;
    }

    this.saving = true;

    const payload = this.formService.cleanFormValues(this.form.getRawValue(), this.optionalFields);

    this.sitesService.createSite(payload).subscribe({
      next: (response) => {
        this.saving = false;
        this.formService.snackMessage(response.message || 'Site créé avec succès', response.code ?? 0, this.snackBar);

        const uuid_site = (response.data as any)?.uuid_site;
        this.dialogRef.close(uuid_site ? ({ uuid_site } as ListSite) : undefined);
      },
      error: () => {
        this.saving = false;
        this.formService.snackMessage('Erreur lors de la création du site', 1, this.snackBar);
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
