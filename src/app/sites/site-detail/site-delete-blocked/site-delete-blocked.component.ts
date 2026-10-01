import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { SiteDeleteDependance } from '../../sites.service';

export interface SiteDeleteBlockedData {
  /** Message du backend, déjà rédigé en clair (motif + code du site) */
  message: string;
  dependances: SiteDeleteDependance[];
}

// Petite boîte de dialogue rouge qui explique pourquoi un site ne peut pas être supprimé
// (données rattachées). Même présentation que la confirmation de suppression (shared/confirmation).
@Component({
  selector: 'app-site-delete-blocked',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './site-delete-blocked.component.html',
  styleUrl: './site-delete-blocked.component.scss',
})
export class SiteDeleteBlockedComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: SiteDeleteBlockedData) {}
}
