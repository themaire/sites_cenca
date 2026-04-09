import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { firstValueFrom } from 'rxjs';
import { SitesService } from '../../../sites.service';
import { ActeService } from '../acte.service';

interface SiteLite {
  uuid_site: string;
  nom_site: string;
}

interface AttachDialogData {
  acteUuid: string;
  currentSiteUuid?: string;
}

interface AttachedSiteRef {
  uuid_site: string;
  nom_site?: string;
}

@Component({
  selector: 'app-attach-acte-site-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './attach-acte-site-dialog.component.html',
  styleUrl: './attach-acte-site-dialog.component.scss',
})
export class AttachActeSiteDialogComponent implements OnInit {
  private dialogData = inject<AttachDialogData>(MAT_DIALOG_DATA);

  public sites: SiteLite[] = [];
  private attachedSites: AttachedSiteRef[] = [];
  selectedSiteUuid = '';
  public isLoading = true;
  public isSubmitting = false;

  constructor(
    private dialogRef: MatDialogRef<AttachActeSiteDialogComponent>,
    private sitesService: SitesService,
    private acteService: ActeService,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadSites();
  }

  private async loadSites(): Promise<void> {
    this.isLoading = true;
    try {
      await this.loadAttachedSites();
      const rows = await this.sitesService.getMfuSitesLite();
      const currentSiteUuid = this.dialogData.currentSiteUuid;
      this.sites = (rows || [])
        .filter((site: SiteLite) => site.uuid_site !== currentSiteUuid)
        .sort((a: SiteLite, b: SiteLite) => (a.nom_site || '').localeCompare(b.nom_site || '', 'fr'));
    } catch (error) {
      console.warn('Route mfu/sites/lite indisponible, fallback actif.', error);
      const rows = await this.sitesService.getSitesLiteFallback();
      const currentSiteUuid = this.dialogData.currentSiteUuid;
      this.sites = (rows || [])
        .filter((site: SiteLite) => site.uuid_site !== currentSiteUuid)
        .sort((a: SiteLite, b: SiteLite) => (a.nom_site || '').localeCompare(b.nom_site || '', 'fr'));
    } finally {
      this.isLoading = false;
    }
  }

  private async loadAttachedSites(): Promise<void> {
    // Charge les sites deja lies pour eviter les doublons de rattachement.
    if (!this.dialogData.acteUuid) {
      this.attachedSites = [];
      return;
    }

    try {
      const rows = await this.acteService.getActesMultiSitesLite();
      const current = rows.find((row: any) => row?.uuid_acte === this.dialogData.acteUuid);
      const details = Array.isArray(current?.sites_associes_details) ? current.sites_associes_details : [];

      this.attachedSites = details
        .filter((site: any) => !!site?.uuid_site)
        .map((site: any) => ({
          uuid_site: String(site.uuid_site),
          nom_site: site?.nom_site,
        }));
    } catch (error) {
      console.warn('Impossible de charger les sites deja rattaches pour verifier les doublons.', error);
      this.attachedSites = [];
    }
  }

  private isAlreadyAttached(siteUuid: string): boolean {
    return this.attachedSites.some((site) => String(site.uuid_site) === String(siteUuid));
  }

  close(): void {
    this.dialogRef.close(false);
  }

  async attach(): Promise<void> {
    if (!this.selectedSiteUuid || !this.dialogData.acteUuid) {
      return;
    }

    if (this.isAlreadyAttached(this.selectedSiteUuid)) {
      this.snackBar.open('Ce site est déjà rattaché à cet acte.', 'OK', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;
    try {
      await firstValueFrom(
        this.sitesService.attachActeToSite({
          ref_uuid_acte: this.dialogData.acteUuid,
          ref_uuid_site: this.selectedSiteUuid,
          amm_date_crea: new Date().toISOString(),
        })
      );

      this.snackBar.open('Acte rattaché au site.', 'OK', { duration: 2500 });
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Erreur lors du rattachement de l\'acte', error);
      this.snackBar.open('Erreur lors du rattachement.', 'OK', { duration: 3000 });
    } finally {
      this.isSubmitting = false;
    }
  }
}
