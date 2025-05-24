import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../confirmation/confirmation.component';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  constructor(private dialog: MatDialog) {}

  confirm(title: string, message: string, dialogConfig: any = {}): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { title, message },
      width: '400px',
      ...dialogConfig
    });
    return dialogRef.afterClosed();
  }
}