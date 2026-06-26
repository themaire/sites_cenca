import { Component, Input, inject, SimpleChanges, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DetailSite } from '../../site-detail';
import { DocPlan } from './docplan';
import { SitesService } from '../../sites.service';
import { DocPlanFicheComponent } from './docplan-fiche/docplan-fiche.component';
import { WipComponent } from '../../../wip/wip.component';
import { environment } from '../../../../environments/environment';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-detail-gestion',
  standalone: true,
  imports: [
    CommonModule,
    WipComponent,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './detail-gestion.component.html',
  styleUrls: ['./detail-gestion.component.scss']
})
export class DetailGestionComponent {
  cacheMisere = environment.cache_misere;

  @Input() inputDetail?: DetailSite;
  @Input() inputUUIDsite?: String;

  private _sort!: MatSort;
  @ViewChild(MatSort) set sort(s: MatSort) {
    this._sort = s;
    if (this.dataSource) this.dataSource.sort = s;
  }

  public docPlan: DocPlan[] = [];
  public dataSource!: MatTableDataSource<DocPlan>;
  public displayedColumns: string[] = ['document', 'annee_deb', 'annee_fin', 'actuel', 'pdf'];

  research: SitesService = inject(SitesService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  constructor(
    private dialog: MatDialog,
  ) {}

  get uuid_site(): string | undefined {
    return (this.inputDetail?.uuid_site || this.inputUUIDsite) as string | undefined;
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (this.inputDetail !== undefined) {
      console.log("Onglet GESTION — ngOnChanges. UUID site :", this.inputDetail.uuid_site);
      await this.fetchDocPlan(`pgestion/uuid=${this.inputDetail.uuid_site}`);
    }
  }

  async ngOnInit() {
    if (this.inputUUIDsite !== undefined) {
      await this.fetchDocPlan(`pgestion/uuid=${this.inputUUIDsite}`);
    }
  }

  private async fetchDocPlan(subroute: string) {
    try {
      this.docPlan = await this.research.getDocPlan(subroute);
      this.dataSource = new MatTableDataSource(this.docPlan);
      this.dataSource.sort = this._sort;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Erreur lors du chargement des documents planificateurs', error);
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openDialog(doc?: DocPlan): void {
    const uuid_site = this.uuid_site;
    if (!uuid_site) return;

    const dialogRef = this.dialog.open(DocPlanFicheComponent, {
      data: { uuid_doc: doc?.uuid_doc, uuid_site },
      minWidth: '50vw',
      maxWidth: '95vw',
      height: '70vh',
      maxHeight: '80vh',
      hasBackdrop: true,
      backdropClass: 'custom-backdrop-gerer',
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
    });

    dialogRef.afterClosed().subscribe(() => {
      this.ngOnChanges({});
    });
  }
}
