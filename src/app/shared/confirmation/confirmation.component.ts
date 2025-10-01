import { Component, Inject } from '@angular/core';
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
  selectedExcludes = new Set<string>(); // Ce qui va etre retourné en cas de duplication. Par exemple: ['dates', 'quantite']

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string, mode: Mode }
  ) {
    if (this.data.mode === 'duplicate') {
      this.excludeOptions = [
        { key: 'dates', label: 'Dates' },
        { key: 'quantite', label: 'Quantité' },
        { key: 'unite', label: 'Unité' },
        { key: 'description', label: 'Description' },
      ];
    }
  }

  /** Gestion des cases à cocher pour l'exclusion
   * Utilisée uniquement en mode duplication
   * Appelé et attache a chzque checkbox dans le template
   * @param key La clé de l'option (par exemple 'dates')
   * @param checked Si la case est cochée ou décochée
   */
  toggleExclude(key: string, checked: boolean) {
    if (checked) this.selectedExcludes.add(key); else this.selectedExcludes.delete(key);
  }

  /** Annuler la suppression ou la duplication */
  onNoClick(): void {
    this.dialogRef.close(false); // Retourne false via l'observable afterClosed() du service
  }
  
  /** Confirmer la suppression ou la duplication
   * En mode duplication, retourne un tableau des options à exclure (par exemple: ['dates', 'quantite'])
   * En mode suppression, retourne true
   */
  onYesClick(): void {
    if (this.data.mode === 'duplicate') {
      this.dialogRef.close(Array.from(this.selectedExcludes));
    } else {
      this.dialogRef.close(true);
    }
  }
}
