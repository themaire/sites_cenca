# 🎯 Intégration Sites CENCA dans DetailPmfuComponent

Voici comment intégrer les sites CENCA dans ton composant `DetailPmfuComponent` pour enrichir la carte avec les sites environnants.

## 🔧 Étape 1 : Mise à jour du composant

### Import du service
```typescript
// detail-pmfu.component.ts
import { SiteCencaService } from '../../../../shared/services/site-cenca.service';
import { SiteCencaCollection } from '../../../../shared/interfaces/site-geojson';
```

### Injection du service
```typescript
constructor(
  // ... tes services existants
  private siteCencaService: SiteCencaService
) {}
```

### Ajout des propriétés
```typescript
export class DetailPmfuComponent {
  // ... tes propriétés existantes
  
  // Nouvelles propriétés pour les sites CENCA
  sitesCencaProches?: SiteCencaCollection;
  chargementSites = false;
  afficherSitesCenca = false;
}
```

## 🗺️ Étape 2 : Méthodes pour charger les sites

### Charger les sites proches du projet
```typescript
/**
 * Charge les sites CENCA dans un rayon autour du projet PMFU
 */
chargerSitesProches(): void {
  if (!this.pmfu || this.chargementSites) return;
  
  this.chargementSites = true;
  
  // Définir une bbox autour du projet (exemple avec coordonnées approximatives)
  // Tu peux calculer cela à partir de la localisation du projet
  const bbox = this.calculerBboxAutourProjet();
  
  this.siteCencaService.getSitesCenca$('cenca_autres', bbox).subscribe({
    next: (sites) => {
      this.sitesCencaProches = sites;
      this.chargementSites = false;
      console.log(`${sites.features.length} sites CENCA trouvés à proximité`);
    },
    error: (error) => {
      console.error('Erreur chargement sites CENCA:', error);
      this.chargementSites = false;
    }
  });
}

/**
 * Calcule une bbox autour du projet PMFU
 * Retourne une chaîne "minX,minY,maxX,maxY"
 */
private calculerBboxAutourProjet(): string {
  // Exemple : région Champagne-Ardenne élargie
  // Tu peux affiner selon la localisation réelle du projet
  const centerLat = 48.5; // Centre approximatif
  const centerLng = 4.5;
  const radius = 0.5; // Rayon en degrés (environ 50km)
  
  return `${centerLng - radius},${centerLat - radius},${centerLng + radius},${centerLat + radius}`;
}

/**
 * Active/désactive l'affichage des sites CENCA
 */
toggleAffichageSitesCenca(): void {
  this.afficherSitesCenca = !this.afficherSitesCenca;
  
  if (this.afficherSitesCenca && !this.sitesCencaProches) {
    this.chargerSitesProches();
  }
}

/**
 * Filtre les sites par zones humides
 */
filtrerZonesHumides(): void {
  if (!this.sitesCencaProches) return;
  
  const zonesHumides = this.siteCencaService.filterSitesZonesHumides(this.sitesCencaProches);
  this.sitesCencaProches = {
    ...this.sitesCencaProches,
    features: zonesHumides
  };
}
```

## 🎨 Étape 3 : Mise à jour du template HTML

### Ajout des contrôles dans l'étape carte
```html
<!-- Dans l'étape 2: Localisation -->
<mat-step>
  <ng-template matStepLabel>Localisation</ng-template>
  
  <!-- Contrôles pour les sites CENCA -->
  <div class="carte-controls">
    <mat-slide-toggle 
      [(ngModel)]="afficherSitesCenca"
      (change)="toggleAffichageSitesCenca()">
      Afficher les sites CENCA proches
    </mat-slide-toggle>
    
    <button 
      mat-stroked-button 
      *ngIf="sitesCencaProches && afficherSitesCenca"
      (click)="filtrerZonesHumides()">
      Zones humides uniquement
    </button>
    
    <div class="sites-info" *ngIf="sitesCencaProches && afficherSitesCenca">
      <span class="badge">{{ sitesCencaProches.features.length }} sites trouvés</span>
    </div>
  </div>

  <!-- Carte avec sites CENCA conditionnels -->
  <div class="map-container">
    <app-map 
      [mapName]="'pmfu-' + (pmfu ? pmfu.pmfu_id : 'nouveau')"
      [sitesCenca]="afficherSitesCenca ? sitesCencaProches : undefined"
      style="height: 400px; width: 100%; border: 1px solid #ccc; border-radius: 4px;">
    </app-map>
  </div>
  
  <!-- Loading indicator -->
  <div *ngIf="chargementSites" class="loading-sites">
    <mat-spinner diameter="30"></mat-spinner>
    <span>Chargement des sites CENCA...</span>
  </div>
  
  <div class="step-actions">
    <button mat-button matStepperPrevious>Précédent</button>
    <button mat-button matStepperNext>Suivant</button>
  </div>
</mat-step>
```

## 🎨 Étape 4 : Styles CSS

### Ajout dans le fichier SCSS
```scss
// detail-pmfu.component.scss

.carte-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  
  mat-slide-toggle {
    margin-right: 10px;
  }
  
  .sites-info {
    margin-left: auto;
    
    .badge {
      background-color: #28a745;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
  }
}

.loading-sites {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  color: #666;
  font-size: 14px;
  
  mat-spinner {
    margin-right: 5px;
  }
}

.map-container {
  position: relative;
  
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
}
```

## 🚀 Étape 5 : Fonctionnalités avancées (optionnelles)

### Recherche de sites par proximité
```typescript
/**
 * Trouve les sites CENCA dans un rayon donné
 */
rechercherSitesProximite(rayonKm: number = 10): void {
  if (!this.pmfu || !this.sitesCencaProches) return;
  
  // Cette fonction nécessiterait l'ajout de calculs géographiques
  // avec une bibliothèque comme Turf.js pour calculer les distances
  console.log(`Recherche dans un rayon de ${rayonKm}km`);
}

/**
 * Exporte les sites trouvés
 */
exporterSitesCenca(): void {
  if (!this.sitesCencaProches) return;
  
  const data = this.sitesCencaProches.features.map(site => ({
    nom: site.properties.nomsite,
    type: site.properties.type,
    gestion: site.properties.gestiontxt,
    referent: site.properties.referent,
    surface: site.properties.surface,
    zoneHumide: site.properties.zonehumide
  }));
  
  // Ici tu peux utiliser une bibliothèque pour exporter en CSV/Excel
  console.log('Données à exporter:', data);
}
```

## 📊 Étape 6 : Indicateurs et statistiques

### Affichage de statistiques
```html
<div class="stats-sites" *ngIf="sitesCencaProches && afficherSitesCenca">
  <h4>Statistiques des sites proches</h4>
  <div class="stats-grid">
    <div class="stat-item">
      <span class="stat-value">{{ sitesCencaProches.features.length }}</span>
      <span class="stat-label">Sites total</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">{{ calculerZonesHumides() }}</span>
      <span class="stat-label">Zones humides</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">{{ calculerSurfaceTotale() }} ha</span>
      <span class="stat-label">Surface totale</span>
    </div>
  </div>
</div>
```

### Méthodes de calcul
```typescript
calculerZonesHumides(): number {
  if (!this.sitesCencaProches) return 0;
  return this.siteCencaService.filterSitesZonesHumides(this.sitesCencaProches).length;
}

calculerSurfaceTotale(): number {
  if (!this.sitesCencaProches) return 0;
  return this.siteCencaService.calculateTotalSurface(this.sitesCencaProches);
}
```

## ✅ Résultat final

Avec cette intégration, ton composant `DetailPmfuComponent` aura :

- 🗺️ **Carte enrichie** avec les sites CENCA environnants
- 🎛️ **Contrôles utilisateur** pour afficher/masquer les sites
- 📊 **Statistiques** des sites proches
- 🔍 **Filtrage** par zones humides
- ⚡ **Chargement optimisé** avec indicateurs

Les utilisateurs pourront voir le contexte écologique autour de leur projet PMFU ! 🌿

---

*Cette intégration respecte l'architecture existante et ajoute de la valeur sans complexifier l'interface.* ✨