import { Component, OnInit, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  templateUrl: './liste-sites.component.html',
  styleUrl: './liste-sites.component.scss',
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }],
})
export class ListeSitesComponent implements OnInit, AfterViewInit, OnDestroy {
  dataSource = new MatTableDataSource<ListSiteChiro>();
  displayedColumns = ['code', 'nom', 'type_site', 'commune', 'nbrel', 'nbobs', 'zoom'];
  loading = true;

  private map?: L.Map;
  private markersLayer = L.layerGroup();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private chiroService: ChiroService, private router: Router) {}

  ngOnInit() {
    this.chiroService.getSites().then(sites => {
      this.dataSource.data = sites;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.loading = false;
      this.updateMap(sites);
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) =>
      (item as any)[property] ?? '';
    // Délai pour que le DOM soit rendu avant l'init Leaflet
    setTimeout(() => this.initMap(), 50);
  }

  private initMap() {
    this.map = L.map('chiro-sites-map', { center: [48.8, 4.5], zoom: 8 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);
    this.markersLayer.addTo(this.map);
  }

  updateMap(sites: ListSiteChiro[]) {
    this.markersLayer.clearLayers();

    const bounds: L.LatLng[] = [];

    sites.forEach(s => {
      if (!s.wgs84_x || !s.wgs84_y) return;
      const latlng = L.latLng(s.wgs84_y, s.wgs84_x);
      bounds.push(latlng);
      const label = `${s.code} - ${s.nom}`;
      L.circleMarker(latlng, {
        radius: 6, color: '#1a6e3c', fillColor: '#2e7d32', fillOpacity: 0.8, weight: 1,
      })
        .bindTooltip(label, { direction: 'top', sticky: false })
        .bindPopup(
          `<strong>${s.nom}</strong><br>Code : ${s.code}<br>` +
          `${s.nbrel ?? 0} relevé(s) — ${s.nbobs ?? 0} individu(s)`
        )
        .on('click', () => this.router.navigate(['/chiro/site', s.id_site]))
        .addTo(this.markersLayer);
    });

    if (this.map && bounds.length) {
      this.map.fitBounds(L.latLngBounds(bounds), { padding: [20, 20] });
    }
  }

  applyFilter(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.dataSource.filter = val.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
    this.updateMap(this.dataSource.filteredData);
  }

  zoomToSite(event: Event, site: ListSiteChiro) {
    event.stopPropagation();
    if (!this.map || !site.wgs84_x || !site.wgs84_y) return;
    this.map.flyTo([site.wgs84_y, site.wgs84_x], 15, { animate: true, duration: 0.8 });
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
