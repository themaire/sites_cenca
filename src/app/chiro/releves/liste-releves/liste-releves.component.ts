import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';

import { CustomMatPaginatorIntl } from '../../../shared/costomMaterial/custom-matpaginator-intl';
import { ChiroService, FiltresReleves, Commune, Espece } from '../../services/chiro.service';
import { ListReleve } from '../../interfaces/releve';

@Component({
  selector: 'app-liste-releves',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    FormsModule,
  ],
  templateUrl: './liste-releves.component.html',
  styleUrl: './liste-releves.component.scss',
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }],
})
export class ListeRelevesComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<ListReleve>();
  displayedColumns = ['commune', 'nom_site', 'date_releve', 'orga', 'nbesp', 'nbobs'];

  communes: Commune[] = [];
  especes: Espece[] = [];

  filtreCommune: string | null = null;
  filtreEspece: string | null = null;
  filtreAnnee: string = '';

  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private chiroService: ChiroService, private router: Router) {}

  ngOnInit() {
    this.chiroService.getCommunes().then(c => this.communes = c);
    this.chiroService.getEspeces().then(e => this.especes = e);
    this.chargerReleves();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  chargerReleves() {
    this.loading = true;
    const filtres: FiltresReleves = {};
    if (this.filtreCommune) filtres.commune = this.filtreCommune;
    if (this.filtreEspece) filtres.espece = this.filtreEspece;
    if (this.filtreAnnee) filtres.annee = this.filtreAnnee;

    this.chiroService.getReleves(filtres).then(releves => {
      this.dataSource.data = releves;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.loading = false;
    });
  }

  applyTextFilter(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.dataSource.filter = val.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  onRowClick(releve: ListReleve) {
    this.router.navigate(['/chiro/releve', releve.uuid_releve]);
  }

  retour() {
    this.router.navigate(['/chiro']);
  }
}
