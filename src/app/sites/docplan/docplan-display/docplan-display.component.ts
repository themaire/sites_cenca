import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params } from '@angular/router';

import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { CustomMatPaginatorIntl } from '../../../shared/costomMaterial/custom-matpaginator-intl';

import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { DocPlanListe } from '../docplan';
import { DocplanService } from '../docplan.service';
import { DocPlanFicheComponent } from '../../site-detail/detail-gestion/docplan-fiche/docplan-fiche.component';

@Component({
  selector: 'app-docplan-display',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatPaginatorModule,
    MatDialogModule,
  ],
  templateUrl: './docplan-display.component.html',
  styleUrl: './docplan-display.component.scss',
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }],
})
export class DocplanDisplayComponent {
  public docplans: DocPlanListe[] = [];
  selectedDocplan?: DocPlanListe;
  public isLoading: boolean = false;
  public loadError: string | null = null;

  public dataSource!: MatTableDataSource<DocPlanListe>;
  public displayedColumns: string[] = [
    'document',
    'code_site',
    'annee_deb',
    'annee_fin',
    'docactuel',
    'typ_document',
    'surface',
  ];

  private _paginator!: MatPaginator;
  private _sort!: MatSort;

  @ViewChild(MatPaginator) set paginator(p: MatPaginator) {
    this._paginator = p;
    if (this.dataSource) this.dataSource.paginator = p;
  }

  @ViewChild(MatSort) set sort(s: MatSort) {
    this._sort = s;
    if (this.dataSource) this.dataSource.sort = s;
  }

  private research: DocplanService = inject(DocplanService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private dialog: MatDialog = inject(MatDialog);

  private loadDocplans(params: Params): void {
    const subroute =
      'pgestion/criteria/' +
      params['annee_deb'] +
      '/' +
      params['localisation'] +
      '/' +
      params['typ_document'] +
      '/' +
      params['actuel'];

    this.isLoading = true;
    this.loadError = null;

    this.research.getDocplans(subroute)
      .then((docplansGuetted: DocPlanListe[]) => {
        this.docplans = docplansGuetted;
        this.dataSource = new MatTableDataSource(this.docplans);
        this.dataSource.paginator = this._paginator;
        this.dataSource.sort = this._sort;
      })
      .catch((err) => {
        console.error('Erreur chargement pgestion/criteria', err);
        this.loadError = `Impossible de charger les documents (${subroute})`;
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      this.loadDocplans(params);
    });
  }

  applyFilter(event: Event) {
    if (!this.dataSource) return;
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onSelect(docplan: DocPlanListe): void {
    if (docplan.uuid_doc) {
      this.openDialog(docplan);
    } else {
      console.log('Pas de uuid_doc pour ouvrir le document : ', docplan);
    }
  }

  openDialog(docplan: DocPlanListe): void {
    const dialogRef = this.dialog.open(DocPlanFicheComponent, {
      data: { uuid_doc: docplan.uuid_doc, uuid_site: '' },
      minWidth: '50vw',
      maxWidth: '95vw',
      height: '70vh',
      maxHeight: '90vh',
      hasBackdrop: true,
      backdropClass: 'custom-backdrop-gerer',
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
    });

    dialogRef.afterClosed().subscribe(() => {
      this.route.params.subscribe((params: Params) => {
        this.loadDocplans(params);
      });
    });
  }
}
