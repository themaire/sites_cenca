import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { ConfirmationDialogComponent } from '../confirmation/confirmation.component';
import { Observable } from 'rxjs';
import { ExcludeOption } from '../confirmation/confirmation.component';

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  constructor(private dialog: MatDialog,
              private overlay: Overlay
  ) {}

  /**
   * Configuration de la boîte de dialogue de confirmation pour la suppression
   * d'une opération ou d'une localisation.
   */
dialogConfig = {
  // minWidth: '20vw',
  // maxWidth: '95vw',
  width: '580px',
  height: '220px',
  // maxHeight: '90vh',
  hasBackdrop: true, // Activer le fond
  backdropClass: '', // Classe personnalisé
  backdropClass: '', // Classe personnalisé
  enterAnimationDuration: '300ms',
  exitAnimationDuration: '300ms',

  scrollStrategy: this.overlay.scrollStrategies.close(), // ✅ Résout le décalage du fond (ne ferme pas car scroll interne)
};

  confirm(title: string, message: string, mode: 'delete' | 'duplicate', excludeOptions?: ExcludeOption[]): Observable<boolean | string[]> {
    if (mode === 'duplicate') {
      this.dialogConfig.height = '350px'; // Laisser de la place pour les checkbox en mode duplication
      this.dialogConfig.backdropClass = 'custom-backdrop-duplicate'; // Classe personnalisée pour le fond en mode duplication
    } else if (mode === 'delete') {
      this.dialogConfig.backdropClass = 'custom-backdrop-delete'; // Classe personnalisée pour le fond en mode suppression
    }
    
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { title, message, mode, excludeOptions },

      ... this.dialogConfig // Les 3 points permettent de décomposer l'objet dialogConfig
    });
    return dialogRef.afterClosed();
  }
}