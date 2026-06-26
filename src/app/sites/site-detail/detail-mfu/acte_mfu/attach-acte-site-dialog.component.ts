import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { firstValueFrom } from 'rxjs';
import { SitesService } from '../../../sites.service';
import { ActeService } from '../acte.service';

interface SiteLite {
  uuid_site: string;
  code_site?: string;
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
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
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
  public filteredSites: SiteLite[] = [];
  private attachedSites: AttachedSiteRef[] = [];
  selectedSiteUuid = '';
  siteControl = new FormControl<string>('');
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
    this.initAutocomplete();
  }

  private initAutocomplete(): void {
    this.siteControl.valueChanges.subscribe((value) => {
      const query = String(value || '');
      this.filteredSites = this.filterSites(query);

      const exact = this.sites.find((site) => this.sameUuid(site.uuid_site, query));
      this.selectedSiteUuid = exact?.uuid_site || '';
    });
  }

  private async loadSites(): Promise<void> {
    this.isLoading = true;
    try {
      await this.loadAttachedSites();
      const rows = await this.sitesService.getMfuSitesLite();
      const currentSiteUuid = this.dialogData.currentSiteUuid;
      const baseSites = (rows || [])
        .filter((site: SiteLite) => site.uuid_site !== currentSiteUuid)
        .sort((a: SiteLite, b: SiteLite) => (a.nom_site || '').localeCompare(b.nom_site || '', 'fr'));
      this.sites = await this.enrichSiteCodes(baseSites);
      this.filteredSites = [...this.sites];
    } catch (error) {
      console.warn('Route mfu/sites/lite indisponible, fallback actif.', error);
      const rows = await this.sitesService.getSitesLiteFallback();
      const currentSiteUuid = this.dialogData.currentSiteUuid;
      this.sites = (rows || [])
        .filter((site: SiteLite) => site.uuid_site !== currentSiteUuid)
        .sort((a: SiteLite, b: SiteLite) => (a.nom_site || '').localeCompare(b.nom_site || '', 'fr'));
      this.filteredSites = [...this.sites];
    } finally {
      this.isLoading = false;
    }
  }

  private async enrichSiteCodes(sites: SiteLite[]): Promise<SiteLite[]> {
    const missingCode = sites.some((site) => !String(site?.code_site || '').trim());
    if (!missingCode) {
      return sites;
    }

    try {
      const fallbackSites = await this.sitesService.getSitesLiteFallback();
      const codeByUuid = new Map(
        (fallbackSites || []).map((site: SiteLite) => [
          String(site.uuid_site || '').trim().toLowerCase(),
          String(site.code_site || '').trim(),
        ])
      );

      return sites.map((site) => {
        const currentCode = String(site?.code_site || '').trim();
        if (currentCode) {
          return site;
        }

        const mergedCode = codeByUuid.get(String(site.uuid_site || '').trim().toLowerCase()) || '';
        return {
          ...site,
          code_site: mergedCode,
        };
      });
    } catch (error) {
      console.warn('Impossible d\'enrichir les codes sites depuis le fallback.', error);
      return sites;
    }
  }

  formatSiteLabel(site: SiteLite): string {
    const code = String(site?.code_site || '').trim();
    const name = String(site?.nom_site || '').trim();
    return code ? `${code} - ${name}` : name;
  }

  displaySiteByUuid = (value: string | null): string => {
    const uuid = String(value || '').trim();
    if (!uuid) {
      return '';
    }

    const site = this.sites.find((row) => this.sameUuid(row.uuid_site, uuid));
    return site ? this.formatSiteLabel(site) : uuid;
  };

  onSiteOptionSelected(siteUuid: string): void {
    this.selectedSiteUuid = String(siteUuid || '');
  }

  private filterSites(queryValue: string): SiteLite[] {
    const query = String(queryValue || '').trim().toLowerCase();
    if (!query) {
      return [...this.sites];
    }

    return this.sites.filter((site) => {
      const text = `${site.code_site || ''} ${site.nom_site || ''}`.toLowerCase();
      return text.includes(query);
    });
  }

  private sameUuid(left: string, right: string): boolean {
    return String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase();
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

      this.snackBar.open('Acte rattaché au site.', 'OK', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Erreur lors du rattachement de l\'acte', error);
      this.snackBar.open('Erreur lors du rattachement.', 'OK', { duration: 3000 });
    } finally {
      this.isSubmitting = false;
    }
  }
}
