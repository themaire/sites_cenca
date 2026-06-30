import { Component, Input, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';

import { CustomMatPaginatorIntl } from '../../../../shared/costomMaterial/custom-matpaginator-intl';
import { ListReleve } from '../../../interfaces/releve';

@Component({
  selector: 'app-site-releves',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule],
  templateUrl: './site-releves.component.html',
  styleUrl: './site-releves.component.scss',
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }],
})
export class SiteRelevesComponent implements AfterViewInit {
  private _releves: ListReleve[] = [];

  @Input() set releves(val: ListReleve[]) {
    this._releves = val;
    this.dataSource.data = val;
  }

  dataSource = new MatTableDataSource<ListReleve>();
  displayedColumns = ['date_releve', 'orga', 'nbesp', 'nbobs'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private router: Router) {}

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onRowClick(releve: ListReleve) {
    this.router.navigate(['/chiro/releve', releve.uuid_releve]);
  }
}
