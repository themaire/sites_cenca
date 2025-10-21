# 🗺️ MapComponent - Architecture et Chaînage des Fonctions

## 📋 Vue d'ensemble

Le `MapComponent` est le composant central de gestion cartographique de l'application CENCA. Il gère l'affichage de cartes Leaflet avec des fonctionnalités avancées de chargement dynamique de données géospatiales.

**Évolution récente :** Suppression de l'input `coucheSitesCenca` - les deux couches CENCA sont maintenant configurées directement via le Layer Control natif de Leaflet, simplifiant l'architecture.

**Statistiques du composant :**
- **Lignes de code :** ~1100 lignes
- **Méthodes publiques :** 8
- **Méthodes privées :** 25
- **Inputs :** 7
- **Outputs :** 2
- **Couches gérées :** 2 couches CENCA + fonds de plan

---

## 🏗️ Architecture Générale

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            MAP COMPONENT ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────────────────┘

[INPUTS (7)]
┌─────────────────────────────────────────────────────────────────────────────────┐
│ mapName: string                    │ Identifiant unique de la carte            │
│ localisation_site: any             │ Site unique à afficher                    │
│ localisations_operations: any[]    │ Opérations à afficher (polygones)        │
│ sitesCenca: any[]                  │ Sites CENCA statiques                     │
│ chargerSitesDynamiquement: boolean │ Active couche CENCA Autres dynamique     │
│ chargerSitesSitesDynamiquement: b. │ Active couche CENCA Sites dynamique      │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MAPCOMPONENT CORE                                 │
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │ Leaflet Map     │    │ Layer Control   │    │ Event Handlers  │            │
│  │ Configuration   │    │ Management      │    │ & Synchronization│            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │ Dynamic Loading │    │ Style & Popup   │    │ Performance     │            │
│  │ Systems         │    │ Management      │    │ Optimizations   │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
[OUTPUTS (2)]
┌─────────────────────────────────────────────────────────────────────────────────┐
│ sitesCencaToggled: EventEmitter<boolean>      │ État couche CENCA Autres      │
│ sitesCencaSitesToggled: EventEmitter<boolean> │ État couche CENCA Sites       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
[EXTERNAL SERVICES]
┌─────────────────────────────────────────────────────────────────────────────────┐
│ SiteCencaService                   │ HttpClient                │ Leaflet Map    │
│ • getSitesCenca$()                 │ • API calls               │ • Rendering    │
│ • Data transformation              │ • Error handling          │ • Events       │
│ • Cache management                 │ • Request optimization    │ • Controls     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Cycle de Vie du Composant

### 1. Initialisation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       COMPONENT INITIALIZATION SEQUENCE                        │
└─────────────────────────────────────────────────────────────────────────────────┘

User ─┐    Component ─┐    Map ─┐    Service ─┐
      │              │         │             │
      │ Navigate to  │         │             │
      │ component ──▶│         │             │
      │              │ ngAfter │             │
      │              │ ViewInit() ─────────▶ │
      │              │         │ Création    │
      │              │ initMap()│ carte ─────▶│
      │              │ ◀───────│ Leaflet     │
      │              │         │             │
      │              │ setup   │ Config      │
      │              │ Layer   │ couches ───▶│
      │              │ Control()│ de base     │
      │              │ ◀───────│             │
      │              │         │             │
      │              │ setup   │ Activation  │
      │              │ Dynamic │ événements ▶│
      │              │ Loading()│             │
      │              │ ◀───────│             │ Chargement
      │              │         │             │ initial ──▶ 📁
      │              │         │             │ données    │
      │              │ ◀───────│ ◀───────────│ ◀──────────
```

### 2. Chaînage des Fonctions d'Initialisation

```
ngAfterViewInit()
    └── initMap()
        ├── Configuration Leaflet
        ├── Création des fonds de plan (IGN, Google, OSM)
        ├── setupLayerControl()
        │   ├── Création sitesCencaLayer
        │   ├── Création sitesCencaSitesLayer
        │   └── Configuration L.control.layers()
        ├── Gestionnaires d'événements layer control
        │   ├── overlayadd → sitesCencaToggled.emit()
        │   └── overlayremove → sitesCencaToggled.emit()
        ├── Activation par défaut des couches
        ├── setupDynamicSitesLoading()
        └── setupDynamicSitesSitesLoading()
```

---

## 🌿 Système de Chargement Dynamique - Couche CENCA Autres

### Chaînage des Fonctions

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DYNAMIC SITES LOADING CHAIN (CENCA AUTRES)                  │
└─────────────────────────────────────────────────────────────────────────────────┘

[1] SETUP PHASE
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ setupDynamic    │───▶│ Map Events      │───▶│ Event Listeners │
│ SitesLoading()  │    │ Registration    │    │ Active          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Configuration:                                                  │
│ • map.on('moveend', onMapViewChanged)                          │
│ • map.on('zoomend', onMapViewChanged)                          │
│ • Timeout et debounce preparation                              │
└─────────────────────────────────────────────────────────────────┘

[2] TRIGGER PHASE
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ User Moves/     │───▶│ onMapView       │───▶│ Debounce        │
│ Zooms Map       │    │ Changed()       │    │ Timer (500ms)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
[3] LOADING PHASE                              ┌─────────────────┐
┌─────────────────┐    ┌─────────────────┐    │ loadSitesIn     │
│ siteCencaService│◀───│ API Call with   │◀───│ CurrentView()   │
│ .getSitesCenca$ │    │ BBox Parameters │    └─────────────────┘
└─────────────────┘    └─────────────────┘            │
        │                       │                     ▼
        ▼                       ▼              ┌─────────────────┐
┌─────────────────┐    ┌─────────────────┐    │ GeoJSON Response│
│ HTTP Request    │    │ Error Handling  │    │ Processing      │
│ to Lizmap API   │    │ & Retry Logic   │    └─────────────────┘
└─────────────────┘    └─────────────────┘            │
                                                       ▼
[4] RENDERING PHASE
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ updateSites     │───▶│ addSitesCenca   │───▶│ Layer Update    │
│ CencaLayer()    │    │ ToLayer()       │    │ Complete        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Clear Existing  │    │ getSiteCenca    │    │ Popup & Tooltip │
│ Features        │    │ Style()         │    │ addSiteCenca... │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Détail des Méthodes

| Méthode | Rôle | Déclencheur |
|---------|------|-------------|
| `setupDynamicSitesLoading()` | Configuration initiale des événements | Initialisation |
| `onMapViewChanged()` | Détection changement de vue | moveend/zoomend |
| `loadSitesInCurrentView()` | Chargement données API | Débounce timer |
| `updateSitesCencaLayer()` | Mise à jour couche | Réponse API |
| `addSitesCencaToLayer()` | Ajout features à la couche | Données reçues |
| `getSiteCencaStyle()` | Style selon gestion | Rendu feature |
| `addSiteCencaPopupAndTooltip()` | Interactions utilisateur | Rendu feature |

---

## 🟢 Système de Chargement Dynamique - Couche CENCA Sites

### Chaînage des Fonctions (Parallèle)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                 DYNAMIC SITES SITES LOADING CHAIN (CENCA SITES)                │
└─────────────────────────────────────────────────────────────────────────────────┘

[1] PARALLEL SETUP PHASE
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ setupDynamic    │───▶│ Independent     │───▶│ Sites-Specific  │
│ SitesSites      │    │ Event Setup     │    │ Event Listeners │
│ Loading()       │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Configuration (Separate from Autres):                          │
│ • map.on('moveend', onMapViewChangedSites)                     │
│ • map.on('zoomend', onMapViewChangedSites)                     │
│ • Independent timeout: loadingTimeoutSites                     │
└─────────────────────────────────────────────────────────────────┘

[2] TRIGGER PHASE (Independent)
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ User Moves/     │───▶│ onMapView       │───▶│ Debounce        │
│ Zooms Map       │    │ ChangedSites()  │    │ Timer (500ms)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
[3] LOADING PHASE (Different API)              ┌─────────────────┐
┌─────────────────┐    ┌─────────────────┐    │ loadSitesSites  │
│ siteCencaService│◀───│ API Call to     │◀───│ InCurrentView() │
│ getSitesCenca$  │    │ 'cenca_sites'   │    └─────────────────┘
│ ('cenca_sites') │    │ Layer           │            │
└─────────────────┘    └─────────────────┘            ▼
        │                       │              ┌─────────────────┐
        ▼                       ▼              │ Green Sites     │
┌─────────────────┐    ┌─────────────────┐    │ GeoJSON Data    │
│ Different API   │    │ Error Handling  │    └─────────────────┘
│ Endpoint        │    │ & Retry Logic   │            │
└─────────────────┘    └─────────────────┘            ▼

[4] RENDERING PHASE (Green Styling)
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ updateSites     │───▶│ addSitesCenca   │───▶│ Green Layer     │
│ CencaSites      │    │ SitesToLayer()  │    │ Update Complete │
│ Layer()         │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Clear Sites     │    │ getSitesCenca   │    │ Green Popup &   │
│ Features        │    │ SitesStyle()    │    │ Tooltip Setup   │
│                 │    │ (Always Green)  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘

[DIFFERENCES FROM CENCA AUTRES]
┌─────────────────────────────────────────────────────────────────────────────────┐
│ • API Layer: 'cenca_sites' instead of 'cenca_autres'                           │
│ • Color Strategy: Fixed green (#28a745) instead of dynamic colors              │
│ • Variable Names: All suffixed with 'Sites' (isLoadingSitesSites, etc.)       │
│ • Event Handlers: Separate methods (onMapViewChangedSites)                     │
│ • Independent State: Completely separate from CENCA Autres layer              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Spécificités Couche Sites

- **Couleur fixe :** Toujours verte (`#28a745`)
- **Couche API :** `cenca_sites` au lieu de `cenca_autres`
- **Variables séparées :** `isLoadingSitesSites`, `lastBboxSites`, etc.
- **Fonctions parallèles :** Fonctionnement indépendant de la première couche

---

## 🔄 Système de Synchronisation Bidirectionnelle

### Layer Control ↔ Toggles HTML

```
BIDIRECTIONAL SYNCHRONIZATION BETWEEN LAYER CONTROL AND HTML TOGGLES

[ACTIVATION VIA LAYER CONTROL]
Layer Control         MapComponent         Parent Component      HTML Toggles
      │                     │                      │                   │
      │ overlayadd event    │                      │                   │
      ├────────────────────▶│                      │                   │
      │                     │ chargerSitesDynami-  │                   │
      │                     │ quement = true       │                   │
      │                     ├─────────────────────▶│                   │
      │                     │                      │                   │
      │                     │ setupDynamicSites    │                   │
      │                     │ Loading()            │                   │
      │                     │                      │                   │
      │                     │ sitesCencaToggled    │ afficherSitesCenca│
      │                     │ .emit(true)          │ = true            │
      │                     ├─────────────────────▶├──────────────────▶│
      │                     │                      │                   │

[ACTIVATION VIA HTML TOGGLE]
HTML Toggles          Parent Component     MapComponent         Layer Control
      │                     │                      │                   │
      │ toggleSitesCenca()  │                      │                   │
      ├────────────────────▶│                      │                   │
      │                     │ synchronizeSitesCenca│                   │
      │                     │ Layer(true)          │                   │
      │                     ├─────────────────────▶│                   │
      │                     │                      │ sitesCencaLayer   │
      │                     │                      │ .addTo(map)       │
      │                     │                      ├──────────────────▶│
      │                     │                      │                   │
      │                     │                      │ setupDynamicSites │
      │                     │                      │ Loading()         │
      │                     │                      │                   │

KEY MECHANISMS:
• EventEmitter: sitesCencaToggled.emit() and sitesSitesToggled.emit()
• Layer Events: overlayadd/overlayremove from Leaflet Layer Control
• State Sync: synchronizeSitesCencaLayer() method handles component→control
• Dynamic Setup: setupDynamicSitesLoading() activates after each activation
```

---

## 📊 Méthodes par Catégorie

### 🔧 Méthodes d'Initialisation
- `ngAfterViewInit()` - Point d'entrée du cycle de vie
- `initMap()` - Configuration principale de la carte
- `resetMapView()` - Vue par défaut Champagne-Ardenne

### 🌿 Couche CENCA Autres (Colorée)
- `setupDynamicSitesLoading()` - Configuration des événements
- `onMapViewChanged()` - Détection changement vue
- `loadSitesInCurrentView()` - Chargement API
- `updateSitesCencaLayer()` - Mise à jour couche
- `addSitesCencaToLayer()` - Ajout features
- `getSiteCencaStyle()` - Style selon gestion
- `addSiteCencaPopupAndTooltip()` - Interactions
- `reloadSitesInCurrentView()` - Rechargement forcé
- `toggleDynamicSitesLoading()` - Activation/désactivation

### 🟢 Couche CENCA Sites (Verte)
- `setupDynamicSitesSitesLoading()` - Configuration des événements
- `onMapViewChangedSites()` - Détection changement vue
- `loadSitesSitesInCurrentView()` - Chargement API
- `updateSitesCencaSitesLayer()` - Mise à jour couche
- `addSitesCencaSitesToLayer()` - Ajout features
- `getSiteCencaSitesStyle()` - Style vert fixe
- `addSiteCencaSitesPopupAndTooltip()` - Interactions vertes
- `reloadSitesSitesInCurrentView()` - Rechargement forcé
- `toggleDynamicSitesSitesLoading()` - Activation/désactivation

### 🔄 Synchronisation
- `synchronizeSitesCencaLayer()` - Sync couche autres
- `synchronizeSitesCencaSitesLayer()` - Sync couche sites

### 🎨 Utilitaires
- `getRandomColorName()` - Générateur couleurs opérations
- `zoomToBounds()` - Navigation vers emprise
- `addPolygonToMap()` - Ajout polygones opérations
- `getSitesCencaGeoJson$()` - API WFS directe
- `addSitesCencaToMap()` - Ajout sites statiques

---

## 🗂️ Variables d'État

### Couche CENCA Autres
```typescript
private sitesCencaLayer?: L.LayerGroup;
private isLoadingSites: boolean = false;
private lastBbox?: string;
private loadingTimeout?: any;
```

### Couche CENCA Sites
```typescript
private sitesCencaSitesLayer?: L.LayerGroup;
private isLoadingSitesSites: boolean = false;
private lastBboxSites?: string;
private loadingTimeoutSites?: any;
```

### État Global
```typescript
@Input() chargerSitesDynamiquement: boolean = false;
@Input() chargerSitesSitesDynamiquement: boolean = false;
private map!: L.Map;
```

---

## ⚡ Optimisations Implémentées

### 1. Débounce des Requêtes
- **Délai :** 500ms après dernier mouvement
- **Objectif :** Éviter surcharge serveur lors de navigation rapide

### 2. Cache de Bbox
- **Variables :** `lastBbox`, `lastBboxSites`
- **Objectif :** Éviter rechargement zone identique

### 3. États de Chargement
- **Variables :** `isLoadingSites`, `isLoadingSitesSites`
- **Objectif :** Prévenir requêtes multiples simultanées

### 4. Couches Séparées
- **Architecture :** Deux LayerGroup indépendants
- **Objectif :** Gestion indépendante activation/désactivation

### 5. 🔒 **Protection des Popups (Octobre 2025)**
- **Variable :** `hasOpenPopup: boolean = false`
- **Problème résolu :** Popups qui disparaissaient après 0.5s
- **Cause :** Rechargement automatique des couches effaçait les éléments DOM
- **Solution :** Suspension intelligente des rechargements pendant affichage popup

**Mécanisme de protection :**
```typescript
// Vérification dans toutes les méthodes onMapViewChanged*()
if (this.hasOpenPopup) {
  console.log('🔒 Popup ouverte - rechargement suspendu');
  return;
}

// Suivi automatique dans chaque addXXXPopupAndTooltip()
layer.on('popupopen', () => {
  this.hasOpenPopup = true;
  console.log('🔓 Popup XXX ouverte - rechargements suspendus');
});

layer.on('popupclose', () => {
  this.hasOpenPopup = false;
  console.log('🔒 Popup XXX fermée - rechargements autorisés');
});
```

**Bénéfices UX :**
- ✅ Popups stables et lisibles
- ✅ Pas de clignotement/disparition
- ✅ Navigation fluide même si popup bouge légèrement la carte
- ✅ Rechargements automatiques reprennent après fermeture

---

## 🎯 Points d'Extension

### Ajouter une Nouvelle Couche Dynamique

1. **Variables d'état :**
```typescript
private nouvelleCoucheLayer?: L.LayerGroup;
private isLoadingNouvelleCouche: boolean = false;
private lastBboxNouvelleCouche?: string;
private loadingTimeoutNouvelleCouche?: any;
```

2. **Méthodes à implémenter :**
- `setupDynamicNouvelleCoucheLoading()`
- `onMapViewChangedNouvelleCouche()`
- `loadNouvelleCoucheInCurrentView()`
- `updateNouvelleCoucheLayer()`
- `addNouvelleCoucheToLayer()`

3. **Ajout au layer control :**
```typescript
const overlayMaps = {
  '🌿 Sites CENCA Autres': this.sitesCencaLayer,
  '🟢 Sites CENCA Sites': this.sitesCencaSitesLayer,
  '🔵 Nouvelle Couche': this.nouvelleCoucheLayer
};

// Configuration automatique - plus besoin d'input pour le nom de couche
L.control.layers(baseMaps, overlayMaps).addTo(this.map);
```

---

## 📋 Bonnes Pratiques Observées

1. **Séparation des responsabilités :** Chaque couche a ses propres méthodes
2. **Gestion d'erreurs :** Try/catch et observables avec catchError
3. **Performance :** Débounce et cache pour optimiser les requêtes
4. **Synchronisation :** EventEmitter pour communication parent-enfant
5. **Types forts :** Interfaces TypeScript pour toutes les données
6. **Logging :** Console.log avec emojis pour debug facile

---

## 🔧 Maintenance et Debug

### Logs Principaux
- `🔄` Configuration/rechargement
- `🌍` Chargement données
- `✅` Succès opération
- `❌` Erreurs
- `🚫` Opération annulée
- `🔵🔴` Activation/désactivation layer control

### Points de Debug Importants

1. Vérifier `chargerSitesDynamiquement` et `chargerSitesSitesDynamiquement`
2. Contrôler états `isLoadingSites` et `isLoadingSitesSites`
3. Vérifier cohérence `lastBbox` et `lastBboxSites`
4. Surveiller timeouts actifs
5. **Nouveau :** Vérifier `hasOpenPopup` si rechargements inattendus

---

*Documentation mise à jour le 19 octobre 2025*

*MapComponent v2.1 - Architecture avec protection des popups*