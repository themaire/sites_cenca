import { Component, Input, Output, EventEmitter, ElementRef, AfterViewInit, OnDestroy, Renderer2 } from '@angular/core';
import { environment } from '../../environments/environment';

import * as L from 'leaflet'; // Import de Leaflet
import * as turf from '@turf/turf'; // Import de Turf.js pour les opérations géospatiales comme calcule de surfaces
import 'leaflet.fullscreen'; // Import du plugin Fullscreen
import { GeoJsonObject, Feature, MultiPolygon } from 'geojson'; // Import de GeoJsonObject et Feature

import { Localisation } from '../shared/interfaces/localisation'; // Import de l'interface Localisation
import { SiteCencaCollection, SiteCencaFeature } from '../shared/interfaces/site-geojson'; // Import des interfaces pour les sites CENCA
import { SiteCencaService } from '../shared/services/site-cenca.service'; // Import du service

import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError } from 'rxjs';

// Étendre l'interface MapOptions pour inclure fullscreenControl
declare module 'leaflet' {
  interface MapOptions {
    fullscreenControl?: boolean;
    fullscreenControlOptions?: {
      position?: string;
    };
  }
}



@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @Input() mapName?: string;
  @Input() localisation_site?: Localisation;
  @Input() localisation_projet?: Localisation;
  @Input() localisations_operations?: Localisation[];
  @Input() sitesCenca?: SiteCencaCollection; // Collection de sites CENCA à afficher
  @Input() chargerSitesDynamiquement: boolean = false; // Active le chargement dynamique des sites CENCA
  @Input() chargerSitesSitesDynamiquement: boolean = false; // Active le chargement dynamique de la couche cenca_sites
  @Input() chargerParcellesDynamiquement: boolean = false; // Active le chargement dynamique des parcelles cadastrales
  @Input() coucheSitesCenca: string = 'cenca_autres'; // Nom de la couche à charger

  // Événements pour synchroniser avec le composant parent
  @Output() sitesCencaToggled = new EventEmitter<boolean>();
  @Output() sitesCencaSitesToggled = new EventEmitter<boolean>();
  @Output() parcellesToggled = new EventEmitter<boolean>();

  lastColorIndex = -1;
  usedColors: number[] = [];

  // Propriétés pour le chargement dynamique des sites CENCA (cenca_autres)
  private sitesCencaLayer?: L.LayerGroup;
  private isLoadingSites = false;
  private lastBbox?: string;
  private loadingTimeout?: any;

  // Propriétés pour le chargement dynamique des sites CENCA Sites (cenca_sites)
  private sitesCencaSitesLayer?: L.LayerGroup;
  private isLoadingSitesSites = false;
  private lastBboxSites?: string;
  private loadingTimeoutSites?: any;

  // Propriétés pour le chargement dynamique des parcelles cadastrales
  private parcellesLayer?: L.LayerGroup;
  private isLoadingParcelles = false;
  private lastBboxParcelles?: string;
  private loadingTimeoutParcelles?: any;
  private minZoomParcelles = 15; // Zoom minimum pour afficher les parcelles (équivaut environ au 1:2000ème)

  private activeUrl: string = environment.apiBaseUrl;
  apiWFSLizmapUrl(couche: string, bbox: string): string {
    return this.activeUrl + 'api-geo/lizmap/layer/' + couche + '?bbox=' + bbox;
  }
  apiGeoParcellesUrl(bbox: string): string {
    return this.activeUrl + 'api-geo/parcelles/bbox?bbox=' + bbox;
  }  
  private map!: L.Map;

  constructor(private elementRef: ElementRef, 
            private renderer: Renderer2,
            private http: HttpClient,
            private siteCencaService: SiteCencaService
          ) {}

  ngAfterViewInit() {
    setTimeout(() => {
      console.log('Initialisation de la carte :', this.mapName);
      this.initMap();
    });
  }

  ngOnDestroy() {
    // Nettoyage des timeouts
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
    if (this.loadingTimeoutSites) {
      clearTimeout(this.loadingTimeoutSites);
    }
    if (this.loadingTimeoutParcelles) {
      clearTimeout(this.loadingTimeoutParcelles);
    }
    
    // Nettoyage de la carte
    if (this.map) {
      this.map.remove();
    }
  }

  /**
   * Active ou désactive le chargement dynamique des sites CENCA
   * Peut être appelé depuis l'extérieur du composant
   */
  toggleDynamicSitesLoading(enable: boolean): void {
    if (enable && !this.chargerSitesDynamiquement) {
      this.chargerSitesDynamiquement = true;
      if (this.map) {
        this.setupDynamicSitesLoading();
      }
    } else if (!enable && this.chargerSitesDynamiquement) {
      this.chargerSitesDynamiquement = false;
      if (this.sitesCencaLayer) {
        this.sitesCencaLayer.clearLayers();
        this.map.removeLayer(this.sitesCencaLayer);
      }
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
      }
    }
  }

  /**
   * Force le rechargement des sites dans la vue actuelle
   */
  reloadSitesInCurrentView(): void {
    this.lastBbox = undefined; // Reset pour forcer le rechargement
    this.loadSitesInCurrentView();
  }

  /**
   * Active ou désactive le chargement dynamique des sites CENCA Sites (couche verte)
   */
  toggleDynamicSitesSitesLoading(enable: boolean): void {
    if (enable && !this.chargerSitesSitesDynamiquement) {
      this.chargerSitesSitesDynamiquement = true;
      if (this.map) {
        this.setupDynamicSitesSitesLoading();
      }
    } else if (!enable && this.chargerSitesSitesDynamiquement) {
      this.chargerSitesSitesDynamiquement = false;
      if (this.sitesCencaSitesLayer) {
        this.sitesCencaSitesLayer.clearLayers();
        this.map.removeLayer(this.sitesCencaSitesLayer);
      }
      if (this.loadingTimeoutSites) {
        clearTimeout(this.loadingTimeoutSites);
      }
    }
  }

  /**
   * Force le rechargement des sites CENCA Sites dans la vue actuelle
   */
  reloadSitesSitesInCurrentView(): void {
    this.lastBboxSites = undefined; // Reset pour forcer le rechargement
    this.loadSitesSitesInCurrentView();
  }

  /**
   * Active ou désactive le chargement dynamique des parcelles cadastrales
   */
  toggleDynamicParcellesLoading(enable: boolean): void {
    if (enable && !this.chargerParcellesDynamiquement) {
      this.chargerParcellesDynamiquement = true;
      if (this.map) {
        this.setupDynamicParcellesLoading();
      }
    } else if (!enable && this.chargerParcellesDynamiquement) {
      this.chargerParcellesDynamiquement = false;
      if (this.parcellesLayer) {
        this.parcellesLayer.clearLayers();
        this.map.removeLayer(this.parcellesLayer);
      }
      if (this.loadingTimeoutParcelles) {
        clearTimeout(this.loadingTimeoutParcelles);
      }
    }
  }

  /**
   * Force le rechargement des parcelles dans la vue actuelle
   */
  reloadParcellesInCurrentView(): void {
    this.lastBboxParcelles = undefined; // Reset pour forcer le rechargement
    this.loadParcellesInCurrentView();
  }

  private initMap(): void {
    // S'assurer que la carte n'existe pas déjà
    if (this.map) {
      this.map.remove();
    }

    // Initialisation de la carte avec le contrôle plein écran
    this.map = L.map('map', {
      fullscreenControl: true, // Activer le contrôle plein écran
      fullscreenControlOptions: {
        position: 'topleft', // Position du bouton plein écran
      },
    });

    // Gestionnaire d'événements pour capturer les erreurs de tuiles
    this.map.on('tileerror', (error) => {
      console.error('Erreur de chargement de la tuile :', error);
    });

    // Personnalisation de l'icône de marqueur avec les chemins d'icônes personnalisés
    const customIconMarkers = L.icon({
      iconUrl: 'assets/images/leaflet/marker-icon.png', // Chemin vers l'icône dans assets
      iconRetinaUrl: 'assets/images/leaflet/marker-icon-2x.png', // Chemin vers l'icône dans assets
      shadowUrl: 'assets/images/leaflet/marker-shadow.png', // Chemin vers l'ombre dans assets
      iconSize: [25, 41], // Taille de l'icône
      iconAnchor: [12, 41], // Point où l'icône est ancrée
      shadowSize: [41, 41], // Taille de l'ombre
      popupAnchor: [1, -34], // Point où la popup est ancrée
    });

    // Définition des fonds de plan (OpenStreetMap, Google Satellite et MNT LIDAR IGN)
    const openStreetMap = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }
    );

    const googleSatellite = L.tileLayer(
      'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      {
        attribution:
          '&copy; <a href="https://www.google.com/intl/en/help/terms_maps.html">Google Maps</a>',
        maxZoom: 20,
      }
    );

    // Ajout de la couche OrthoPhoto IGN via le service WMTS
    const ignOrthoPhoto = L.tileLayer(
      "https://data.geopf.fr/wmts?" +
      "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
      "&STYLE=normal" +
      "&TILEMATRIXSET=PM" +
      "&FORMAT=image/jpeg" +
      "&LAYER=HR.ORTHOIMAGERY.ORTHOPHOTOS" +
      "&TILEMATRIX={z}" +
      "&TILEROW={y}" +
      "&TILECOL={x}",
      {
        minZoom: 0,
        maxZoom: 19,
        attribution: "IGN-F/Geoportail",
        tileSize: 256, // Les tuiles du Géoportail font 200x200px
      }
    );

    // Ajout du MNT LIDAR de l'IGN via le service WMTS
    const ignLidarMNT = L.tileLayer(
      "https://data.geopf.fr/wmts?" +
      "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
      "&STYLE=normal" + // STYLE défini dans GetCapabilities
      "&TILEMATRIXSET=PM_0_18" + // TILEMATRIXSET défini dans GetCapabilities
      "&FORMAT=image/png" + // FORMAT défini dans GetCapabilities
      "&LAYER=IGNF_LIDAR-HD_MNT_ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW" + // LAYER défini dans GetCapabilities
      "&TILEMATRIX={z}" +
      "&TILEROW={y}" +
      "&TILECOL={x}",
      {
        minZoom: 0,
        maxZoom: 19, // Ajusté en fonction des niveaux de zoom disponibles pour la couche
        attribution: "IGN-F/Geoportail",
        tileSize: 256, // Taille des tuiles corrigée à 256 (par défaut pour Leaflet)
      }
    );

    // Ajout du MNS LIDAR de l'IGN via le service WMTS
    const ignLidarMNS = L.tileLayer(
      "https://data.geopf.fr/wmts?" +
      "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
      "&STYLE=normal" + // STYLE défini dans GetCapabilities
      "&TILEMATRIXSET=PM" + // TILEMATRIXSET défini dans GetCapabilities
      "&FORMAT=image/png" + // FORMAT défini dans GetCapabilities
      "&LAYER=IGNF_LIDAR-HD_MNS_ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW" + // LAYER défini dans GetCapabilities
      "&TILEMATRIX={z}" +
      "&TILEROW={y}" +
      "&TILECOL={x}",
      {
        minZoom: 0,
        maxZoom: 19, // Ajusté en fonction des niveaux de zoom disponibles pour la couche
        attribution: "IGN-F/Geoportail",
        tileSize: 256, // Taille des tuiles corrigée à 256 (par défaut pour Leaflet)
      }
    );

    const satellite ={
      'IGN OrthoPhoto': ignOrthoPhoto,
      'Google Satellite': googleSatellite,
    };

    // Ajoute ignOrthoPhoto par défaut
    ignOrthoPhoto.addTo(this.map);

    // Sélecteur de couches avec différentes options de fonds de plan
    const baseMaps = {
      
      'OpenStreetMap': openStreetMap,
      'IGN LIDAR MNT': ignLidarMNT, // Ajout de la couche MNT LIDAR
      'IGN LIDAR MNS': ignLidarMNS, // Ajout de la couche MNS LIDAR
      
    };

    // Initialiser les couches CENCA (vides au départ)
    this.sitesCencaLayer = L.layerGroup();
    this.sitesCencaSitesLayer = L.layerGroup();
    this.parcellesLayer = L.layerGroup();

    // Couches superposables (overlays) - données métier
    const overlayMaps = {
      '🌿 Sites CENCA Autres': this.sitesCencaLayer,
      '🟢 Sites CENCA Sites': this.sitesCencaSitesLayer,
      '🗺️ Parcelles Cadastrales': this.parcellesLayer
    };

    // Fonds de plan de base
    const allBaseMaps = {
      ...satellite,
      ...baseMaps
    };

    // Ajout du sélecteur de couches avec overlays
    L.control.layers(allBaseMaps, overlayMaps).addTo(this.map);

    // Gestionnaires d'événements pour les overlays du layer control
    this.map.on('overlayadd', (e: any) => {
      console.log('🔵 Couche activée via layer control:', e.name);
      if (e.name === '🌿 Sites CENCA Autres') {
        this.chargerSitesDynamiquement = true;
        this.setupDynamicSitesLoading();
        // Émettre l'événement vers le composant parent
        this.sitesCencaToggled.emit(true);
      } else if (e.name === '🟢 Sites CENCA Sites') {
        this.chargerSitesSitesDynamiquement = true;
        this.setupDynamicSitesSitesLoading();
        // Émettre l'événement vers le composant parent
        this.sitesCencaSitesToggled.emit(true);
      } else if (e.name === '🗺️ Parcelles Cadastrales') {
        this.chargerParcellesDynamiquement = true;
        this.setupDynamicParcellesLoading();
        // Émettre l'événement vers le composant parent
        this.parcellesToggled.emit(true);
      }
    });

    this.map.on('overlayremove', (e: any) => {
      console.log('🔴 Couche désactivée via layer control:', e.name);
      if (e.name === '🌿 Sites CENCA Autres') {
        this.chargerSitesDynamiquement = false;
        if (this.sitesCencaLayer) {
          this.sitesCencaLayer.clearLayers();
        }
        // Émettre l'événement vers le composant parent
        this.sitesCencaToggled.emit(false);
      } else if (e.name === '🟢 Sites CENCA Sites') {
        this.chargerSitesSitesDynamiquement = false;
        if (this.sitesCencaSitesLayer) {
          this.sitesCencaSitesLayer.clearLayers();
        }
        // Émettre l'événement vers le composant parent
        this.sitesCencaSitesToggled.emit(false);
      } else if (e.name === '🗺️ Parcelles Cadastrales') {
        this.chargerParcellesDynamiquement = false;
        if (this.parcellesLayer) {
          this.parcellesLayer.clearLayers();
        }
        // Émettre l'événement vers le composant parent
        this.parcellesToggled.emit(false);
      }
    });

    // Ajout d'un événement pour détecter l'entrée et la sortie du mode plein écran
    this.map.on('enterFullscreen', () => {
      console.log('Carte en mode plein écran');
    });
    this.map.on('exitFullscreen', () => {
      console.log('Carte sortie du mode plein écran');
    });

    // Activation par défaut des couches CENCA et configuration du chargement dynamique
    this.chargerSitesDynamiquement = true;
    this.chargerSitesSitesDynamiquement = true;
    
    // Ajouter les couches à la carte par défaut
    this.sitesCencaLayer.addTo(this.map);
    this.sitesCencaSitesLayer.addTo(this.map);
    
    // Ajouter la couche parcelles seulement si activée
    if (this.chargerParcellesDynamiquement) {
      this.parcellesLayer.addTo(this.map);
    }

    // Événements pour le chargement dynamique des sites CENCA
    if (this.chargerSitesDynamiquement) {
      this.setupDynamicSitesLoading();
    }

    // Événements pour le chargement dynamique des sites CENCA Sites (verts)
    if (this.chargerSitesSitesDynamiquement) {
      this.setupDynamicSitesSitesLoading();
    }

    // Événements pour le chargement dynamique des parcelles cadastrales
    if (this.chargerParcellesDynamiquement) {
      this.setupDynamicParcellesLoading();
    }

    this.resetMapView();

    // Traitements sur le GeoJSON principal
    if (this.localisation_site !== undefined || this.localisations_operations !== undefined) {
      // S'assure que le GeoJSON primaire est un objet valide
      if (
        this.localisation_site?.geojson &&
        typeof this.localisation_site.geojson === 'object' &&
        'type' in this.localisation_site.geojson &&
        (
          (this.localisation_site.geojson as any).geometry?.coordinates ||
          (this.localisation_site.geojson as any).coordinates // selon le type
        )
      ) {
        console.log('Localisation du site trouvée :', this.localisation_site);
        // Transformation de l'objet GeoJSON en couche Leaflet      
        const geojsonLayer = L.geoJSON(this.localisation_site.geojson);
        geojsonLayer.setStyle({
          color: 'green',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.5,
          fillColor: 'green',
        }).addTo(this.map);
        
        // Obtenir les limites et ajuster la vue
        const bounds = geojsonLayer.getBounds();
        // Ajoute un petit délai pour laisser la carte s'afficher avant d'animer le zoom
        setTimeout(() => {
          this.map.flyToBounds(bounds, { duration: 3.5 }); // durée en secondes
        }, 800); // délai en ms

        // Bouton (contrôle) personnalisé pour recentrer la carte sur l'emprise du site
        const ZoomToGeoJsonControl = L.Control.extend({
          options: {
            position: 'topright', // Position du bouton
          },
          onAdd: () => {
            const button = this.renderer.createElement('button');
            this.renderer.setAttribute(button, 'type', 'button');
            this.renderer.addClass(button, 'leaflet-bar');
            this.renderer.addClass(button, 'leaflet-control');
            this.renderer.addClass(button, 'zoom-to-geojson');
            this.renderer.setStyle(button, 'background-color', 'white');
            this.renderer.setStyle(button, 'cursor', 'pointer');
            this.renderer.setProperty(button, 'innerHTML', '🔍'); // Icône du bouton

            // Ajout du texte au survol (tooltip)
            this.renderer.setAttribute(button, 'title', 'Recentrer la carte sur l\'emprise du site.');

            this.renderer.listen(button, 'click', () => this.zoomToBounds(bounds));
            return button;
          },
        });

        // Ajout du contrôle personnalisé à la carte
        this.map.addControl(new ZoomToGeoJsonControl());
      } else {
        // Sinon on zoom sur la Champagne-Ardenne
        console.log('Aucun GeoJSON de site trouvé');
      }

      // On regarde maintenant si on a des localisations_operations
      if (this.localisations_operations && this.localisations_operations?.length > 0) {
        console.log('Localisations d\'opérations trouvées :', this.localisations_operations.length);
        for (const loc_ope of this.localisations_operations) {
          console.log('Traitement de la localisation d\'opération :', loc_ope);
          const geojson = loc_ope.geojson;
          const geometryType = (loc_ope.geojson as any).geometry?.type || loc_ope.geojson.type;

          console.log('Type de localisation d\'opération :', geometryType);

          // Test de validité du GeoJSON
          if (
            geojson &&
            typeof geojson === 'object' &&
            'type' in geojson &&
            (
              (geojson as any).geometry?.coordinates ||
              (geojson as any).coordinates
            )
          ) {
            if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
              const geojsonLayer = L.geoJSON(geojson, {
                onEachFeature: (feature, layer) => {
                  let surface = 'N/A';
                  surface = (turf.area(feature) / 10000).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' ha';
                  console.log(`Surface calculée pour l'opération : ${surface}`);

                  const bounds = L.geoJSON(feature).getBounds() || null;

                  // console.log(`Bounds de la feature actuelle : ${bounds}`);
                  if (bounds) {
                    // console.log('SouthWest :', bounds.getSouthWest());
                    // console.log('NorthEast :', bounds.getNorthEast());
                    // console.log('Center :', bounds.getCenter());
                    // console.log('toBBoxString :', bounds.toBBoxString());
                    
                    const northLat = bounds.getNorthEast().lat;
                    const southLat = bounds.getSouthWest().lat;
                    const westLng = bounds.getSouthWest().lng;
                    const eastLng = bounds.getNorthEast().lng;
                    const middleLng = (westLng + eastLng) / 2;
                    const targetLat = southLat + 0.9 * (northLat - southLat);
                    
                    // Crée un marker invisible
                    const marker = L.marker([targetLat, middleLng], { opacity: 0 });
                    marker.bindTooltip(
                      `Surface : ${surface}`,
                      { permanent: true, direction: 'top' }
                    ).addTo(this.map);
                  }
                  }
                }); // Fin de la création de geojsonLayer
                const color = this.getRandomColorName();
                geojsonLayer.setStyle({
                  color: color,
                  weight: 2,
                  opacity: 1,
                  fillOpacity: 0.5,
                  fillColor: color,
                }).addTo(this.map);
            } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
              const geojsonLayer = L.geoJSON(geojson, {
                onEachFeature: (feature, layer) => {
                  let length = 'N/A';
                  const lengthMeters = turf.length(feature) * 1000;
                  length = lengthMeters.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' m';
                  console.log(`Longueur calculée pour l'opération : ${length}`);

                  // Affiche le label sur la ligne
                  layer.bindTooltip(
                    `Longueur : ${length}`,
                    { permanent: true, direction: 'center' }
                  );
                  
                }
              }); // Fin de la création de geojsonLayer
              const color = this.getRandomColorName();
              geojsonLayer.setStyle({
                color: color,
                weight: 5,
                opacity: 1,
              }).addTo(this.map);
            } else if (geometryType === 'Point' || geometryType === 'MultiPoint') {
              const geojsonLayer = L.geoJSON(geojson, {
                pointToLayer: (feature, latlng) => {
                  // Pour les points, on utilise un marqueur personnalisé
                  const marker = L.marker(latlng, { icon: customIconMarkers });
                  marker.bindPopup(`Point : ${feature.properties?.name || 'N/A'}`);
                  return marker;
                }
              }).addTo(this.map);
            } else {
              console.warn('Localisation d\'opération invalide ou sans GeoJSON :', loc_ope);
            }
          }
        }
      } else {
        // Sinon on zoom sur la Champagne-Ardenne
        console.log('Aucun GeoJSON d\'opération trouvé');
      }
    } else {
        console.log('Ni d\'emplacement du site ni d\'opérations n\'ont été fournis.');
      }

    // Affichage des sites CENCA si fournis
    if (this.sitesCenca && this.sitesCenca.features.length > 0) {
      console.log('Affichage des sites CENCA:', this.sitesCenca.features.length, 'sites');
      this.addSitesCencaToMap(this.sitesCenca);
    }

    // Ajout d'un marqueur pour illustrer
    L.marker([48.9623054, 4.3562082], { icon: customIconMarkers })
      .addTo(this.map)
      .bindPopup('Châlons-en-Champagne');
    L.marker([49.3978555, 4.7031902], { icon: customIconMarkers })
      .addTo(this.map)
      .bindPopup('Vouziers');
    L.marker([47.786518, 5.0614215], { icon: customIconMarkers })
      .addTo(this.map)
      .bindPopup('Auberive');
    L.marker([48.26754, 4.0759995], { icon: customIconMarkers })
      .addTo(this.map)
      .bindPopup('Rosières-près-Troyes');
    L.marker([50.1368422, 4.8253037], { icon: customIconMarkers })
      .addTo(this.map)
      .bindPopup('Givet');
    L.marker([48.1172003, 5.1431961], { icon: customIconMarkers })
      .addTo(this.map)
      .bindPopup('Chaumont');
  }

  /**
   * Générateur de couleurs CSS variées et contrastées pour couches Leaflet.
   * Retourne un nom de couleur CSS différent à chaque appel, sans répétition immédiate.
   */
  getRandomColorName(): string {
    const COLOR_PALETTE: string[] = [
      'red', 'blue', 'orange', 'purple', 'teal', 'brown', 'magenta',
      'gold', 'navy', 'lime', 'maroon', 'olive', 'aqua', 'fuchsia', 'coral',
      'indigo', 'crimson', 'darkcyan', 'darkorange', 'darkviolet', 'deepskyblue'
    ];
  
    // Si toutes les couleurs ont été utilisées, on recommence
    if (this.usedColors.length === COLOR_PALETTE.length) {
      this.usedColors = [];
    }
    let idx: number;
    do {
      idx = Math.floor(Math.random() * COLOR_PALETTE.length);
    } while (this.usedColors.includes(idx) || idx === this.lastColorIndex);
    this.usedColors.push(idx);
    this.lastColorIndex = idx;
    return COLOR_PALETTE[idx];
  }

  private resetMapView(): void {
    // Réinitialise la vue de la carte sur la Champagne-Ardenne
    this.map.setView([48.9681497, 4.4], 7);
    this.map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        layer.addTo(this.map);
      }
    });
  }

  private zoomToGeoJson(): void {
    if (this.localisation_site && this.localisation_site.geojson) {
      const geojsonLayer = L.geoJSON(this.localisation_site.geojson);
      const bounds = geojsonLayer.getBounds();
      this.map.fitBounds(bounds);
    }
  }

  private zoomToBounds(bounds : any): void {
    if(bounds && bounds.isValid()) {
      this.map.fitBounds(bounds);
    }
  }

  /**
   * Configure le chargement dynamique des sites CENCA
   * Ajoute les événements de carte pour charger les sites selon la vue actuelle
   */
  private setupDynamicSitesLoading(): void {
    console.log('🔄 Configuration du chargement dynamique des sites CENCA');

    // Utiliser la couche déjà créée et l'ajouter à la carte si pas déjà fait
    if (!this.map.hasLayer(this.sitesCencaLayer!)) {
      this.sitesCencaLayer!.addTo(this.map);
    }

    // Événements pour déclencher le rechargement
    this.map.on('moveend', () => this.onMapViewChanged());
    this.map.on('zoomend', () => this.onMapViewChanged());
    
    // Chargement initial après un petit délai
    setTimeout(() => {
      this.onMapViewChanged();
    }, 1000);
  }

  /**
   * Appelée quand la vue de la carte change (zoom, déplacement)
   * Charge les sites CENCA dans la nouvelle emprise
   */
  private onMapViewChanged(): void {
    if (!this.chargerSitesDynamiquement || this.isLoadingSites) {
      return; // Éviter les requêtes si désactivé ou en cours
    }

    console.log('🔄 Vue de la carte changée - rechargement des sites CENCA...');

    // Débounce - attendre 500ms après le dernier mouvement
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }

    this.loadingTimeout = setTimeout(() => {
      this.loadSitesInCurrentView();
    }, 500);
  }

  /**
   * Charge les sites CENCA dans la vue actuelle de la carte
   */
  private loadSitesInCurrentView(): void {
    if (!this.map || this.isLoadingSites || !this.chargerSitesDynamiquement) {
      console.log('🚫 Chargement annulé:', {
        map: !!this.map,
        isLoading: this.isLoadingSites,
        dynamicEnabled: this.chargerSitesDynamiquement
      });
      return;
    }

    const bounds = this.map.getBounds();
    const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;

    // Éviter de recharger la même zone
    if (this.lastBbox === bbox) {
      return;
    }

    console.log('🌍 Chargement des sites CENCA pour la bbox:', bbox);
    this.isLoadingSites = true;
    this.lastBbox = bbox;

    this.siteCencaService.getSitesCenca$(this.coucheSitesCenca, bbox).subscribe({
      next: (sites) => {
        this.updateSitesCencaLayer(sites);
        this.isLoadingSites = false;
        console.log(`✅ ${sites.features.length} sites CENCA chargés`);
      },
      error: (error) => {
        console.error('❌ Erreur chargement sites CENCA:', error);
        this.isLoadingSites = false;
      }
    });
  }

  /**
   * Met à jour la couche des sites CENCA sur la carte
   */
  private updateSitesCencaLayer(sites: SiteCencaCollection): void {
    if (!this.sitesCencaLayer) return;

    // Nettoyer la couche existante
    this.sitesCencaLayer.clearLayers();

    // Ajouter les nouveaux sites
    if (sites.features.length > 0) {
      this.addSitesCencaToLayer(sites);
    }
  }

  /**
   * Ajoute les sites CENCA à la couche dédiée (version optimisée)
   */
  private addSitesCencaToLayer(sitesCollection: SiteCencaCollection): void {
    if (!this.sitesCencaLayer || sitesCollection.features.length === 0) return;

    sitesCollection.features.forEach((feature: SiteCencaFeature) => {
      // Créer la couche GeoJSON pour chaque site
      const siteLayer = L.geoJSON(feature, {
        style: (feature) => {
          return this.getSiteCencaStyle(feature?.properties?.gestion);
        },
        onEachFeature: (feature, layer) => {
          this.addSiteCencaPopupAndTooltip(feature, layer);
        }
      });

      this.sitesCencaLayer!.addLayer(siteLayer);
    });
  }

  /**
   * Retourne le style d'un site CENCA selon son type de gestion
   */
  private getSiteCencaStyle(gestion?: string) {
    let color = 'blue'; // couleur par défaut
    
    switch (gestion) {
      case '1':
        color = 'green'; // Gestion directe
        break;
      case '2':
        color = 'orange'; // Assistance technique
        break;
      case '3':
        color = 'red'; // Autre type
        break;
      default:
        color = 'blue';
    }

    return {
      color: color,
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.3,
      fillColor: color
    };
  }

  /**
   * Ajoute popup et tooltip à un site CENCA
   */
  private addSiteCencaPopupAndTooltip(feature: any, layer: any): void {
    const props = feature.properties;
    
    // Popup détaillé
    const popupContent = `
      <div style="max-width: 300px;">
        <h4 style="margin: 0 0 10px 0; color: #2c3e50;">🌿 ${props.nomsite}</h4>
        <div style="font-size: 13px; line-height: 1.4;">
          <p><strong>Code:</strong> ${props.codesite}</p>
          <p><strong>Type:</strong> ${props.type}</p>
          <p><strong>Gestion:</strong> ${props.gestiontxt}</p>
          <p><strong>Milieu:</strong> ${props.milieunat}</p>
          <p><strong>Référent:</strong> ${props.referent}</p>
          ${props.surface ? `<p><strong>Surface:</strong> ${props.surface} ha</p>` : ''}
          <p><strong>Zone humide:</strong> ${props.zonehumide === 'oui' ? '💧 Oui' : '❌ Non'}</p>
        </div>
      </div>
    `;
    
    layer.bindPopup(popupContent);
    
    // Tooltip avec nom du site
    layer.bindTooltip(`🌿 ${props.nomsite}`, {
      permanent: false,
      direction: 'top',
      offset: [0, -10]
    });
  }

  // ==================== MÉTHODES POUR COUCHE CENCA_SITES (VERTE) ====================

  /**
   * Configure le chargement dynamique des sites CENCA Sites (couche verte)
   */
  private setupDynamicSitesSitesLoading(): void {
    console.log('🟢 Configuration du chargement dynamique des sites CENCA Sites (couche verte)');

    // La couche est déjà créée dans setupLayerControl()
    // Juste s'assurer qu'elle est ajoutée à la carte
    if (this.sitesCencaSitesLayer && !this.map.hasLayer(this.sitesCencaSitesLayer)) {
      this.sitesCencaSitesLayer.addTo(this.map);
    }

    // Événements pour déclencher le rechargement
    this.map.on('moveend', () => this.onMapViewChangedSites());
    this.map.on('zoomend', () => this.onMapViewChangedSites());
    
    // Chargement initial après un petit délai
    setTimeout(() => {
      this.onMapViewChangedSites();
    }, 1000);
  }

  /**
   * Appelée quand la vue de la carte change (zoom, déplacement) pour cenca_sites
   */
  private onMapViewChangedSites(): void {
    if (!this.chargerSitesSitesDynamiquement || this.isLoadingSitesSites) {
      return; // Éviter les requêtes si désactivé ou en cours
    }

    console.log('🟢 Vue de la carte changée - rechargement des sites CENCA Sites...');

    // Débounce - attendre 500ms après le dernier mouvement
    if (this.loadingTimeoutSites) {
      clearTimeout(this.loadingTimeoutSites);
    }

    this.loadingTimeoutSites = setTimeout(() => {
      this.loadSitesSitesInCurrentView();
    }, 500);
  }

  /**
   * Charge les sites CENCA Sites dans la vue actuelle de la carte
   */
  private loadSitesSitesInCurrentView(): void {
    if (!this.map || this.isLoadingSitesSites || !this.chargerSitesSitesDynamiquement) {
      console.log('🚫 Chargement Sites annulé:', {
        map: !!this.map,
        isLoading: this.isLoadingSitesSites,
        dynamicEnabled: this.chargerSitesSitesDynamiquement
      });
      return;
    }

    const bounds = this.map.getBounds();
    const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;

    // Éviter de recharger la même zone
    if (this.lastBboxSites === bbox) {
      return;
    }

    console.log('🟢 Chargement des sites CENCA Sites pour la bbox:', bbox);
    this.isLoadingSitesSites = true;
    this.lastBboxSites = bbox;

    this.siteCencaService.getSitesCenca$('cenca_sites', bbox).subscribe({
      next: (sites) => {
        this.updateSitesCencaSitesLayer(sites);
        this.isLoadingSitesSites = false;
        console.log(`✅ ${sites.features.length} sites CENCA Sites chargés (verts)`);
      },
      error: (error) => {
        console.error('❌ Erreur chargement sites CENCA Sites:', error);
        this.isLoadingSitesSites = false;
      }
    });
  }

  /**
   * Met à jour la couche des sites CENCA Sites sur la carte
   */
  private updateSitesCencaSitesLayer(sites: SiteCencaCollection): void {
    if (!this.sitesCencaSitesLayer) return;

    // Nettoyer la couche existante
    this.sitesCencaSitesLayer.clearLayers();

    // Ajouter les nouveaux sites
    if (sites.features.length > 0) {
      this.addSitesCencaSitesToLayer(sites);
    }
  }

  /**
   * Ajoute les sites CENCA Sites à la couche dédiée (version verte)
   */
  private addSitesCencaSitesToLayer(sitesCollection: SiteCencaCollection): void {
    if (!this.sitesCencaSitesLayer || sitesCollection.features.length === 0) return;

    sitesCollection.features.forEach((feature: SiteCencaFeature) => {
      // Créer la couche GeoJSON pour chaque site
      const siteLayer = L.geoJSON(feature, {
        style: (feature) => {
          return this.getSiteCencaSitesStyle(); // Toujours vert pour cenca_sites
        },
        onEachFeature: (feature, layer) => {
          this.addSiteCencaSitesPopupAndTooltip(feature, layer);
        }
      });

      this.sitesCencaSitesLayer!.addLayer(siteLayer);
    });
  }

  /**
   * Retourne le style vert pour les sites CENCA Sites
   */
  private getSiteCencaSitesStyle() {
    return {
      color: '#28a745', // Vert Bootstrap
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.4,
      fillColor: '#28a745'
    };
  }

  /**
   * Ajoute popup et tooltip à un site CENCA Sites (version verte)
   */
  private addSiteCencaSitesPopupAndTooltip(feature: any, layer: any): void {
    const props = feature.properties;
    
    // Popup détaillé
    const popupContent = `
      <div style="max-width: 300px;">
        <h4 style="margin: 0 0 10px 0; color: #28a745;">🟢 ${props.nomsite}</h4>
        <div style="font-size: 13px; line-height: 1.4;">
          <p><strong>Code:</strong> ${props.codesite}</p>
          <p><strong>Type:</strong> ${props.type}</p>
          <p><strong>Gestion:</strong> ${props.gestiontxt}</p>
          <p><strong>Milieu:</strong> ${props.milieunat}</p>
          <p><strong>Référent:</strong> ${props.referent}</p>
          ${props.surface ? `<p><strong>Surface:</strong> ${props.surface} ha</p>` : ''}
          <p><strong>Zone humide:</strong> ${props.zonehumide === 'oui' ? '💧 Oui' : '❌ Non'}</p>
          <p style="color: #28a745; font-style: italic; margin-top: 10px;">📍 Couche Sites CENCA</p>
        </div>
      </div>
    `;
    
    layer.bindPopup(popupContent);
    
    // Tooltip avec nom du site
    layer.bindTooltip(`🟢 ${props.nomsite}`, {
      permanent: false,
      direction: 'top',
      offset: [0, -10]
    });
  }

  // ==================== FIN MÉTHODES CENCA_SITES ====================

  // ==================== MÉTHODES POUR PARCELLES CADASTRALES ====================

  /**
   * Configure le chargement dynamique des parcelles cadastrales
   */
  private setupDynamicParcellesLoading(): void {
    console.log('🗺️ Configuration du chargement dynamique des parcelles cadastrales');

    // La couche est déjà créée dans initMap()
    // Juste s'assurer qu'elle est ajoutée à la carte
    if (this.parcellesLayer && !this.map.hasLayer(this.parcellesLayer)) {
      this.parcellesLayer.addTo(this.map);
    }

    // Événements pour déclencher le rechargement
    this.map.on('moveend', () => this.onMapViewChangedParcelles());
    this.map.on('zoomend', () => this.onMapViewChangedParcelles());
    
    // Chargement initial après un petit délai (seulement si zoom suffisant)
    setTimeout(() => {
      this.onMapViewChangedParcelles();
    }, 1000);
  }

  /**
   * Appelée quand la vue de la carte change (zoom, déplacement) pour les parcelles
   */
  private onMapViewChangedParcelles(): void {
    if (!this.chargerParcellesDynamiquement || this.isLoadingParcelles) {
      return; // Éviter les requêtes si désactivé ou en cours
    }

    // Vérifier le niveau de zoom minimum
    if (this.map.getZoom() < this.minZoomParcelles) {
      console.log(`🗺️ Zoom insuffisant (${this.map.getZoom()}) pour afficher les parcelles (min: ${this.minZoomParcelles})`);
      // Nettoyer la couche si zoom insuffisant
      if (this.parcellesLayer) {
        this.parcellesLayer.clearLayers();
      }
      return;
    }

    console.log('🗺️ Vue de la carte changée - rechargement des parcelles cadastrales...');

    // Débounce - attendre 500ms après le dernier mouvement
    if (this.loadingTimeoutParcelles) {
      clearTimeout(this.loadingTimeoutParcelles);
    }

    this.loadingTimeoutParcelles = setTimeout(() => {
      this.loadParcellesInCurrentView();
    }, 500);
  }

  /**
   * Charge les parcelles cadastrales dans la vue actuelle de la carte
   */
  private loadParcellesInCurrentView(): void {
    if (!this.map || this.isLoadingParcelles || !this.chargerParcellesDynamiquement) {
      console.log('🗺️ Chargement des parcelles annulé :', {
        map: !!this.map,
        isLoading: this.isLoadingParcelles,
        chargerDynamic: this.chargerParcellesDynamiquement
      });
      return;
    }

    // Vérifier le niveau de zoom minimum
    if (this.map.getZoom() < this.minZoomParcelles) {
      console.log(`🗺️ Zoom insuffisant pour charger les parcelles: ${this.map.getZoom()} < ${this.minZoomParcelles}`);
      return;
    }

    const bounds = this.map.getBounds();
    const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;

    // Éviter de recharger la même zone
    if (this.lastBboxParcelles === bbox) {
      console.log('🗺️ Même bbox que précédemment, pas de rechargement');
      return;
    }

    console.log('🗺️ Chargement des parcelles cadastrales pour la bbox:', bbox);
    this.isLoadingParcelles = true;
    this.lastBboxParcelles = bbox;

    this.http.get<any>(this.apiGeoParcellesUrl(bbox)).subscribe({
      next: (parcelles) => {
        console.log('🗺️ Parcelles reçues:', parcelles.features?.length || 0, 'parcelles');
        this.updateParcellesLayer(parcelles);
        this.isLoadingParcelles = false;
      },
      error: (error) => {
        console.error('🗺️ Erreur lors du chargement des parcelles:', error);
        this.isLoadingParcelles = false;
      }
    });
  }

  /**
   * Met à jour la couche des parcelles cadastrales sur la carte
   */
  private updateParcellesLayer(parcelles: any): void {
    if (!this.parcellesLayer) return;

    // Nettoyer la couche existante
    this.parcellesLayer.clearLayers();

    // Ajouter les nouvelles parcelles
    if (parcelles.features && parcelles.features.length > 0) {
      this.addParcellesToLayer(parcelles);
    }
  }

  /**
   * Ajoute les parcelles cadastrales à la couche dédiée
   */
  private addParcellesToLayer(parcellesCollection: any): void {
    if (!this.parcellesLayer || !parcellesCollection.features || parcellesCollection.features.length === 0) return;

    parcellesCollection.features.forEach((feature: any) => {
      const layer = L.geoJSON(feature, {
        style: this.getParcelleStyle(),
        onEachFeature: (feature, layer) => {
          this.addParcellePopupAndTooltip(feature, layer);
          this.addParcelleInteractiveEvents(feature, layer);
        }
      });
      
      layer.addTo(this.parcellesLayer!);
    });
  }

  /**
   * Retourne le style pour les parcelles cadastrales
   */
  private getParcelleStyle() {
    return {
      color: '#ff6b35', // Orange vif
      weight: 1.5,
      opacity: 0.8,
      fillOpacity: 0.1,
      fillColor: '#ff6b35'
    };
  }

  /**
   * Ajoute popup et tooltip à une parcelle cadastrale
   */
  private addParcellePopupAndTooltip(feature: any, layer: any): void {
    const props = feature.properties;
    
    // Popup détaillé
    const popupContent = `
      <div style="max-width: 300px;">
        <h4 style="margin: 0 0 10px 0; color: #d63031;">🗺️ Parcelle ${props.numero || props.id_par || 'N/A'}</h4>
        <div style="font-size: 13px; line-height: 1.4;">
          <p><strong>Section:</strong> ${props.section || 'N/A'}</p>
          <p><strong>Commune:</strong> ${props.commune || props.nom_com || 'N/A'}</p>
          <p><strong>Surface:</strong> ${props.contenance || props.surface || 'N/A'}</p>
          ${props.adresse ? `<p><strong>Adresse:</strong> ${props.adresse}</p>` : ''}
          <p><strong>Code parcelle:</strong> ${props.id_par || props.code_par || 'N/A'}</p>
        </div>
      </div>
    `;
    
    layer.bindPopup(popupContent);
    
    // Tooltip avec numéro de parcelle
    layer.bindTooltip(`🗺️ ${props.section} ${props.numero || props.id_par || 'Parcelle'}`, {
      permanent: false,
      direction: 'top',
      offset: [0, -10]
    });
  }

  /**
   * Ajoute les événements interactifs aux parcelles (highlight, zoom, etc.)
   */
  private addParcelleInteractiveEvents(feature: any, layer: any): void {
    layer.on({
      mouseover: (e: any) => this.highlightParcelle(e),
      mouseout: (e: any) => this.resetParcelleHighlight(e),
      dblclick: (e: any) => this.zoomToParcelle(e)
    });
  }

  /**
   * Met en surbrillance une parcelle au survol
   */
  private highlightParcelle(e: any): void {
    const layer = e.target;

    layer.setStyle({
      weight: 5,
      color: 'red',
      dashArray: '',
      fillOpacity: 0.3,
      fillColor: 'red'
    });

    // Amener la couche au premier plan (compatible navigateurs)
    if (!((L as any).Browser.ie) && !((L as any).Browser.opera)) {
      layer.bringToFront();
    }

    // Afficher le tooltip en permanence pendant le survol
    layer.openTooltip();
    
    // console.log('🗺️ Parcelle en surbrillance:', layer.feature.properties);
    // console.log('🗺️ Niveau de zoom actuel:', this.map.getZoom());
  }

  /**
   * Remet le style normal de la parcelle
   */
  private resetParcelleHighlight(e: any): void {
    const layer = e.target;
    
    // Restaurer le style par défaut
    layer.setStyle(this.getParcelleStyle());
    
    // Fermer le tooltip
    layer.closeTooltip();
    
    console.log('🗺️ Parcelle déselectionnée');
  }

  /**
   * Zoom sur la parcelle au double-clic
   */
  private zoomToParcelle(e: any): void {
    const layer = e.target;
    
    // Zoomer sur l'emprise de la parcelle
    this.map.fitBounds(layer.getBounds());
    
    console.log('🗺️ Zoom sur parcelle:', layer.feature.properties);
  }

  /**
   * Synchronise programmatiquement l'état de la couche Parcelles avec le layer control
   */
  public synchronizeParcellesLayer(active: boolean): void {
    if (!this.parcellesLayer) return;

    if (active) {
      if (!this.map.hasLayer(this.parcellesLayer)) {
        this.parcellesLayer.addTo(this.map);
        this.chargerParcellesDynamiquement = true;
        this.setupDynamicParcellesLoading();
      }
    } else {
      if (this.map.hasLayer(this.parcellesLayer)) {
        this.map.removeLayer(this.parcellesLayer);
        this.chargerParcellesDynamiquement = false;
        this.parcellesLayer.clearLayers();
      }
    }
  }

  // ==================== FIN MÉTHODES PARCELLES ====================

  addPolygonToMap(geometryType: string, polygon: Feature<MultiPolygon>): void {
    let surface = 'N/A';
    if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
      // turf.area accepte aussi bien Feature que Geometry
      surface = (turf.area(polygon) / 10000).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' ha';
      console.log(`Surface calculée pour l'opération : ${surface}`);
    } else {
      console.warn('Géométrie non supportée pour le calcul de surface :', geometryType);
    }
    const bounds = geometryType === 'Polygon' || geometryType === 'MultiPolygon'
      ? L.geoJSON(polygon).getBounds()
      : null;
    
    // console.log(`Bounds de la feature actuelle : ${bounds}`);
    if (bounds) {
      // console.log('SouthWest :', bounds.getSouthWest());
      // console.log('NorthEast :', bounds.getNorthEast());
      // console.log('Center :', bounds.getCenter());
      // console.log('toBBoxString :', bounds.toBBoxString());

      const northLat = bounds.getNorthEast().lat;
      const southLat = bounds.getSouthWest().lat;
      const westLng = bounds.getSouthWest().lng;
      const eastLng = bounds.getNorthEast().lng;
      const middleLng = (westLng + eastLng) / 2;
      const targetLat = southLat + 0.9 * (northLat - southLat);

      // Crée un marker invisible
      const marker = L.marker([targetLat, middleLng], { opacity: 0 });
      marker.bindTooltip(
        `Surface : ${surface}`,
        { permanent: true, direction: 'top' }
      ).addTo(this.map);
    }
  }

  /**
   * Récupère les géométries des sites CENCA depuis l'API WFS
   * @param couche Le nom de la couche à récupérer
   * @param bbox La bbox optionnelle pour filtrer les résultats
   * @returns Observable de la collection de sites CENCA
   */
  getSitesCencaGeoJson$(couche: string, bbox?: string): Observable<SiteCencaCollection> {
    const url = bbox 
      ? this.apiWFSLizmapUrl(couche, bbox)
      : `${this.activeUrl}/api-geo/lizmap/layer/${couche}`;
    
    return this.http.get<SiteCencaCollection>(url).pipe(
      tap((response) => {
        console.log(
          'Sites CENCA récupérés avec succès:',
          response.features.length,
          'features'
        );
      }),
      catchError((error) => {
        console.error(
          'Erreur lors de la récupération des sites CENCA',
          error
        );
        throw error;
      })
    );
  }

  /**
   * Ajoute les sites CENCA sur la carte
   * @param sitesCollection La collection de sites à afficher
   */
  addSitesCencaToMap(sitesCollection: SiteCencaCollection): void {
    if (!sitesCollection.features || sitesCollection.features.length === 0) {
      console.log('Aucun site CENCA à afficher');
      return;
    }

    console.log('Ajout de', sitesCollection.features.length, 'sites CENCA sur la carte');

    // Créer une couche de groupe pour tous les sites CENCA
    const sitesLayerGroup = L.layerGroup();

    sitesCollection.features.forEach((feature: SiteCencaFeature) => {
      // Créer la couche GeoJSON pour chaque site
      const siteLayer = L.geoJSON(feature, {
        style: (feature) => {
          // Style différent selon le type de gestion
          const gestion = feature?.properties?.gestion;
          let color = 'blue'; // couleur par défaut
          
          switch (gestion) {
            case '1':
              color = 'green'; // Gestion directe
              break;
            case '2':
              color = 'orange'; // Assistance technique
              break;
            case '3':
              color = 'red'; // Autre type
              break;
            default:
              color = 'blue';
          }

          return {
            color: color,
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3,
            fillColor: color
          };
        },
        onEachFeature: (feature, layer) => {
          // Créer le popup avec les informations du site
          const props = feature.properties;
          const popupContent = `
            <div style="max-width: 300px;">
              <h4>${props.nomsite}</h4>
              <p><strong>Code site:</strong> ${props.codesite}</p>
              <p><strong>Type:</strong> ${props.type}</p>
              <p><strong>Gestion:</strong> ${props.gestiontxt}</p>
              <p><strong>Milieu naturel:</strong> ${props.milieunat}</p>
              <p><strong>Référent:</strong> ${props.referent}</p>
              <p><strong>Bassin d'agence:</strong> ${props.bassinagence}</p>
              <p><strong>Zone humide:</strong> ${props.zonehumide}</p>
              <p><strong>Premier contrat:</strong> ${props.premiercontrat}</p>
              ${props.surface ? `<p><strong>Surface:</strong> ${props.surface} ha</p>` : ''}
            </div>
          `;
          
          layer.bindPopup(popupContent);
          
          // Ajouter un tooltip avec le nom du site
          layer.bindTooltip(props.nomsite, {
            permanent: false,
            direction: 'top'
          });
        }
      });

      sitesLayerGroup.addLayer(siteLayer);
    });

    // Ajouter le groupe de couches à la carte
    sitesLayerGroup.addTo(this.map);

    // Optionnel : zoomer sur l'emprise de tous les sites
    if (sitesCollection.bbox) {
      const bounds = L.latLngBounds(
        [sitesCollection.bbox[1], sitesCollection.bbox[0]], // SW
        [sitesCollection.bbox[3], sitesCollection.bbox[2]]  // NE
      );
      // this.map.fitBounds(bounds); // Décommenter si on veut zoomer automatiquement
    }
  }

  /**
   * Synchronise programmatiquement l'état de la couche Sites CENCA avec le layer control
   */
  public synchronizeSitesCencaLayer(active: boolean): void {
    if (!this.map || !this.sitesCencaLayer) return;

    if (active && !this.map.hasLayer(this.sitesCencaLayer)) {
      // Activer la couche
      this.sitesCencaLayer.addTo(this.map);
      this.chargerSitesDynamiquement = true;
      this.setupDynamicSitesLoading();
    } else if (!active && this.map.hasLayer(this.sitesCencaLayer)) {
      // Désactiver la couche
      this.map.removeLayer(this.sitesCencaLayer);
      this.chargerSitesDynamiquement = false;
      this.sitesCencaLayer.clearLayers();
    }
  }

  /**
   * Synchronise programmatiquement l'état de la couche Sites CENCA Sites avec le layer control
   */
  public synchronizeSitesCencaSitesLayer(active: boolean): void {
    if (!this.map || !this.sitesCencaSitesLayer) return;

    if (active && !this.map.hasLayer(this.sitesCencaSitesLayer)) {
      // Activer la couche
      this.sitesCencaSitesLayer.addTo(this.map);
      this.chargerSitesSitesDynamiquement = true;
      this.setupDynamicSitesSitesLoading();
    } else if (!active && this.map.hasLayer(this.sitesCencaSitesLayer)) {
      // Désactiver la couche
      this.map.removeLayer(this.sitesCencaSitesLayer);
      this.chargerSitesSitesDynamiquement = false;
      this.sitesCencaSitesLayer.clearLayers();
    }
  }

}