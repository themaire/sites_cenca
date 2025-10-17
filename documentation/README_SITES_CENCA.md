# 🌿 Sites CENCA - Guide rapide

## 🚀 Démarrage rapide

### 1. Charger des sites CENCA
```typescript
// Dans votre composant
constructor(private siteCencaService: SiteCencaService) {}

chargerSites() {
  this.siteCencaService.getSitesCenca$().subscribe(sites => {
    console.log(`${sites.features.length} sites chargés ! 🎉`);
    this.mesSites = sites;
  });
}
```

### 2. Afficher sur une carte
```html
<app-map 
  [mapName]="'ma-carte'"
  [sitesCenca]="mesSites">
</app-map>
```

### 3. Filtrer les données
```typescript
// Zones humides uniquement
const zonesHumides = this.siteCencaService.filterSitesZonesHumides(sites);

// Par référent
const sitesYohann = this.siteCencaService.filterSitesByReferent(sites, 'Yohann');

// Par type de gestion
const sitesAssistance = this.siteCencaService.filterSitesByGestion(sites, '2');
```

## 📊 Statistiques rapides

```typescript
// Surface totale
const surface = this.siteCencaService.calculateTotalSurface(sites);

// Grouper par gestion
const groupes = this.siteCencaService.groupSitesByGestion(sites);

// Référents uniques
const referents = this.siteCencaService.getUniqueReferents(sites);
```

## 🎯 Fonctions principales

| Fonction | Description | Exemple |
|----------|-------------|---------|
| `getSitesCenca$()` | Charge tous les sites | `service.getSitesCenca$()` |
| `filterSitesZonesHumides()` | Filtre zones humides | `service.filterSitesZonesHumides(sites)` |
| `filterSitesByGestion()` | Filtre par gestion | `service.filterSitesByGestion(sites, '2')` |
| `calculateTotalSurface()` | Calcule surface totale | `service.calculateTotalSurface(sites)` |
| `getUniqueReferents()` | Liste des référents | `service.getUniqueReferents(sites)` |

## 🔧 Types de gestion

- **"1"** = 🟢 Gestion directe
- **"2"** = 🟠 Assistance technique  
- **"3"** = 🔴 Autre type

## 📍 Utilisation avec la carte

La carte affiche automatiquement :
- ✅ Popups avec détails du site
- ✅ Tooltips avec nom du site
- ✅ Couleurs selon type de gestion
- ✅ Géométries complètes (polygones, points, lignes)

---

Pour la documentation complète : voir `SITES_CENCA_API.md` 📚