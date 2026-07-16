import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChiroService } from '../../../../services/chiro.service';
import { ObservationDetail, Typologies } from '../../../../interfaces/observation';

export interface DialogObservationData {
  uuidReleve: string;
  observation?: ObservationDetail;
  typologies: Typologies;
}

@Component({
  selector: 'app-dialog-observation',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatCheckboxModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatSelectModule, MatSnackBarModule,
  ],
  templateUrl: './dialog-observation.component.html',
  styleUrl: './dialog-observation.component.scss',
})
export class DialogObservationComponent implements OnInit {
  form!: FormGroup;
  saving = false;
  especes: { cd_espece: string; nom: string }[] = [];

  get isNouveauMode(): boolean { return !this.data.observation; }

  get typologies(): Typologies { return this.data.typologies; }

  get isMortalite(): boolean {
    return this.form?.get('type_observation')?.value === 'MOR';
  }

  get hasTestRabique(): boolean {
    return this.form?.get('test_rabique')?.value === true;
  }

  constructor(
    private fb: FormBuilder,
    private chiroService: ChiroService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<DialogObservationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogObservationData,
  ) {}

  ngOnInit() {
    const obs = this.data.observation;
    this.form = this.fb.group({
      espece: [obs?.cd_espece ?? '', Validators.required],
      nombre: [obs?.nombre ?? null, [Validators.required, Validators.min(0)]],
      type_observation: [obs?.type_observation ?? null],
      denombrement: [obs?.denombrement ?? null],
      objet: [obs?.objet ?? null],
      methode: [obs?.methode ?? null],
      statut_biologique: [obs?.statut_biologique ?? null],
      stade: [obs?.stade ?? null],
      sexe: [obs?.sexe ?? null],
      etat_bio: [obs?.etat_bio ?? null],
      commentaire: [obs?.commentaire ?? ''],
      mortalite_cause: [obs?.mortalite_cause ?? null],
      test_rabique: [obs?.test_rabique ?? false],
      resultat_test: [obs?.resultat_test ?? ''],
    });

    this.chiroService.getEspeces().then(e => this.especes = e);
  }

  onSubmit() {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    const val = this.form.value;
    const data = {
      espece: val.espece,
      nombre: val.nombre,
      type_observation: val.type_observation || null,
      denombrement: val.denombrement || null,
      objet: val.objet || null,
      methode: val.methode || null,
      statut_biologique: val.statut_biologique || null,
      stade: val.stade || null,
      sexe: val.sexe || null,
      etat_bio: val.etat_bio || null,
      commentaire: val.commentaire || null,
      mortalite_cause: val.mortalite_cause || null,
      test_rabique: val.test_rabique || false,
      resultat_test: val.resultat_test || null,
    };

    const op$ = this.isNouveauMode
      ? this.chiroService.createObservation(this.data.uuidReleve, data)
      : this.chiroService.updateObservation(this.data.observation!.uuid_observation, data);

    op$.subscribe({
      next: () => {
        this.snackBar.open(
          this.isNouveauMode ? 'Observation ajoutée' : 'Observation mise à jour',
          'Fermer', { duration: 3000 },
        );
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('[DialogObservation]', err);
        this.snackBar.open('Erreur lors de l\'enregistrement', 'Fermer', { duration: 4000 });
        this.saving = false;
      },
    });
  }
}
