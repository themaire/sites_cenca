import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'confirmation-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButton],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss'
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }
  ) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }
  onYesClick(): void {
    this.dialogRef.close(true);
  }
}
