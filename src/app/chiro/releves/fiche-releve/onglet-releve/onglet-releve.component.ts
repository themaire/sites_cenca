import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChiroService, Commune } from '../../../services/chiro.service';
import { DetailReleve } from '../../../interfaces/releve';
import { Typologies } from '../../../interfaces/observation';

@Component({
  selector: 'app-onglet-releve',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatCardModule, MatDatepickerModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatNativeDateModule, MatSelectModule, MatSnackBarModule,
  ],
  templateUrl: './onglet-releve.component.html',
  styleUrl: './onglet-releve.component.scss',
})
export class OngletReleveComponent implements OnChanges {
  @Input() releve!: DetailReleve;
  @Input() isEditMode = false;
  @Input() typologies?: Typologies;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form?: FormGroup;
  communes: Commune[] = [];
  saving = false;

  constructor(
    private fb: FormBuilder,
    private chiroService: ChiroService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isEditMode'] && this.isEditMode && !this.form) {
      this.initForm();
      this.chiroService.getCommunes().then(c => this.communes = c);
    }
    if (changes['releve'] && this.form) {
      this.form.patchValue(this.buildFormValue());
    }
  }

  private buildFormValue() {
    return {
      date_releve: this.releve.date_releve ? new Date(this.releve.date_releve) : null,
      insee: this.releve.insee,
      site: this.releve.site || null,
      observateur_cite: this.releve.observateur_cite || '',
      precision_loc: this.releve.precision_loc || '',
      x: this.releve.x || null,
      y: this.releve.y || null,
      habitat: this.releve.habitat || null,
      commentaire: this.releve.commentaire || '',
    };
  }

  private initForm() {
    this.form = this.fb.group({
      date_releve: [null, Validators.required],
      insee: ['', Validators.required],
      site: [null],
      observateur_cite: [''],
      precision_loc: [''],
      x: [null],
      y: [null],
      habitat: [null],
      commentaire: [''],
    });
    this.form.patchValue(this.buildFormValue());
  }

  onSubmit() {
    if (!this.form || this.form.invalid || this.saving) return;
    this.saving = true;
    const val = this.form.value;
    const data = {
      date_releve: this.formatDate(val.date_releve),
      insee: val.insee,
      site: val.site || null,
      observateur_cite: val.observateur_cite || null,
      precision_loc: val.precision_loc || null,
      x: val.x || null,
      y: val.y || null,
      habitat: val.habitat || null,
      commentaire: val.commentaire || null,
    };
    this.chiroService.updateReleve(this.releve.uuid_releve, data).subscribe({
      next: () => {
        this.snackBar.open('Relevé mis à jour', 'Fermer', { duration: 3000 });
        this.saving = false;
        this.form = undefined;
        this.saved.emit();
      },
      error: (err) => {
        console.error('[OngletReleve] MAJ', err);
        this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 4000 });
        this.saving = false;
      },
    });
  }

  onCancel() {
    this.form = undefined;
    this.cancelled.emit();
  }

  private formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
