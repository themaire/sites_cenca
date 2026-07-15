import { Component, Input, Output, EventEmitter, ElementRef, AfterViewInit, OnDestroy, Renderer2, input, OnChanges, SimpleChanges } from '@angular/core';
import { environment } from '../../environments/environment';

import * as L from 'leaflet'; // Import de Leaflet
import * as turf from '@turf/turf'; // Import de Turf.js pour les opérations géospatiales comme calcule de surfaces
import 'leaflet.fullscreen'; // Import du plugin Fullscreen
import { GeoJsonObject, Feature, MultiPolygon } from 'geojson'; // Import de GeoJsonObject et Feature

import { Localisation } from '../shared/interfaces/localisation'; // Interface Localisations (site et opération)
import { SiteCencaCollection, SiteCencaFeature } from '../shared/interfaces/site-geojson'; // Interfaces pour les sites CENCA
import { ParcellesSelected } from '../../app/sites/foncier/foncier';
import { GeoService } from '../shared/services/geo.service';
import { SiteCencaService } from '../shared/services/site-cenca.service';

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
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy {
  /** Émet l'idu d'une parcelle supprimée pour synchroniser avec le parent */
  @Output() parcelleRemoved = new EventEmitter<string>();
  @Input() mapName?: string;
  @Input() localisation_site?: Localisation;
  @Input() localisation_projet?: Localisation;
  @Input() localisations_operations?: Localisation[];
  @Input() sitesCenca?: SiteCencaCollection; // Collection de sites CENCA à afficher
  @Input() chargerSitesDynamiquement: boolean = false; // Active le chargement dynamique des sites CENCA
  /** Liste des parcelles sélectionnées (émise vers le parent) */
  @Output() parcellesSelected = new EventEmitter<ParcellesSelected[]>();

  private _parcellesSelectionnees: ParcellesSelected[] = [];
  private hasZoomedToSelectedParcelles = false;

  @Input() chargerSitesSitesDynamiquement: boolean = false; // Active le chargement dynamique de la couche cenca_sites
  @Input() chargerParcellesDynamiquement: boolean = false; // Active le chargement dynamique des parcelles cadastrales
  @Input() parcellesSelectedInitiales?: ParcellesSelected[] = []; // Parcelles sélectionnées initiales
  @Input() selectParcellesMode: boolean = false; // Active le mode sélection de parcelles
  @Input() coucheSitesCenca: string = 'cenca_autres'; // Nom de la couche à charger
  @Input() zoomOnParcelleAdd: boolean = false; // Zoom auto lors de l'ajout d'une parcelle

  @Input() isEditMode: boolean = false; // Mode édition du parent

  // Événements pour synchroniser avec le composant parent
  @Output() sitesCencaToggled = new EventEmitter<boolean>();
  @Output() sitesCencaSitesToggled = new EventEmitter<boolean>();
  @Output() parcellesToggled = new EventEmitter<boolean>();

  private _pointPickingMode = false;
  @Input() set pointPickingMode(val: boolean) {
    this._pointPickingMode = val;
    if (this.map) { val ? this.enablePointPicking() : this.disablePointPicking(); }
  }
  get pointPickingMode(): boolean { return this._pointPickingMode; }
  @Output() pointPicked = new EventEmitter<{ lat: number; lng: number }>();
  @Input() initialMarker?: { lat: number; lng: number; label?: string };

  lastColorIndex = -1;
  private pickingMarker?: L.Marker;
  private initialMarkerLayer?: L.CircleMarker;
  usedColors: number[] = [];

  // Propriété pour suivre l'état des popups et éviter les rechargements intempestifs
  private hasOpenPopup = false;

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
  private minZoomParcelles = 14; // Zoom minimum pour afficher les parcelles (équivaut environ au 1:2000ème)

  private surfaceInfoControl: any;

  private activeUrl: string = environment.apiBaseUrl;

  private map!: L.Map;

  constructor(private elementRef: ElementRef, 
            private renderer: Renderer2,
            private http: HttpClient,
            private siteCencaService: SiteCencaService,
            private geoService: GeoService
          ) {}

  /** Envoyer la sélection des parcelles au composant parent */
  emitParcellesSelectionnees() {
    this.parcellesSelected.emit(this._parcellesSelectionnees);
    this.updateSurfaceInfoControl();
  }

  // Quand la vue est initialisée. On peut dire aussi : quand le composant s'est initialisé ou ouvert
  ngAfterViewInit() {
    setTimeout(() => {
      console.log('Initialisation de la carte :', this.mapName);
      this.initMap();
    });
  }

  // Quand une des propriétés d'entrée change. C'est a dire par exemple ici ce qui nous interresse : quand les inputs changent
  ngOnChanges(changes: SimpleChanges) {
    console.log('Initialisation de la carte :', this.mapName);
    
    // console.log('Parcelles sélectionnées initiales dans ngOnChanges :', this.parcellesSelectedInitiales);
    if (this.parcellesSelectedInitiales && this.parcellesSelectedInitiales.length > 0) {
      this._parcellesSelectionnees = this.parcellesSelectedInitiales || [];
      this.tryZoomToSelectedParcellesOnce();
    }

    console.log('Parcelles sélectionnées après initialisation dans ngOnChanges :', this._parcellesSelectionnees);
    
    this.createSurfaceInfoControl();
    this.updateSurfaceInfoControl();
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
    this.tryZoomToSelectedParcellesOnce();
    if (this._pointPickingMode) { this.enablePointPicking(); }
    if (this.initialMarker) { this.addInitialMarker(); }

    // Affichage des sites CENCA si fournis
    if (this.sitesCenca && this.sitesCenca.features.length > 0) {
      console.log('Affichage des sites CENCA:', this.sitesCenca.features.length, 'sites');
      this.addSitesCencaToMap(this.sitesCenca);
    }

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
          color: 'red',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.0,
          fillColor: 'red',
        // }).addTo(this.map);
        });
        
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

      this.map.createPane('starPane');
      const starPane = this.map.getPane('starPane');
      if (starPane) {
        starPane.style.zIndex = '650'; // plus haut que les autres
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
                pane: 'starPane', // Definit la couche personnalisée pour être au-dessus
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
                    
                    // Crée un marker invisible pour afficher le label au-dessus du polygone
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
              geojsonLayer.bringToFront();

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
              geojsonLayer.bringToFront();

            } else if (geometryType === 'Point' || geometryType === 'MultiPoint') {
              const geojsonLayer = L.geoJSON(geojson, {
                pointToLayer: (feature, latlng) => {
                  // Pour les points, on utilise un marqueur personnalisé
                  const marker = L.marker(latlng, { icon: customIconMarkers });
                  marker.bindPopup(`Point : ${feature.properties?.name || 'N/A'}`);
                  return marker;
                }
              }).addTo(this.map);
              geojsonLayer.bringToFront();
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

    // Ajout d'un marqueur pour illustrer les antennes du CENCA
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

  private addInitialMarker(): void {
    if (!this.initialMarker) return;
    const { lat, lng, label } = this.initialMarker;
    this.initialMarkerLayer = L.circleMarker([lat, lng], {
      radius: 9,
      color: '#4e342e',
      fillColor: '#6d4c41',
      fillOpacity: 0.9,
      weight: 2,
    }).addTo(this.map);
    if (label) {
      this.initialMarkerLayer.bindTooltip(label, { permanent: true, direction: 'top', offset: [0, -6] });
    }
    this.map.setView([lat, lng], 13);
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

  private tryZoomToSelectedParcellesOnce(): void {
    if (this.hasZoomedToSelectedParcelles) return;
    if (!this.map) return;
    if (this._parcellesSelectionnees && this._parcellesSelectionnees.length > 0) {
      this.zoomToSelectedParcells(this._parcellesSelectionnees);
      this.hasZoomedToSelectedParcelles = true;
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

    // NOUVEAU : Ne pas recharger si une popup est ouverte
    if (this.hasOpenPopup) {
      console.log('🚫 Popup ouverte - rechargement des sites CENCA annulé');
      return;
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
    
    // Suivre l'ouverture/fermeture des popups pour éviter les rechargements intempestifs
    layer.on('popupopen', () => {
      this.hasOpenPopup = true;
      console.log('🔓 Popup CENCA ouverte - rechargements suspendus');
    });
    
    layer.on('popupclose', () => {
      this.hasOpenPopup = false;
      console.log('🔒 Popup CENCA fermée - rechargements autorisés');
    });
    
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

    // 🔒 Protection contre les rechargements pendant l'affichage des popups
    if (this.hasOpenPopup) {
      console.log('🔒 Popup ouverte - rechargement Sites suspendu');
      return;
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
    
    // Suivre l'ouverture/fermeture des popups pour éviter les rechargements intempestifs
    layer.on('popupopen', () => {
      this.hasOpenPopup = true;
      console.log('🔓 Popup Sites CENCA verts ouverte - rechargements suspendus');
    });
    
    layer.on('popupclose', () => {
      this.hasOpenPopup = false;
      console.log('🔒 Popup Sites CENCA verts fermée - rechargements autorisés');
    });
    
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
    // console.log('🗺️ Configuration du chargement dynamique des parcelles cadastrales');

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
    }, 500); // 1000 de base
  }

  /**
   * Appelée quand la vue de la carte change (zoom, déplacement) pour les parcelles
   */
  private onMapViewChangedParcelles(): void {
    if (!this.chargerParcellesDynamiquement || this.isLoadingParcelles) {
      return; // Éviter les requêtes si désactivé ou en cours
    }

    // 🔒 Protection contre les rechargements pendant l'affichage des popups
    if (this.hasOpenPopup) {
      console.log('🔒 Popup ouverte - rechargement Parcelles suspendu');
      return;
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
      // console.log('🗺️ Chargement des parcelles annulé :', {
      //   map: !!this.map,
      //   isLoading: this.isLoadingParcelles,
      //   chargerDynamic: this.chargerParcellesDynamiquement
      // });
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
      // console.log('🗺️ Même bbox que précédemment, pas de rechargement');
      return;
    }

    // console.log('🗺️ Chargement des parcelles cadastrales pour la bbox:', bbox);
    this.isLoadingParcelles = true;
    this.lastBboxParcelles = bbox;

    this.http.get<any>(this.geoService.apiGeoParcellesUrl(bbox)).subscribe({
      next: (parcelles) => {
        // console.log('🗺️ Parcelles reçues:', parcelles.features?.length || 0, 'parcelles');
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
      // Style selon l'état de sélection (et le flag pour-partie)
      const idu = feature.properties?.idu;
      const style = this.getStyleForParcelle(idu);
      const layer = L.geoJSON(feature, {
        style,
        onEachFeature: (feature, layer) => {
          this.addParcellePopupAndTooltip(feature, layer);
          this.addParcelleInteractiveEvents(feature, layer);
        }
      });
      layer.addTo(this.parcellesLayer!);
    });
  }

  /**
   * Retourne le style pour les parcelles cadastrales (par défaut orange)
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
   * Retourne le style pour les parcelles sélectionnées (jaune)
   */
  private getParcelleSelectedStyle() {
    return {
      color: '#ffd600', // Jaune
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.25,
      fillColor: '#fffde7'
    };
  }

  /**
   * Retourne le style pour les parcelles sélectionnées "pour partie" (violet)
   */
  private getParcellePourPartieStyle() {
    return {
      color: '#8e24aa', // Violet
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.25,
      fillColor: '#f3e5f5' // Violet très clair
    };
  }

  /**
   * Style d'une parcelle selon son état : sélectionnée pour-partie (violet),
   * sélectionnée (jaune) ou non sélectionnée (orange par défaut)
   */
  private getStyleForParcelle(idu?: string) {
    const selectionnee = idu ? this._parcellesSelectionnees.find(p => p.idu === idu) : undefined;
    if (!selectionnee) return this.getParcelleStyle();
    return selectionnee.pour_partie ? this.getParcellePourPartieStyle() : this.getParcelleSelectedStyle();
  }

  /**
   * Réapplique les styles de sélection aux parcelles déjà affichées, sans rechargement réseau.
   * À appeler depuis le parent quand un flag (ex. pour-partie) change sur une parcelle sélectionnée.
   */
  public restyleParcellesSelection(): void {
    if (!this.parcellesLayer) return;
    this.parcellesLayer.eachLayer((group: any) => {
      if (typeof group.eachLayer !== 'function') return;
      group.eachLayer((layer: any) => {
        const idu = layer.feature?.properties?.idu;
        if (idu && typeof layer.setStyle === 'function') {
          layer.setStyle(this.getStyleForParcelle(idu));
        }
      });
    });
  }

  /**
   * Ajoute les événements d'interaction (souris) à une couche de parcelle
   */
  private addParcelleInteractiveEvents(feature: any, layer: any): void {
    // Surlignage au survol
    layer.on('mouseover', (e: any) => {
      this.highlightParcelle(e);
    });
    // Rétablir le style au mouseout
    layer.on('mouseout', (e: any) => {
      this.resetParcelleHighlight(e);
    });
    // Zoom sur la parcelle au double-clic
    layer.on('dblclick', (e: any) => {
      this.zoomToParcelle(e);
    });
  }

  /**
   * Surligne la parcelle au survol (polygone rouge, épaisseur 2, sans remplissage)
   */
  private highlightParcelle(e: any): void {
    const layer = e.target;
    layer.setStyle({
      weight: 2,
      color: 'red',
      fillOpacity: 0,
      fillColor: 'transparent',
      opacity: 1
    });
    // Amener la couche au premier plan
    if (!((L as any).Browser.ie) && !((L as any).Browser.opera)) {
      layer.bringToFront();
    }
    // Afficher le tooltip pendant le survol
    layer.openTooltip();
  }

  /**
   * À appeler depuis le parent après modification de selectParcellesMode ou isEditMode
   * pour forcer la mise à jour des popups de parcelles (bouton sélection/déselection)
   */
  public refreshParcellesPopups(): void {
    if (this.map) {
      this.map.closePopup();
    }
    this.reloadParcellesInCurrentView();
  }

  /**
   * Ajoute popup et tooltip à une parcelle cadastrale
   */
  private addParcellePopupAndTooltip(feature: any, layer: any): void {
    const props = feature.properties;
    // console.log('🗺️ Ajout popup parcelle:', props);

    if (this.selectParcellesMode && this.isEditMode) {
      layer.bindPopup(`
        <div style="max-width: 300px;">
          <h4 style="margin: 0 0 10px 0; color: #d63031;">🗺️ Parcelle ${props.section || 'N/A'} ${props.numero || props.id_par || 'N/A'}</h4>
          <div style="font-size: 13px; line-height: 1.4;">
            <p><strong>Commune:</strong> ${props.commune || props.nom_com || 'N/A'}</p>
            <p><strong>Surface:</strong> ${props.contenance / 10000 + ' ha' || 'N/A'}</p>
            ${props.adresse ? `<p><strong>Adresse:</strong> ${props.adresse}</p>` : ''}
          </div>
          <div id="parcelle-action-btn-${props.idu}" style="display: flex; justify-content: center; align-items: center; margin-top: 10px;"></div>
        </div>`
      );
    } else {
      layer.bindPopup(`
        <div style="max-width: 300px;">
          <h4 style="margin: 0 0 10px 0; color: #d63031;">🗺️ Parcelle ${props.section || 'N/A'} ${props.numero || props.id_par || 'N/A'}</h4>
          <div style="font-size: 13px; line-height: 1.4;">
            <p><strong>Commune:</strong> ${props.commune || props.nom_com || 'N/A'}</p>
            <p><strong>Surface:</strong> ${props.contenance / 10000 + ' ha' || 'N/A'}</p>
            ${props.adresse ? `<p><strong>Adresse:</strong> ${props.adresse}</p>` : ''}
          </div>
        </div>`
      );
    }

    // Attacher l'événement au bouton après ouverture du popup
    layer.on('popupopen', () => {
      this.hasOpenPopup = true;
      console.log('🔓 Popup Parcelle ouverte - rechargements suspendus');
      // Calculer la bbox à l'ouverture du popup
      let bbox: number[] | undefined = undefined;
      try {
        const bounds = layer.getBounds();
        bbox = [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ];
        (layer as any)._bbox = bbox;
      } catch (e) {
        console.warn('Impossible de calculer la bbox pour la parcelle', props.idu);
      }
      setTimeout(() => {
        const btnContainer = document.getElementById(`parcelle-action-btn-${props.idu}`);
        if (btnContainer) {
          const isSelectedNow = this._parcellesSelectionnees.some(p => p.idu === props.idu);
          if (!isSelectedNow) {
            btnContainer.innerHTML = `<span id="select-parcelle-${props.idu}" class="material-icons" style="color:#28a745;cursor:pointer;font-size:28px;" title="Sélectionner cette parcelle">add_shopping_cart</span>`;
            const btn = document.getElementById(`select-parcelle-${props.idu}`);
            if (btn) {
              console.log("Element du bouton de sélection", btnContainer);
              btn.onclick = () => this.addParcelleToSelection(props.idu, props.nom_com, props.section, props.numero, props.contenance, bbox);
            }
          } else {
            btnContainer.innerHTML = `<span id="remove-parcelle-${props.idu}" class="material-icons" style="color:#c62828;cursor:pointer;font-size:28px;" title="Retirer cette parcelle">remove_shopping_cart</span>`;
            const btn = document.getElementById(`remove-parcelle-${props.idu}`);
            if (btn) {
              btn.onclick = () => this.removeParcelleFromSelection(props.idu);
            }
          }
        }
      }, 0);
    });

    layer.on('popupclose', () => {
      this.hasOpenPopup = false;
      console.log('🔒 Popup Parcelle fermée - rechargements autorisés');
    });

    // Tooltip avec numéro de parcelle
    layer.bindTooltip(`🗺️ ${props.section} ${props.numero || props.id_par || 'Parcelle'}`, {
      permanent: false,
      direction: 'top',
      offset: [0, -10]
    });
  }

  /** Retire une parcelle de la sélection par son idu et informe le parent */
  removeParcelleFromSelection(idu: string): void {
    console.log('🗺️ Retrait de la parcelle de la sélection:', idu);
    this._parcellesSelectionnees = this._parcellesSelectionnees.filter(p => p.idu !== idu);

    console.log('✅ Parcelle retirée. Parcelles sélectionnées actuelles:', this._parcellesSelectionnees);

    this.emitParcellesSelectionnees();
    // Informer le parent pour synchroniser trashParcelle et l'historique
    console.log('[Carte] Emission de parcelleRemoved avec idu :', idu);
    this.parcelleRemoved.emit(idu);
    // Fermer la popup active
    if (this.map) {
      this.map.closePopup();
    }
    // Réactiver le chargement dynamique
    this.hasOpenPopup = false;
    this.reloadParcellesInCurrentView();
  }

  /** Ajoute l'idu d'une parcelle à la sélection et émet la liste, ferme la popup et réactive le chargement dynamique */
  addParcelleToSelection(idu: string, nom_com: string, section: string, numero: string, contenance: number, bbox?: number[]): void {
    if (!idu) return;
    const existe = this._parcellesSelectionnees.find(p => p.idu === idu && p.nom_com === nom_com && p.section === section && p.numero === numero);
    if (!existe) {
      this._parcellesSelectionnees.push({ idu, nom_com, section, numero, contenance, bbox });
      this.emitParcellesSelectionnees();
      console.log('✅ Parcelle ajoutée à la sélection:', idu, this._parcellesSelectionnees);
      if (this.zoomOnParcelleAdd && this.map) {
        this.zoomToSelectedParcells(this._parcellesSelectionnees);
      }
      // Fermer la popup active
      if (this.map) {
        this.map.closePopup();
      }
      // Réactiver le chargement dynamique
      this.hasOpenPopup = false;
      // Déclencher le rechargement des parcelles
      this.reloadParcellesInCurrentView();
    } else {
      console.log('ℹ️ Parcelle déjà sélectionnée:', idu);
    }
  }

  /**
   * Remet le style normal de la parcelle
   */
  private resetParcelleHighlight(e: any): void {
    const layer = e.target;
    const idu = layer.feature?.properties?.idu;

    // Restaurer le style selon l'état de sélection (pour-partie inclus)
    layer.setStyle(this.getStyleForParcelle(idu));

    // Fermer le tooltip
    layer.closeTooltip();
  }

  /**
   * Zoom sur la parcelle au double-clic
   */
  private zoomToParcelle(e: any): void {
    const layer = e.target;
    // Zoomer sur l'emprise de la parcelle
    const bounds = layer.getBounds();
    this.map.fitBounds(bounds);
    // Centrer sur le centroïde après le fitBounds
    const center = bounds.getCenter();
    setTimeout(() => {
      this.map.setView(center, this.map.getZoom());
    }, 400); // délai pour laisser le fitBounds s'appliquer
    console.log('🗺️ Zoom sur parcelle (centroïde):', layer.feature.properties, center);
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
      ? this.geoService.apiWFSLizmapUrl(couche, bbox)
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

  /**
   * Zoom sur une bbox [west, south, east, north] passée en paramètre
   */
  public zoomToBbox(bbox: number[]): void {
    if (bbox && bbox.length === 4 && this.map) {
      const bounds = L.latLngBounds(
        [bbox[1], bbox[0]], // SW
        [bbox[3], bbox[2]]  // NE
      );
      this.map.fitBounds(bounds);
    }
  }

  /** Permet au parent de synchroniser la sélection des parcelles */
  public setParcellesSelection(parcelles: ParcellesSelected[]) {
    const nouvelleSelection = JSON.stringify(parcelles);
    const ancienneSelection = JSON.stringify(this._parcellesSelectionnees);
    if (nouvelleSelection === ancienneSelection) return; // Ne rien faire si identique
    this._parcellesSelectionnees = [...parcelles];
    this.emitParcellesSelectionnees();
    if (this.zoomOnParcelleAdd && this.map) {
      this.zoomToSelectedParcells(this._parcellesSelectionnees);
    }
    this.reloadParcellesInCurrentView();
  }

  private createSurfaceInfoControl(): void {
    if (!this.selectParcellesMode) {
      // Si le chargement dynamique n'est pas activé, ne pas afficher le contrôle
      if (this.surfaceInfoControl) {
        this.surfaceInfoControl.remove();
        this.surfaceInfoControl = undefined;
      }
      return;
    }
    if (this.surfaceInfoControl) {
      this.surfaceInfoControl.remove();
    }
    const SurfaceInfo = L.Control.extend({
      options: { position: 'topright' }, // 'topcenter' n'existe pas nativement
      onAdd: (map: any) => {
        const div = L.DomUtil.create('div', 'leaflet-surface-info');
        div.style.textAlign = 'center';
        div.style.background = 'rgba(255,255,255,0.9)';
        div.style.padding = '6px 16px';
        div.style.borderRadius = '8px';
        div.style.fontWeight = 'bold';
        div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
        div.style.marginTop = '10px';
        div.style.maxWidth = '320px';
        div.id = 'surface-info-control';
        div.innerHTML = '';
        return div;
      }
    });
    this.surfaceInfoControl = new SurfaceInfo();
    this.surfaceInfoControl.addTo(this.map);
  }

  private updateSurfaceInfoControl(): void {
    if (!this.surfaceInfoControl) return;
    const div = document.getElementById('surface-info-control');
    if (!div) return;
    let total = 0;

    console.log('Parcelles sélectionnées dans la methode updateSurfaceInfoControl : ', this._parcellesSelectionnees);
    for (const p of this._parcellesSelectionnees) {
      if (p.contenance) total += p.contenance / 10000; // convertir m² en ha
    }
    div.innerHTML = `<span style="font-size:16px;">Surface totale sélectionnée : <b>${total.toLocaleString('fr-FR', { maximumFractionDigits: 4 })} ha</b></span>`;
  }

  zoomToSelectedParcells(parcellesCollection: ParcellesSelected[]) {
    if (parcellesCollection.length > 0 && this.map) {
        // Récupère toutes les bbox des parcelles sélectionnées
        const bboxes = parcellesCollection
          .map(p => p.bbox)
          .filter(bbox => Array.isArray(bbox) && bbox.length === 4);

        if (bboxes.length > 0) {
          // Calcule la bbox globale
          const west = Math.min(...bboxes.filter(b => b !== undefined).map(b => b![0]));
          const south = Math.min(...bboxes.filter(b => b !== undefined).map(b => b![1]));
          const east = Math.max(...bboxes.filter(b => b !== undefined).map(b => b![2]));
          const north = Math.max(...bboxes.filter(b => b !== undefined).map(b => b![3]));
          const globalBounds = L.latLngBounds([south, west], [north, east]);
          this.map.fitBounds(globalBounds);
        }
    }
  }

  // ── Point picking ──────────────────────────────────────────────────────────

  private enablePointPicking() {
    this.map.getContainer().style.cursor = 'crosshair';
    this.map.on('click', this.onPickingClick, this);
  }

  private disablePointPicking() {
    if (!this.map) return;
    this.map.getContainer().style.cursor = '';
    this.map.off('click', this.onPickingClick, this);
    if (this.pickingMarker) {
      this.map.removeLayer(this.pickingMarker);
      this.pickingMarker = undefined;
    }
  }

  private onPickingClick(e: L.LeafletMouseEvent) {
    const { lat, lng } = e.latlng;
    if (this.pickingMarker) {
      this.pickingMarker.setLatLng([lat, lng]);
    } else {
      const redIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:18px;height:18px;
          background:#e74c3c;
          border:2px solid #922b21;
          border-radius:50%;
          cursor:grab;
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      this.pickingMarker = L.marker([lat, lng], { draggable: true, icon: redIcon }).addTo(this.map);
      this.pickingMarker.bindTooltip('Nouvel emplacement', { permanent: true, direction: 'top', offset: [0, -12] });
      this.pickingMarker.on('dragend', () => {
        const pos = this.pickingMarker!.getLatLng();
        this.pointPicked.emit({ lat: pos.lat, lng: pos.lng });
      });
    }
    this.pointPicked.emit({ lat, lng });
  }

}