import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { firstValueFrom } from 'rxjs';

import { FoncierService } from '../foncier.service';
import { ActeMultiSiteLite, SiteLite } from '../foncier';
import { ActeLite } from '../../site-detail/detail-mfu/acte';
import { ActeMfuComponent } from '../../site-detail/detail-mfu/acte_mfu/acte-mfu.component';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { CustomMatPaginatorIntl } from '../../../shared/costomMaterial/custom-matpaginator-intl';

@Component({
  selector: 'app-fon-actes-multi-sites',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatPaginatorModule,
    MatSortModule,
  ],
  templateUrl: './fon-actes-multi-sites.component.html',
  styleUrl: './fon-actes-multi-sites.component.scss',
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }],
})
export class FonActesMultiSitesComponent implements OnInit, AfterViewInit {
  // Valeur technique utilisee pour l'option de recherche dans les mat-select.
  readonly selectSearchOptionValue = '__select_search__';

  actes: ActeMultiSiteLite[] = [];
  sites: SiteLite[] = [];

  selectedActeUuid: string = '';
  selectedSiteUuids: string[] = [];
  acteSearch = '';
  siteSearch = '';
  filterValue: string = '';
  filterValidite: string = 'tous';
  isSubmitting = false;

  displayedColumns: string[] = [
    'typ_mfu',
    'debut',
    'fin',
    'site_principal_nom',
    'nb_sites',
  ];

  dataSource = new MatTableDataSource<ActeMultiSiteLite>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private foncierService: FoncierService,
    private snackbar: SnackbarService,
    private dialog: MatDialog,
    private overlay: Overlay
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadSites();
    await this.loadActes();
    this.hydrateActesWithSiteCodes();
    this.sites = this.ensureArray<SiteLite>(this.sites);
    this.actes = this.ensureArray<ActeMultiSiteLite>(this.actes);
    this.initDataSource();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private async loadActes(): Promise<void> {
    try {
      this.actes = this.ensureArray<ActeMultiSiteLite>(await this.foncierService.getActesMultiSites());
    } catch (error) {
      console.warn('Route mfu/multi-sites/lite indisponible, fallback actif.', error);
      await this.loadActesFallback();
    }

    this.hydrateActesWithSiteCodes();
  }

  private async loadSites(): Promise<void> {
    try {
      this.sites = this.ensureArray<SiteLite>(await this.foncierService.getMfuSitesLite());
    } catch (error) {
      console.warn('Route mfu/sites/lite indisponible, fallback actif.', error);
      this.sites = this.ensureArray<SiteLite>(await this.foncierService.getSitesLiteFallback());
    }

    this.sites = await this.enrichSiteCodes(this.sites);
  }

  private async enrichSiteCodes(sites: SiteLite[]): Promise<SiteLite[]> {
    const missingCode = this.ensureArray<SiteLite>(sites).some((site) => !String(site?.code_site || '').trim());
    if (!missingCode) {
      return sites;
    }

    try {
      const fallbackSites = this.ensureArray<SiteLite>(await this.foncierService.getSitesLiteFallback());
      const codeByUuid = new Map(
        fallbackSites.map((site) => [
          String(site.uuid_site || '').trim().toLowerCase(),
          String(site.code_site || '').trim(),
        ])
      );

      return sites.map((site) => {
        const currentCode = String(site?.code_site || '').trim();
        if (currentCode) {
          return site;
        }

        return {
          ...site,
          code_site: codeByUuid.get(String(site.uuid_site || '').trim().toLowerCase()) || '',
        };
      });
    } catch (error) {
      console.warn('Impossible de completer les codes sites sur /foncier/amfu.', error);
      return sites;
    }
  }

  private hydrateActesWithSiteCodes(): void {
    if (!this.actes?.length || !this.sites?.length) {
      return;
    }

    const codeByUuid = new Map(
      this.sites.map((site) => [
        String(site.uuid_site || '').trim().toLowerCase(),
        String(site.code_site || '').trim(),
      ])
    );

    this.actes = this.actes.map((acte) => {
      const currentCode = String(acte?.site_principal_code || '').trim();
      if (currentCode) {
        return acte;
      }

      const siteCode = codeByUuid.get(String(acte?.site_principal_uuid || '').trim().toLowerCase()) || '';
      return {
        ...acte,
        site_principal_code: siteCode,
      };
    });
  }

  private async loadActesFallback(): Promise<void> {
    // Fallback: reconstruit les liens acte-site en parcourant chaque site.
    if (!this.sites.length) {
      this.actes = [];
      return;
    }

    const actsByUuid = new Map<string, ActeMultiSiteLite>();

    await Promise.all(
      this.sites.map(async (site) => {
        try {
          const siteActes = await this.foncierService.getActesBySiteLite(site.uuid_site);
          for (const acte of this.ensureArray<ActeLite>(siteActes)) {
            const existing = actsByUuid.get(acte.uuid_acte);
            if (!existing) {
              actsByUuid.set(acte.uuid_acte, {
                uuid_acte: acte.uuid_acte,
                typ_mfu: acte.typ_mfu,
                typ_mfu_libelle: acte.typ_mfu,
                debut: acte.debut,
                fin: acte.fin,
                validite: acte.validite,
                site_principal_uuid: acte.site,
                site_principal_code: site.code_site,
                site_principal_nom: site.nom_site,
                nb_sites: 1,
                sites_associes: site.nom_site,
                sites_uuids: [site.uuid_site],
              });
            } else if (!(existing.sites_uuids ?? []).includes(site.uuid_site)) {
              const updatedUuids = [...(existing.sites_uuids ?? []), site.uuid_site];
              const updatedNames = [
                ...(existing.sites_associes ? existing.sites_associes.split(' | ') : []),
                site.nom_site,
              ];
              existing.sites_uuids = updatedUuids;
              existing.nb_sites = updatedUuids.length;
              existing.sites_associes = Array.from(new Set(updatedNames)).join(' | ');
              actsByUuid.set(acte.uuid_acte, existing);
            }
          }
        } catch (siteError) {
          console.warn(`Impossible de charger les actes du site ${site.uuid_site}`, siteError);
        }
      })
    );

    this.actes = Array.from(actsByUuid.values()).sort((a, b) => {
      const dateA = a.debut ? new Date(a.debut).getTime() : 0;
      const dateB = b.debut ? new Date(b.debut).getTime() : 0;
      return dateB - dateA;
    });
  }

  private ensureArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
  }

  private initDataSource(): void {
    this.dataSource = new MatTableDataSource<ActeMultiSiteLite>(this.actes);
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }

    this.dataSource.sortingDataAccessor = (item: ActeMultiSiteLite, property: string): string | number => {
      switch (property) {
        case 'typ_mfu':
          return String(item.typ_mfu_libelle || item.typ_mfu || '').toLowerCase();
        case 'debut':
          return item.debut ? new Date(item.debut).getTime() : 0;
        case 'fin':
          return item.fin ? new Date(item.fin).getTime() : 0;
        case 'site_principal_nom':
          return String(item.site_principal_nom || '').toLowerCase();
        case 'nb_sites':
          return Number(item.nb_sites ?? 0);
        default:
          return String((item as any)[property] ?? '').toLowerCase();
      }
    };

    this.dataSource.filterPredicate = (data: ActeMultiSiteLite, filter: string): boolean => {
      const parsedFilter = JSON.parse(filter) as { validite: string; keyword: string };
      const validiteValue = String(data.validite);
      const keyword = parsedFilter.keyword || '';

      const matchesValidite =
        parsedFilter.validite === 'tous' ||
        (parsedFilter.validite === 'valide' && validiteValue === 'true') ||
        (parsedFilter.validite === 'invalide' && validiteValue === 'false');

      if (!matchesValidite) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const aggregate = [
        data.typ_mfu_libelle ?? '',
        data.typ_mfu ?? '',
        this.toDateString(data.debut),
        this.toDateString(data.fin),
        data.site_principal_nom ?? '',
        data.sites_associes ?? '',
        validiteValue === 'true' ? 'valide' : 'invalide',
      ]
        .join(' ')
        .toLowerCase();

      return aggregate.includes(keyword);
    };

    this.updateTableFilter();
  }

  applyFilter(value: string): void {
    this.filterValue = value;
    this.updateTableFilter();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  applicationFiltre(): void {
    this.updateTableFilter();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  get actesTotal(): number {
    return this.actes.length;
  }

  get actesValides(): number {
    return this.actes.filter((acte) => String(acte.validite) === 'true').length;
  }

  get actesInvalides(): number {
    return this.actes.filter((acte) => String(acte.validite) === 'false').length;
  }

  getActesPageSizeOptions(): number[] {
    const totalFiltered = this.dataSource.filteredData.length;
    const total = totalFiltered > 0 ? totalFiltered : this.dataSource.data.length;
    const baseOptions = [10, 20, 50];
    const options = total > 0 ? [...baseOptions, total] : baseOptions;
    return Array.from(new Set(options)).sort((a, b) => a - b);
  }

  private updateTableFilter(): void {
    this.dataSource.filter = JSON.stringify({
      validite: this.filterValidite,
      keyword: this.filterValue.trim().toLowerCase(),
    });
  }

  get filteredActesForSelect(): ActeMultiSiteLite[] {
    const query = this.acteSearch.trim().toLowerCase();
    if (!query) {
      return this.actes;
    }

    return this.actes.filter((acte) => {
      const label = acte.typ_mfu_libelle || acte.typ_mfu || '';
      const text = `${label} ${this.toDateString(acte.debut)} ${acte.site_principal_code || ''} ${acte.site_principal_nom || ''}`.toLowerCase();
      return text.includes(query);
    });
  }

  get filteredSitesForSelect(): SiteLite[] {
    const query = this.siteSearch.trim().toLowerCase();
    if (!query) {
      return this.sites;
    }

    return this.sites.filter((site) => {
      const text = `${site.code_site || ''} ${site.nom_site || ''}`.toLowerCase();
      return text.includes(query);
    });
  }

  formatSiteLabel(site: SiteLite): string {
    const code = String(site?.code_site || '').trim();
    const name = String(site?.nom_site || '').trim();
    return code ? `${code} - ${name}` : name;
  }

  getSitePrincipalLabel(acte: ActeMultiSiteLite): string {
    const code = String(acte?.site_principal_code || '').trim();
    const name = String(acte?.site_principal_nom || '').trim();
    if (!code) {
      return name || '-';
    }

    return name ? `${code} - ${name}` : code;
  }

  onActeSelectionChange(value: string | null): void {
    if (!value || value === this.selectSearchOptionValue) {
      this.selectedActeUuid = '';
      return;
    }

    this.selectedActeUuid = value;
  }

  onSiteSelectionChange(values: string[] | null): void {
    this.selectedSiteUuids = (values ?? []).filter(
      (value) => value !== this.selectSearchOptionValue
    );
  }

  clearActeSelection(): void {
    this.selectedActeUuid = '';
  }

  clearSiteSelection(): void {
    this.selectedSiteUuids = [];
  }

  onActeSelectOpened(opened: boolean): void {
    if (!opened) {
      return;
    }

    setTimeout(() => {
      const input = document.querySelector('.acte-select-search-input') as HTMLInputElement | null;
      input?.focus();
      input?.select();
    }, 0);
  }

  onSiteSelectOpened(opened: boolean): void {
    if (!opened) {
      return;
    }

    setTimeout(() => {
      const input = document.querySelector('.site-select-search-input') as HTMLInputElement | null;
      input?.focus();
      input?.select();
    }, 0);
  }

  async refreshActes(): Promise<void> {
    await this.loadActes();
    this.hydrateActesWithSiteCodes();
    this.initDataSource();
    this.applyFilter(this.filterValue);
  }

  async attachSelectedActeToSite(): Promise<void> {
    if (!this.selectedActeUuid || !this.selectedSiteUuids.length) {
      this.snackbar.error('Sélectionnez au moins un acte et au moins un site avant de rattacher.');
      return;
    }

    const selectedMap = new Map(this.actes.map((acte) => [acte.uuid_acte, acte]));
    const linksToCreate: Array<{ ref_uuid_acte: string; ref_uuid_site: string; amm_date_crea: string }> = [];

    const acte = selectedMap.get(this.selectedActeUuid);
    const existingSiteUuids = acte?.sites_uuids ?? [];

    for (const siteUuid of this.selectedSiteUuids) {
      if (!existingSiteUuids.includes(siteUuid)) {
        linksToCreate.push({
          ref_uuid_acte: this.selectedActeUuid,
          ref_uuid_site: siteUuid,
          amm_date_crea: new Date().toISOString().slice(0, 10),
        });
      }
    }

    if (!linksToCreate.length) {
      this.snackbar.info('Tous les rattachements selectionnes existent deja.');
      return;
    }

    this.isSubmitting = true;

    let successCount = 0;
    let errorCount = 0;

    for (const payload of linksToCreate) {
      try {
        await firstValueFrom(this.foncierService.attachActeToSite(payload));
        successCount += 1;
      } catch (error) {
        console.error('Erreur lors du rattachement multi-sites', error);
        errorCount += 1;
      }
    }

    this.isSubmitting = false;

    if (successCount > 0) {
      this.snackbar.success(`${successCount} rattachement(s) ajoute(s) avec succes.`);
      this.selectedSiteUuids = [];
      this.selectedActeUuid = '';
      await this.refreshActes();
    }

    if (errorCount > 0) {
      this.snackbar.error(`${errorCount} rattachement(s) en erreur. Si la route est introuvable, redemarrez le backend.`);
    }
  }

  toDateString(value: string | Date | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString('fr-FR');
  }

  getAttachedSiteChips(acte: ActeMultiSiteLite): string[] {
    if (Array.isArray(acte.sites_associes)) {
      return (acte.sites_associes as unknown as string[])
        .map((name) => String(name).trim())
        .filter((name) => !!name);
    }

    const sitesAsString = String(acte.sites_associes ?? '');
    if (!sitesAsString.trim()) {
      return [];
    }

    return sitesAsString
      .split('|')
      .map((name) => name.trim())
      .filter((name) => !!name);
  }

  onRowSelect(acte: ActeMultiSiteLite): void {
    if (!acte?.uuid_acte) {
      return;
    }

    const acteLite = {
      uuid_acte: acte.uuid_acte,
      site: acte.site_principal_uuid || '',
      nom: acte.site_principal_nom || '',
      typ_mfu: acte.typ_mfu || '',
      debut: acte.debut as any,
      fin: acte.fin as any,
      validite: acte.validite as any,
    } as ActeLite;

    const dialogRef = this.dialog.open(ActeMfuComponent, {
      data: {
        ...acteLite,
        currentSiteUuid: acte.site_principal_uuid || acteLite.site || '',
      },
      minWidth: '80vw',
      maxWidth: '95vw',
      height: '85vh',
      maxHeight: '95vh',
      hasBackdrop: true,
      backdropClass: 'custom-backdrop-gerer',
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      autoFocus: false,
      restoreFocus: false,
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.refreshActes();
      }
    });
  }
}
