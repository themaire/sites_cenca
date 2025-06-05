import { Component, Input, ElementRef, AfterViewInit, OnDestroy, Renderer2 } from '@angular/core';
import * as L from 'leaflet'; // Import de Leaflet
import * as turf from '@turf/turf'; // Import de Turf.js pour les opérations géospatiales comme calcule de surfaces
import 'leaflet.fullscreen'; // Import du plugin Fullscreen
import { GeoJsonObject, Feature, MultiPolygon } from 'geojson'; // Import de GeoJsonObject et Feature

import { Localisation } from '../shared/interfaces/localisation'; // Import de l'interface Localisation

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

  lastColorIndex = -1;
  usedColors: number[] = [];
  
  private map!: L.Map;

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit() {
    setTimeout(() => {
      console.log('Initialisation de la carte :', this.mapName);
      this.initMap();
    });
  }

  ngOnDestroy() {
    // Nettoyage de la carte
    if (this.map) {
      this.map.remove();
    }
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

    // Ajout du sélecteur de couches sur la carte
    L.control.layers(satellite, baseMaps).addTo(this.map);

    // Ajout d'un événement pour détecter l'entrée et la sortie du mode plein écran
    this.map.on('enterFullscreen', () => {
      console.log('Carte en mode plein écran');
    });
    this.map.on('exitFullscreen', () => {
      console.log('Carte sortie du mode plein écran');
    });

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
}