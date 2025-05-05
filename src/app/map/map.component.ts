import { Component, Input, ElementRef, AfterViewInit, OnDestroy, Renderer2 } from '@angular/core';
import * as L from 'leaflet'; // Import de Leaflet
import 'leaflet.fullscreen'; // Import du plugin Fullscreen
import { GeoJsonObject, Feature, MultiPolygon } from 'geojson'; // Import de GeoJsonObject et Feature

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
  @Input() geojson_primary?: string;
  @Input() geojson_secondary?: string;
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

    // Ajoute ignOrthoPhoto par défaut
    ignOrthoPhoto.addTo(this.map);

    // Sélecteur de couches avec différentes options de fonds de plan
    const baseMaps = {
      'IGN OrthoPhoto': ignOrthoPhoto, // Ajout de la couche OrthoPhoto
      'IGN LIDAR MNT': ignLidarMNT, // Ajout de la couche MNT LIDAR
      'IGN LIDAR MNS': ignLidarMNS, // Ajout de la couche MNS LIDAR
      'OpenStreetMap': openStreetMap,
      'Google Satellite': googleSatellite,
    };

    // Ajout du sélecteur de couches sur la carte
    L.control.layers(baseMaps).addTo(this.map);

    // Ajout d'un événement pour détecter l'entrée et la sortie du mode plein écran
    this.map.on('enterFullscreen', () => {
      console.log('Carte en mode plein écran');
    });
    this.map.on('exitFullscreen', () => {
      console.log('Carte sortie du mode plein écran');
    });

    // Ajout d'un bouton pour zoomer sur l'étendue du GeoJSON primaire
    if (this.geojson_primary) {
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

          this.renderer.listen(button, 'click', () => this.zoomToGeoJson());
          return button;
        },
      });

      // Ajout du contrôle personnalisé à la carte
      this.map.addControl(new ZoomToGeoJsonControl());
    }

    // GéoJSON principal (souvent le site)
    if (this.geojson_primary !== undefined || this.geojson_secondary !== undefined) {
      if (this.geojson_primary !== '') {
        // Transformation de la chaîne GeoJSON en VRAI DE VRAI objet GeoJSON
        const trueGeoJson: GeoJsonObject = JSON.parse(this.geojson_primary!);
        const geojsonLayer = L.geoJSON(trueGeoJson);
        geojsonLayer.setStyle({
          color: 'green',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.5,
          fillColor: 'green',
        }).addTo(this.map);

        // Obtenir les limites et ajuster la vue
        const bounds = geojsonLayer.getBounds();
        // Si le GeoJSON secondaire est vide, on ajuste la vue sur le GeoJSON primaire
        if (this.geojson_secondary == undefined) {
          this.map.fitBounds(bounds);
        }
      } else {
        // Sinon on zoom sur la Champagne-Ardenne
        console.log('Aucun GeoJSON primaire trouvé');
        this.map.setView([48.9681497, 4.4], 7);
      }

      // GeoJSON secondaire (souvent l'opération)
      if (this.geojson_secondary !== '') {
        // Transformation de la chaîne GeoJSON en VRAI DE VRAI objet GeoJSON
        const trueGeoJson: GeoJsonObject = JSON.parse(this.geojson_secondary!);
        const geojsonLayer = L.geoJSON(trueGeoJson);
        geojsonLayer.setStyle({
          color: 'orange',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.5,
          fillColor: 'orange',
        }).addTo(this.map);

        // Obtenir les limites et ajuster la vue
        const bounds = geojsonLayer.getBounds();
        this.map.fitBounds(bounds);
      } else {
        // Sinon on zoom sur la Champagne-Ardenne
        console.log('Aucun GeoJSON secondaire trouvé');
        this.map.setView([48.9681497, 4.4], 7);
      }
    } else {
      // Sinon on zoom aussi sur la Champagne-Ardenne
      this.map.setView([48.9681497, 4.4], 7);
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

  private zoomToGeoJson(): void {
    if (this.geojson_primary) {
      const geoJsonObject: GeoJsonObject = JSON.parse(this.geojson_primary);
      const geojsonLayer = L.geoJSON(geoJsonObject);
      const bounds = geojsonLayer.getBounds();
      this.map.fitBounds(bounds);
    }
  }
}
