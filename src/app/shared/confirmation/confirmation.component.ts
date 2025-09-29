import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

type Mode = 'delete' | 'duplicate';
export interface ExcludeOption { key: string; label: string }

@Component({
  selector: 'confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButton, MatCheckboxModule],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss'
})
export class ConfirmationDialogComponent {
  excludeOptions: ExcludeOption[] = [];
  selectedExcludes = new Set<string>();

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string, mode: Mode, excludeOptions?: ExcludeOption[] }
  ) {
    if (this.data.mode === 'duplicate') {
      this.excludeOptions = this.data.excludeOptions ?? [
        { key: 'dates', label: 'Dates' },
        { key: 'quantite', label: 'Quantité' },
        { key: 'unite', label: 'Unité' },
        { key: 'description', label: 'Description' },
      ];
    }
  }

  toggleExclude(key: string, checked: boolean) {
    if (checked) this.selectedExcludes.add(key); else this.selectedExcludes.delete(key);
  }

  onNoClick(): void {
    this.dialogRef.close(false); // Annulation
  }
  
  onYesClick(): void {
    if (this.data.mode === 'duplicate') {
      this.dialogRef.close(Array.from(this.selectedExcludes));
    } else {
      this.dialogRef.close(true);
    }
    this.dialogRef.close(true); // Retourne true via l'observable afterClosed() du service
  }
}
