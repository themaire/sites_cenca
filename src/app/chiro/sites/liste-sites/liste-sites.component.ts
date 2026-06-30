import { Component, OnInit, AfterViewInit, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import * as L from 'leaflet';
import { CustomMatPaginatorIntl } from '../../../shared/costomMaterial/custom-matpaginator-intl';
import { ChiroService } from '../../services/chiro.service';
import { ListSiteChiro } from '../../interfaces/site-chiro';

@Component({
  selector: 'app-liste-sites-chiro',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './liste-sites.component.html',
  styleUrl: './liste-sites.component.scss',
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }],
})
export class ListeSitesComponent implements OnInit, AfterViewInit, OnDestroy {
  dataSource = new MatTableDataSource<ListSiteChiro>();
  displayedColumns = ['code', 'nom', 'type_site', 'commune', 'nbrel', 'nbobs'];
  loading = false;

  private map?: L.Map;
  private markersLayer?: L.GeoJSON;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private chiroService: ChiroService, private router: Router) {}

  ngOnInit() {
    this.loading = true;
    this.chiroService.getSites().then(sites => {
      this.dataSource.data = sites;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.loading = false;
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    setTimeout(() => this.initMap(), 0);
  }

  private initMap() {
    this.map = L.map('chiro-sites-map', { center: [48.8, 4.5], zoom: 8 });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.chiroService.getSitesGeoJSON().then(geojson => {
      if (!geojson?.features?.length) return;

      this.markersLayer = L.geoJSON(geojson, {
        pointToLayer: (_, latlng) => L.circleMarker(latlng, {
          radius: 6, color: '#1a6e3c', fillColor: '#2e7d32', fillOpacity: 0.8, weight: 1,
        }),
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          layer.bindPopup(
            `<strong>${p.nom}</strong><br>Code : ${p.code}<br>` +
            `${p.nbrel ?? 0} relevé(s) — ${p.nbobs ?? 0} observation(s)` +
            `<br><a href="/chiro/site/${p.id_site}" style="color:#2e7d32">Voir la fiche</a>`
          );
          layer.on('click', () => this.router.navigate(['/chiro/site', p.id_site]));
        },
      }).addTo(this.map!);

      this.map!.fitBounds(this.markersLayer.getBounds(), { padding: [20, 20] });
    });
  }

  applyFilter(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.dataSource.filter = val.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  onRowClick(site: ListSiteChiro) {
    this.router.navigate(['/chiro/site', site.id_site]);
  }

  retour() {
    this.router.navigate(['/chiro']);
  }

  ngOnDestroy() {
    this.map?.remove();
  }
}
