import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButton],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss'
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string, mode: 'delete' | 'duplicate' }
  ) {}

  onNoClick(): void {
    this.dialogRef.close(false); // Retourne false via l'observable afterClosed() du service
  }
  onYesClick(): void {
    this.dialogRef.close(true); // Retourne true via l'observable afterClosed() du service
  }
}
