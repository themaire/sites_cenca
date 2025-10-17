import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteCencaService } from '../shared/services/site-cenca.service';
import { SiteCencaCollection, SiteCencaFeature } from '../shared/interfaces/site-geojson';
import { MapComponent } from '../map/map.component';

@Component({
  selector: 'app-exemple-sites-cenca',
  standalone: true,
  imports: [CommonModule, MapComponent],
  template: `
    <div class="container">
      <h2>Exemple d'utilisation des sites CENCA</h2>
      
      <div class="controls">
        <button (click)="chargerSitesCenca()">Charger les sites CENCA</button>
        <button (click)="filtrerZonesHumides()" [disabled]="!sitesCenca">
          Filtrer zones humides ({{ nombreZonesHumides }})
        </button>
        <button (click)="afficherTousSites()" [disabled]="!sitesCenca">
          Afficher tous les sites ({{ nombreTotalSites }})
        </button>
      </div>

      <div class="stats" *ngIf="sitesCenca">
        <h3>Statistiques</h3>
        <p><strong>Total sites :</strong> {{ nombreTotalSites }}</p>
        <p><strong>Zones humides :</strong> {{ nombreZonesHumides }}</p>
        <p><strong>Surface totale :</strong> {{ surfaceTotale }} ha</p>
        
        <h4>Référents</h4>
        <ul>
          <li *ngFor="let referent of referentsUniques">{{ referent }}</li>
        </ul>

        <h4>Types de gestion</h4>
        <ul>
          <li *ngFor="let gestion of typesGestion">
            {{ gestion.type }} : {{ gestion.nombre }} sites
          </li>
        </ul>
      </div>

      <div class="carte" *ngIf="sitesAffichage">
        <h3>Carte des sites</h3>
        <app-map 
          [mapName]="'exemple-cenca'"
          [sitesCenca]="sitesAffichage">
        </app-map>
      </div>

      <!-- Exemple de données GeoJSON statiques pour test -->
      <div class="test-data">
        <h3>Test avec données statiques</h3>
        <button (click)="testerDonneesStatiques()">Tester avec GeoJSON exemple</button>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }
    
    .controls {
      margin: 20px 0;
    }
    
    .controls button {
      margin-right: 10px;
      padding: 8px 16px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .controls button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    
    .stats {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    
    .carte {
      margin: 20px 0;
      height: 500px;
    }
    
    app-map {
      display: block;
      height: 400px;
      width: 100%;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .test-data {
      background-color: #fff3cd;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
  `]
})
export class ExempleSitesCencaComponent implements OnInit {
  sitesCenca?: SiteCencaCollection;
  sitesAffichage?: SiteCencaCollection;
  
  nombreTotalSites = 0;
  nombreZonesHumides = 0;
  surfaceTotale = 0;
  referentsUniques: string[] = [];
  typesGestion: { type: string; nombre: number }[] = [];

  constructor(private siteCencaService: SiteCencaService) {}

  ngOnInit() {
    console.log('Composant exemple sites CENCA initialisé');
  }

  chargerSitesCenca() {
    console.log('Chargement des sites CENCA...');
    
    this.siteCencaService.getSitesCenca$().subscribe({
      next: (sites) => {
        this.sitesCenca = sites;
        this.sitesAffichage = sites;
        this.calculerStatistiques();
        console.log('Sites CENCA chargés:', sites);
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
        // En cas d'erreur, utiliser les données de test
        this.testerDonneesStatiques();
      }
    });
  }

  filtrerZonesHumides() {
    if (!this.sitesCenca) return;
    
    const sitesZonesHumides = this.siteCencaService.filterSitesZonesHumides(this.sitesCenca);
    this.sitesAffichage = {
      ...this.sitesCenca,
      features: sitesZonesHumides
    };
    
    console.log('Sites zones humides filtrés:', sitesZonesHumides.length);
  }

  afficherTousSites() {
    this.sitesAffichage = this.sitesCenca;
  }

  private calculerStatistiques() {
    if (!this.sitesCenca) return;

    this.nombreTotalSites = this.sitesCenca.features.length;
    this.nombreZonesHumides = this.siteCencaService.filterSitesZonesHumides(this.sitesCenca).length;
    this.surfaceTotale = this.siteCencaService.calculateTotalSurface(this.sitesCenca);
    this.referentsUniques = this.siteCencaService.getUniqueReferents(this.sitesCenca);
    
    const groupesGestion = this.siteCencaService.groupSitesByGestion(this.sitesCenca);
    this.typesGestion = Object.entries(groupesGestion).map(([type, sites]) => ({
      type,
      nombre: sites.length
    }));
  }

  testerDonneesStatiques() {
    // Créer des données de test basées sur l'exemple fourni
    const donneesTest: SiteCencaCollection = {
      type: 'FeatureCollection' as const,
      bbox: [3.7364929, 47.66413335, 5.73925682, 50.14240508],
      features: [
        {
          type: 'Feature' as const,
          id: 'cenca_autres.01FC740E-BD03-404B-B5FD-7646A56AD0FE',
          bbox: [4.583497, 48.032791, 4.586285, 48.037153],
          geometry: {
            type: 'MultiPolygon' as const,
            coordinates: [[[[4.586023,48.032793],[4.585785,48.032791],[4.585574,48.034552],[4.584477,48.035456],[4.583497,48.036281],[4.583555,48.036321],[4.584403,48.036914],[4.584458,48.036952],[4.584486,48.036973],[4.5844,48.037025],[4.584568,48.037153],[4.584646,48.037097],[4.58502,48.036843],[4.585229,48.036669],[4.585488,48.03639],[4.585591,48.036258],[4.585769,48.035821],[4.585908,48.035357],[4.585955,48.035169],[4.586092,48.034592],[4.586285,48.033918],[4.586116,48.033091],[4.586023,48.032793]]]]
          },
          properties: {
            bassinagence: 'Agence de l\'Eau Seine Normandie',
            carto: 0,
            codegeol: null,
            codesite: '10VERP01',
            detail: 'Site entier',
            gestion: '2',
            gestiontxt: 'Assistance technique',
            idsite: '01FC740E-BD03-404B-B5FD-7646A56AD0FE',
            localisant: '10VERP01 - Marais de Trouche-Boeuf',
            milieunat: 'Tourbières et marais',
            nomsite: 'Marais de Trouche-Boeuf',
            premiercontrat: 2009,
            referent: 'Yohann Brouillard',
            rgpt: null,
            surface: 12.5,
            type: 'Autre espace d\'intérêt écologique',
            zonehumide: 'oui'
          }
        }
      ]
    };

    console.log('Test avec données statiques');
    this.sitesCenca = donneesTest;
    this.sitesAffichage = donneesTest;
    this.calculerStatistiques();
  }
}