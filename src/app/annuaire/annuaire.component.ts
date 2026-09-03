import { Component, OnInit, ChangeDetectorRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { CustomMatPaginatorIntl } from '../shared/costomMaterial/custom-matpaginator-intl';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule, MatChipListboxChange } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';

import { AnnuaireService } from './annuaire.service';
import { FormService } from '../shared/services/form.service';
import { AnnuaireLite } from './interfaces/annuaire';
import { SelectValue } from '../shared/interfaces/formValues';
import { AnnuaireFicheComponent } from './annuaire-fiche/annuaire-fiche.component';

@Component({
  selector: 'app-annuaire',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatPaginatorModule,
  ],
  templateUrl: './annuaire.component.html',
  styleUrl: './annuaire.component.scss',
  providers: [
    { provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }
  ],
})
export class AnnuaireComponent implements OnInit {
  public contacts: AnnuaireLite[] = [];
  public dataSource!: MatTableDataSource<AnnuaireLite>;
  public displayedColumns: string[] = ['nom', 'typ_personne', 'telephone', 'mail', 'etiquettes', 'validite'];

  public typPersonnes: SelectValue[] = [];
  public filterTypPersonne: string = 'tous';
  private searchQuery: string = '';

  public loading: boolean = true;

  private _sort!: MatSort;
  @ViewChild(MatSort) set sort(s: MatSort) {
    this._sort = s;
    if (this.dataSource) this.dataSource.sort = s;
  }

  private _paginator!: MatPaginator;
  @ViewChild(MatPaginator) set paginator(p: MatPaginator) {
    this._paginator = p;
    if (this.dataSource) this.dataSource.paginator = p;
  }

  private annuaireService: AnnuaireService = inject(AnnuaireService);
  private formService: FormService = inject(FormService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  constructor(
    private dialog: MatDialog,
    private overlay: Overlay
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.typPersonnes = await this.annuaireService.getTypPersonnes();
    } catch (error) {
      console.error('Erreur lors du chargement des types de personnes', error);
    }
    await this.fetchContacts();
  }

  private async fetchContacts(): Promise<void> {
    this.loading = true;
    try {
      this.contacts = await this.annuaireService.getAnnuaires();
      this.dataSource = new MatTableDataSource(this.contacts);
      this.dataSource.sort = this._sort;
      this.dataSource.paginator = this._paginator;
      this.dataSource.filterPredicate = (data: AnnuaireLite, filter: string) => {
        const { text, typ } = JSON.parse(filter);
        const matchesTyp = typ === 'tous' || data.typ_personne === typ;
        const haystack = `${data.nom ?? ''} ${data.adresse ?? ''} ${data.mail ?? ''} ${data.telephone ?? ''}`.toLowerCase();
        const matchesText = !text || haystack.includes(text);
        return matchesTyp && matchesText;
      };
      this.updateFilter();
    } catch (error) {
      console.error('Erreur lors du chargement de l\'annuaire', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private updateFilter(): void {
    if (!this.dataSource) return;
    this.dataSource.filter = JSON.stringify({ text: this.searchQuery.trim().toLowerCase(), typ: this.filterTypPersonne });
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  applyFilter(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.updateFilter();
  }

  applyTypeFilter(event: MatChipListboxChange): void {
    this.filterTypPersonne = event.value;
    this.updateFilter();
  }

  countByType(cd_type: string): number {
    return (this.contacts || []).filter(c => c.typ_personne === cd_type).length;
  }

  getTypPersonneLibelle(cd_type?: string): string {
    if (!cd_type) return 'Non renseigné';
    return this.formService.getLibelleFromCd(cd_type, this.typPersonnes) || cd_type;
  }

  openDialog(contact?: AnnuaireLite): void {
    const dialogRef = this.dialog.open(AnnuaireFicheComponent, {
      data: { uuid_ann: contact?.uuid_ann },
      minWidth: '50vw',
      maxWidth: '95vw',
      height: '70vh',
      maxHeight: '90vh',
      hasBackdrop: true,
      backdropClass: 'custom-backdrop-administratif',
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });

    dialogRef.afterClosed().subscribe(() => {
      this.fetchContacts();
    });
  }
}
