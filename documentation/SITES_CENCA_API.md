# 📍 Documentation API Sites CENCA

Cette documentation présente l'ensemble des interfaces TypeScript et des services créés pour gérer les sites CENCA dans l'application Angular.

## 📋 Table des matières

1. [Interfaces TypeScript](#interfaces-typescript)
2. [Service SiteCencaService](#service-sitecencaservice)
3. [Composant MapComponent (Extensions)](#composant-mapcomponent-extensions)
4. [Exemples d'utilisation](#exemples-dutilisation)
5. [Types de données](#types-de-données)

---

## 🔧 Interfaces TypeScript

### `SiteCencaProperties`
Interface définissant toutes les propriétés d'un site CENCA.

```typescript
interface SiteCencaProperties {
  bassinagence: string;        // Ex: "Agence de l'Eau Seine Normandie"
  carto: number;               // Indicateur cartographique (0/1)
  codegeol: string | null;     // Code géologique (peut être null)
  codesite: string;            // Code unique du site (ex: "10VERP01")
  detail: string;              // Détail du site (ex: "Site entier")
  gestion: string;             // Code de gestion ("1", "2", "3")
  gestiontxt: string;          // Libellé de gestion (ex: "Assistance technique")
  idsite: string;              // UUID unique du site
  localisant: string;          // Nom complet localisé
  milieunat: string;           // Type de milieu naturel
  nomsite: string;             // Nom du site
  premiercontrat: number;      // Année du premier contrat
  referent: string;            // Nom du référent responsable
  rgpt: string | null;         // Code RGPT (peut être null)
  surface: number | null;      // Surface en hectares (peut être null)
  type: string;                // Type d'espace écologique
  zonehumide: string;          // "oui" ou "non"
}
```

### `SiteCencaFeature`
Feature GeoJSON spécialisée pour les sites CENCA.

```typescript
interface SiteCencaFeature extends Feature {
  id: string;                                    // ID unique de la feature
  bbox: [number, number, number, number];       // Bounding box [minX, minY, maxX, maxY]
  geometry: MultiPolygon | Polygon | Point | LineString;  // Géométrie du site
  properties: SiteCencaProperties;              // Propriétés du site
}
```

### `SiteCencaCollection`
Collection de sites CENCA compatible GeoJSON.

```typescript
interface SiteCencaCollection extends FeatureCollection {
  type: 'FeatureCollection';
  bbox: [number, number, number, number];       // Emprise globale
  features: SiteCencaFeature[];                 // Liste des sites
}
```

---

## 🛠️ Service SiteCencaService

Le service principal pour interagir avec les données des sites CENCA.

### 📥 Méthodes de récupération de données

#### `getSitesCenca$(couche?, bbox?): Observable<SiteCencaCollection>`
Récupère tous les sites CENCA depuis l'API.

**Paramètres :**
- `couche` (optionnel) : Nom de la couche (défaut: `'cenca_autres'`)
- `bbox` (optionnel) : Bounding box pour filtrer géographiquement `"minX,minY,maxX,maxY"`

**Exemple :**
```typescript
// Tous les sites
this.siteCencaService.getSitesCenca$().subscribe(sites => {
  console.log(`${sites.features.length} sites récupérés`);
});

// Sites dans une zone géographique
this.siteCencaService.getSitesCenca$('cenca_autres', '4.5,48.0,4.6,48.1')
  .subscribe(sites => {
    console.log(`Sites dans la zone : ${sites.features.length}`);
  });
```

#### `getSiteCencaById$(siteId, couche?): Observable<SiteCencaFeature | null>`
Récupère un site spécifique par son ID.

**Paramètres :**
- `siteId` : UUID du site à récupérer
- `couche` (optionnel) : Nom de la couche (défaut: `'cenca_autres'`)

**Exemple :**
```typescript
this.siteCencaService.getSiteCencaById$('01FC740E-BD03-404B-B5FD-7646A56AD0FE')
  .subscribe(site => {
    if (site) {
      console.log(`Site trouvé : ${site.properties.nomsite}`);
    }
  });
```

### 🔍 Méthodes de filtrage

#### `filterSitesByGestion(sites, typeGestion): SiteCencaFeature[]`
Filtre les sites par type de gestion.

**Types de gestion :**
- `"1"` : Gestion directe
- `"2"` : Assistance technique  
- `"3"` : Autre type

**Exemple :**
```typescript
const sitesAssistance = this.siteCencaService.filterSitesByGestion(sites, '2');
console.log(`${sitesAssistance.length} sites en assistance technique`);
```

#### `filterSitesByMilieu(sites, milieuNaturel): SiteCencaFeature[]`
Filtre les sites par type de milieu naturel.

**Exemple :**
```typescript
const sitesTourbieres = this.siteCencaService.filterSitesByMilieu(sites, 'tourbière');
console.log(`${sitesTourbieres.length} sites de tourbières`);
```

#### `filterSitesByReferent(sites, referent): SiteCencaFeature[]`
Filtre les sites par référent.

**Exemple :**
```typescript
const sitesYohann = this.siteCencaService.filterSitesByReferent(sites, 'Yohann');
console.log(`${sitesYohann.length} sites gérés par Yohann`);
```

#### `filterSitesZonesHumides(sites): SiteCencaFeature[]`
Filtre uniquement les sites qui sont des zones humides.

**Exemple :**
```typescript
const zonesHumides = this.siteCencaService.filterSitesZonesHumides(sites);
console.log(`${zonesHumides.length} zones humides`);
```

### 📊 Méthodes d'analyse

#### `calculateTotalSurface(sites): number`
Calcule la surface totale des sites en hectares.

**Exemple :**
```typescript
const surfaceTotale = this.siteCencaService.calculateTotalSurface(sites);
console.log(`Surface totale : ${surfaceTotale} ha`);
```

#### `groupSitesByGestion(sites): Record<string, SiteCencaFeature[]>`
Groupe les sites par type de gestion.

**Exemple :**
```typescript
const groupes = this.siteCencaService.groupSitesByGestion(sites);
Object.entries(groupes).forEach(([gestion, sitesList]) => {
  console.log(`${gestion} : ${sitesList.length} sites`);
});
```

#### `getUniqueReferents(sites): string[]`
Obtient la liste unique des référents.

**Exemple :**
```typescript
const referents = this.siteCencaService.getUniqueReferents(sites);
console.log(`Référents : ${referents.join(', ')}`);
```

#### `getUniqueMilieuxNaturels(sites): string[]`
Obtient la liste unique des milieux naturels.

**Exemple :**
```typescript
const milieux = this.siteCencaService.getUniqueMilieuxNaturels(sites);
console.log(`Milieux : ${milieux.join(', ')}`);
```

---

## 🗺️ Composant MapComponent (Extensions)

### Nouvelles propriétés Input

#### `@Input() sitesCenca?: SiteCencaCollection`
Permet de passer une collection de sites CENCA à afficher sur la carte.

**Exemple d'utilisation :**
```html
<app-map 
  [mapName]="'carte-pmfu'"
  [sitesCenca]="mesSitesCenca">
</app-map>
```

### Nouvelles méthodes

#### `getSitesCencaGeoJson$(couche, bbox?): Observable<SiteCencaCollection>`
Récupère les sites depuis l'API WFS directement dans le composant carte.

#### `addSitesCencaToMap(sitesCollection): void`
Ajoute les sites CENCA sur la carte avec :
- **Styles différenciés** selon le type de gestion
- **Popups détaillés** avec toutes les informations
- **Tooltips** avec le nom du site

**Styles automatiques :**
- 🟢 Vert : Gestion directe (`gestion = "1"`)
- 🟠 Orange : Assistance technique (`gestion = "2"`)  
- 🔴 Rouge : Autre type (`gestion = "3"`)
- 🔵 Bleu : Type non défini

---

## 💡 Exemples d'utilisation

### Exemple 1 : Chargement simple des sites
```typescript
export class MonComposant {
  sites?: SiteCencaCollection;

  constructor(private siteCencaService: SiteCencaService) {}

  chargerSites() {
    this.siteCencaService.getSitesCenca$().subscribe({
      next: (sites) => {
        this.sites = sites;
        console.log(`${sites.features.length} sites chargés`);
      },
      error: (error) => console.error('Erreur:', error)
    });
  }
}
```

### Exemple 2 : Filtrage et analyse
```typescript
analyserSites() {
  if (!this.sites) return;

  // Statistiques globales
  const total = this.sites.features.length;
  const surface = this.siteCencaService.calculateTotalSurface(this.sites);
  const zonesHumides = this.siteCencaService.filterSitesZonesHumides(this.sites);
  
  console.log(`📊 Analyse des sites :`);
  console.log(`- Total : ${total} sites`);
  console.log(`- Surface : ${surface} ha`);
  console.log(`- Zones humides : ${zonesHumides.length} sites`);

  // Groupement par gestion
  const groupes = this.siteCencaService.groupSitesByGestion(this.sites);
  console.log(`📋 Répartition par gestion :`);
  Object.entries(groupes).forEach(([type, sites]) => {
    console.log(`- ${type} : ${sites.length} sites`);
  });

  // Référents
  const referents = this.siteCencaService.getUniqueReferents(this.sites);
  console.log(`👥 Référents : ${referents.join(', ')}`);
}
```

### Exemple 3 : Intégration avec la carte
```typescript
// Component
export class CarteProjetComponent {
  sitesCenca?: SiteCencaCollection;
  sitesFiltered?: SiteCencaCollection;

  constructor(private siteCencaService: SiteCencaService) {}

  ngOnInit() {
    this.chargerSitesProches();
  }

  chargerSitesProches() {
    // Charger les sites dans une zone géographique
    const bbox = '4.0,48.0,5.0,49.0'; // Champagne-Ardenne
    
    this.siteCencaService.getSitesCenca$('cenca_autres', bbox)
      .subscribe(sites => {
        this.sitesCenca = sites;
        this.sitesFiltered = sites;
      });
  }

  filtrerZonesHumides() {
    if (!this.sitesCenca) return;
    
    const zonesHumides = this.siteCencaService.filterSitesZonesHumides(this.sitesCenca);
    this.sitesFiltered = {
      ...this.sitesCenca,
      features: zonesHumides
    };
  }
}
```

```html
<!-- Template -->
<div class="controls">
  <button (click)="chargerSitesProches()">Charger sites proches</button>
  <button (click)="filtrerZonesHumides()">Zones humides uniquement</button>
</div>

<app-map 
  [mapName]="'projet-pmfu'"
  [sitesCenca]="sitesFiltered">
</app-map>
```

---

## 📝 Types de données

### Codes de gestion
- `"1"` : **Gestion directe** - Sites gérés directement par CENCA
- `"2"` : **Assistance technique** - Sites avec assistance technique
- `"3"` : **Autre** - Autres types de gestion

### Types de milieux naturels courants
- `"Tourbières et marais"`
- `"Prairies humides"`
- `"Forêts"`
- `"Pelouses calcaires"`
- `"Landes"`

### Zones humides
- `"oui"` : Le site est une zone humide
- `"non"` : Le site n'est pas une zone humide

---

## 🎯 Conseils d'utilisation

### Performance
- Utilisez le paramètre `bbox` pour limiter les données récupérées
- Filtrez côté client après récupération pour éviter les appels répétés
- Mettez en cache les données récupérées

### Gestion des erreurs
```typescript
this.siteCencaService.getSitesCenca$().subscribe({
  next: (sites) => {
    // Traitement des données
  },
  error: (error) => {
    console.error('Erreur de chargement:', error);
    // Fallback ou message utilisateur
  }
});
```

### Bonnes pratiques
- Toujours vérifier que `sites` n'est pas undefined avant filtrage
- Utiliser les méthodes de filtrage du service plutôt que du filtrage manuel
- Combiner plusieurs filtres pour des analyses complexes

---

## 🚀 Extensions possibles

Le système est conçu pour être extensible. Vous pouvez facilement ajouter :
- Nouveaux filtres spécialisés
- Méthodes d'export (Excel, CSV, PDF)
- Intégrations avec d'autres APIs
- Fonctionnalités de géolocalisation
- Analyses spatiales avancées

---

*Cette documentation couvre l'ensemble des fonctionnalités développées pour la gestion des sites CENCA. N'hésitez pas à l'enrichir selon vos besoins !* 🎉