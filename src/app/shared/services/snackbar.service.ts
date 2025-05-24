import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string, action: string = 'Fermer', duration: number = 3000) {
    this.snackBar.open(message, action, {
      duration,
      panelClass: ['success-snackbar']
    });
  }

  error(message: string, action: string = 'Fermer', duration: number = 3000) {
    this.snackBar.open(message, action, {
      duration,
      panelClass: ['error-snackbar']
    });
  }

  info(message: string, action: string = 'Fermer', duration: number = 3000) {
    this.snackBar.open(message, action, {
      duration,
      panelClass: ['info-snackbar']
    });
  }

  delete(type: string, messageBonus?: string, action: string = 'Fermer', duration: number = 3000) {
    // Gestion du message de suppression
    let message = '';
    if (type === 'localisation') {
        message = `La ${type} a été supprimée avec succès.`;
    } else {
        message = type.charAt(0).toUpperCase() + type.slice(1) + ` supprimé avec succès.`;
    }

    message = messageBonus ? `${message} ${messageBonus}` : message;

    this.snackBar.open(`${message}`, action, {
      duration,
      panelClass: ['delete-snackbar']
    });
  }

}