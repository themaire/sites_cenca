import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Annuaire, Competence, Etiquette } from '../interfaces/annuaire';
import { SelectValue } from '../../shared/interfaces/formValues';

import { AnnuaireService } from '../annuaire.service';
import { FormService } from '../../shared/services/form.service';
import { ConfirmationService } from '../../shared/services/confirmation.service';
import { FormButtonsComponent } from '../../shared/form-buttons/form-buttons.component';

import {
  MatDialogRef,
  MatDialogModule,
  MatDialogContent,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-annuaire-fiche',
  standalone: true,
  imports: [
    CommonModule,
    FormButtonsComponent,
    MatDialogModule,
    MatDialogContent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './annuaire-fiche.component.html',
  styleUrls: ['./annuaire-fiche.component.scss'],
})
export class AnnuaireFicheComponent implements OnInit, OnDestroy {
  contact?: Annuaire;
  competences: Competence[] = [];
  etiquettes: Etiquette[] = [];

  typPersonnes: SelectValue[] = [];
  typCompetences: SelectValue[] = [];
  typEtiquettes: SelectValue[] = [];

  actuelOptions: SelectValue[] = [
    { cd_type: 'Oui', libelle: 'Oui' },
    { cd_type: 'Non', libelle: 'Non' },
  ];

  isNewContact: boolean = false;
  isEditMode: boolean = false;
  isLoading: boolean = true;

  contactForm!: FormGroup;
  initialFormValues!: any;
  isFormValid: boolean = false;
  private formStatusSub: Subscription | null = null;

  // Ajout d'une étiquette
  selectedEtiquetteToAdd: string | null = null;

  // Ajout / édition d'une compétence
  selectedCompetenceToAdd: string | null = null;
  notationToAdd: number | null = null;
  remarqueToAdd: string = '';

  editingCompetenceTyp: string | null = null;
  editNotation: number | null = null;
  editRemarque: string = '';

  constructor(
    private dialogRef: MatDialogRef<AnnuaireFicheComponent>,
    private annuaireService: AnnuaireService,
    private formService: FormService,
    private confirmationService: ConfirmationService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { uuid_ann?: string }
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      [this.typPersonnes, this.typCompetences, this.typEtiquettes] = await Promise.all([
        this.annuaireService.getTypPersonnes(),
        this.annuaireService.getTypCompetences(),
        this.annuaireService.getTypEtiquettes(),
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des listes de référence', error);
    }

    if (this.data.uuid_ann) {
      try {
        this.contact = await this.annuaireService.getAnnuaire(this.data.uuid_ann);
        this.competences = await this.annuaireService.getCompetences(this.data.uuid_ann);
        this.etiquettes = await this.annuaireService.getEtiquettes(this.data.uuid_ann);

        this.contactForm = this.formService.newAnnuaireForm(this.contact);
        this.initialFormValues = this.contactForm.getRawValue();
        this.contactForm.disable();
      } catch (error) {
        console.error('Erreur lors du chargement du contact', error);
      }
    } else {
      this.isNewContact = true;
      this.isEditMode = true;
      this.contactForm = this.formService.newAnnuaireForm();
    }

    this.formStatusSub = this.contactForm.statusChanges.subscribe(() => {
      this.isFormValid = this.contactForm.valid;
      this.cdr.detectChanges();
    });
    this.isFormValid = this.contactForm.valid;

    this.isLoading = false;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.formStatusSub?.unsubscribe();
  }

  getLibelle(cd_type: string | undefined | null, list: SelectValue[]): string {
    if (!cd_type) return 'Non renseigné';
    return this.formService.getLibelleFromCd(cd_type, list) || cd_type;
  }

  toggleEdit(): void {
    this.isEditMode = this.formService.simpleToggle(this.isEditMode);
    if (this.isEditMode) {
      this.contactForm.enable();
    } else {
      this.contactForm.patchValue(this.initialFormValues);
      this.contactForm.disable();
    }
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.isNewContact) {
      this.annuaireService.createAnnuaire(this.contactForm.value).subscribe({
        next: (result) => {
          this.formService.snackMessage('Contact créé avec succès', 0, this.snackBar);
          this.isNewContact = false;
          this.isEditMode = false;
          this.contact = { ...this.contactForm.getRawValue(), uuid_ann: result.uuid_ann };
          this.data.uuid_ann = result.uuid_ann;
          this.initialFormValues = this.contactForm.getRawValue();
          this.contactForm.disable();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erreur lors de la création du contact', error);
          this.formService.snackMessage('Erreur lors de la création du contact', 1, this.snackBar);
        },
      });
      return;
    }

    if (!this.formService.isFormChanged(this.contactForm, this.initialFormValues)) {
      this.formService.snackMessage('Aucune donnée modifiée', 0, this.snackBar);
      this.isEditMode = false;
      this.contactForm.disable();
      return;
    }

    this.annuaireService.updateAnnuaire(this.data.uuid_ann!, this.contactForm.value).subscribe({
      next: () => {
        this.formService.snackMessage('Modifications enregistrées avec succès', 0, this.snackBar);
        this.isEditMode = false;
        this.initialFormValues = this.contactForm.getRawValue();
        this.contactForm.disable();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du contact', error);
        this.formService.snackMessage('Erreur lors de la mise à jour du contact', 1, this.snackBar);
      },
    });
  }

  deleteItemConfirm(): void {
    const nom = this.contact?.nom || 'ce contact';
    this.confirmationService
      .confirm(
        'Confirmation de suppression',
        `Voulez-vous vraiment supprimer "<strong>${nom}</strong>" ?<br><strong>Cette action est irréversible.</strong>`,
        'delete'
      )
      .subscribe((result) => {
        if (result) {
          this.annuaireService.deleteAnnuaire(this.data.uuid_ann!).subscribe({
            next: () => {
              this.formService.snackMessage('Contact supprimé', 0, this.snackBar);
              this.dialogRef.close(true);
            },
            error: (error) => console.error('Erreur lors de la suppression du contact', error),
          });
        }
      });
  }

  // ── Étiquettes ────────────────────────────────────────────────────────────

  get availableEtiquettes(): SelectValue[] {
    return this.typEtiquettes.filter(
      (t) => !this.etiquettes.some((e) => e.typ_etiquette === t.cd_type)
    );
  }

  addEtiquette(): void {
    if (!this.selectedEtiquetteToAdd || !this.data.uuid_ann) return;
    const cd_type = this.selectedEtiquetteToAdd;
    this.annuaireService.upsertEtiquette(this.data.uuid_ann, cd_type).subscribe({
      next: () => {
        this.etiquettes.push({
          annuaire: this.data.uuid_ann!,
          typ_etiquette: cd_type,
          libelle: this.getLibelle(cd_type, this.typEtiquettes),
        });
        this.selectedEtiquetteToAdd = null;
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Erreur lors de l\'ajout de l\'étiquette', error),
    });
  }

  removeEtiquette(etiquette: Etiquette): void {
    if (!this.data.uuid_ann) return;
    this.annuaireService.deleteEtiquette(this.data.uuid_ann, etiquette.typ_etiquette).subscribe({
      next: () => {
        this.etiquettes = this.etiquettes.filter((e) => e.typ_etiquette !== etiquette.typ_etiquette);
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Erreur lors de la suppression de l\'étiquette', error),
    });
  }

  // ── Compétences ───────────────────────────────────────────────────────────

  get availableCompetences(): SelectValue[] {
    return this.typCompetences.filter(
      (t) => !this.competences.some((c) => c.typ_competence === t.cd_type)
    );
  }

  addCompetence(): void {
    if (!this.selectedCompetenceToAdd || !this.data.uuid_ann) return;
    const cd_type = this.selectedCompetenceToAdd;
    const notation = this.notationToAdd ?? undefined;
    const remarque = this.remarqueToAdd || undefined;

    this.annuaireService.upsertCompetence(this.data.uuid_ann, cd_type, { notation, remarque }).subscribe({
      next: () => {
        this.competences.push({
          annuaire: this.data.uuid_ann!,
          typ_competence: cd_type,
          libelle: this.getLibelle(cd_type, this.typCompetences),
          notation,
          remarque,
        });
        this.selectedCompetenceToAdd = null;
        this.notationToAdd = null;
        this.remarqueToAdd = '';
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Erreur lors de l\'ajout de la compétence', error),
    });
  }

  startEditCompetence(competence: Competence): void {
    this.editingCompetenceTyp = competence.typ_competence;
    this.editNotation = competence.notation ?? null;
    this.editRemarque = competence.remarque ?? '';
  }

  cancelEditCompetence(): void {
    this.editingCompetenceTyp = null;
  }

  saveEditCompetence(competence: Competence): void {
    if (!this.data.uuid_ann) return;
    const notation = this.editNotation ?? undefined;
    const remarque = this.editRemarque || undefined;

    this.annuaireService.upsertCompetence(this.data.uuid_ann, competence.typ_competence, { notation, remarque }).subscribe({
      next: () => {
        competence.notation = notation;
        competence.remarque = remarque;
        this.editingCompetenceTyp = null;
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Erreur lors de la mise à jour de la compétence', error),
    });
  }

  removeCompetence(competence: Competence): void {
    if (!this.data.uuid_ann) return;
    this.annuaireService.deleteCompetence(this.data.uuid_ann, competence.typ_competence).subscribe({
      next: () => {
        this.competences = this.competences.filter((c) => c.typ_competence !== competence.typ_competence);
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Erreur lors de la suppression de la compétence', error),
    });
  }
}
