import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { EntiteCoherente } from '../../site-detail/detail-gestion/docplan';
import { SitesService } from '../../sites.service';
import { FormService } from '../../../shared/services/form.service';

import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-ecg-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './ecg-picker.component.html',
  styleUrl: './ecg-picker.component.scss',
})
export class EcgPickerComponent implements OnInit {
  entites: EntiteCoherente[] = [];
  dataSource!: MatTableDataSource<EntiteCoherente>;
  displayedColumns: string[] = ['nom_ecg', 'sites', 'action'];

  isLoading = true;
  isCreating = false;
  ecgForm!: FormGroup;

  private sitesService = inject(SitesService);
  private formService = inject(FormService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  constructor(private dialogRef: MatDialogRef<EcgPickerComponent>) {}

  async ngOnInit() {
    try {
      this.entites = await this.sitesService.getEntitesCoherentes();
      this.dataSource = new MatTableDataSource(this.entites);
    } catch (err) {
      console.error('Erreur chargement entités cohérentes', err);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  select(ecg: EntiteCoherente): void {
    this.dialogRef.close(ecg);
  }

  startCreate(): void {
    this.ecgForm = this.formService.newEntiteCoherenteForm();
    this.isCreating = true;
  }

  cancelCreate(): void {
    this.isCreating = false;
  }

  saveCreate(): void {
    if (!this.ecgForm.valid) return;

    this.sitesService.insertTable('docplan_entites_coherentes', this.ecgForm.value).subscribe({
      next: () => {
        const newEcg: EntiteCoherente = {
          uuid_ecg: this.ecgForm.value.uuid_ecg,
          nom_ecg: this.ecgForm.value.nom,
          nom: null,
        };
        this.snackBar.open('Entité cohérente créée', 'Fermer', {
          duration: 3000,
          panelClass: ['snackbar-success'],
        });
        this.dialogRef.close(newEcg);
      },
      error: (err) => console.error('Erreur création ECG', err),
    });
  }
}
