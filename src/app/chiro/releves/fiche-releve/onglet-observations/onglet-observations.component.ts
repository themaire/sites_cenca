import { Component, Input, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

import { CustomMatPaginatorIntl } from '../../../../shared/costomMaterial/custom-matpaginator-intl';
import { ObservationDetail } from '../../../interfaces/observation';

@Component({
  selector: 'app-onglet-observations',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatIconModule, MatTooltipModule, MatBadgeModule,
  ],
  templateUrl: './onglet-observations.component.html',
  styleUrl: './onglet-observations.component.scss',
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }],
})
export class OngletObservationsComponent implements AfterViewInit {
  private _observations: ObservationDetail[] = [];

  @Input() set observations(val: ObservationDetail[]) {
    this._observations = val;
    this.dataSource.data = val;
  }

  dataSource = new MatTableDataSource<ObservationDetail>();
  displayedColumns = ['espece', 'nombre', 'denombrement', 'methode', 'statut_bio', 'stade', 'sexe', 'etat_bio', 'extras'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
