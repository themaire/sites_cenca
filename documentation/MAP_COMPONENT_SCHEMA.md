# 🗺️ MapComponent - Schéma Simplifié

## 📋 Architecture en un coup d'œil

```
┌─────────────────────────────────────────────────────────────────────┐
│                            MAP COMPONENT                            │
│                          (~1100 lignes)                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   INPUTS (7)    │    │  CORE METHODS   │    │  OUTPUTS (2)    │
│                 │    │                 │    │                 │
│ • mapName       │    │ • initMap()     │    │ • sitesCenca    │
│ • localisation  │─→  │ • setup...()    │ ─→ │   Toggled       │
│ • sitesCenca    │    │ • load...()     │    │ • sitesCenca    │
│ • charger...    │    │ • update...()   │    │   SitesToggled  │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        COUCHES LEAFLET                             │
├─────────────────┬─────────────────┬─────────────────┬─────────────────┤
│  FONDS DE PLAN  │  CENCA AUTRES   │  CENCA SITES    │   OPERATIONS    │
│                 │                 │                 │                 │
│ • IGN OrthoPhoto│ • Dynamique     │ • Dynamique     │ • Statiques     │
│ • Google Sat    │ • Coloré        │ • Vert fixe     │ • Colorées      │
│ • OpenStreetMap │ • BBox API      │ • BBox API      │ • Surfaces      │
│ • LIDAR MNT/MNS │ • Débounce 500ms│ • Débounce 500ms│ • Tooltips      │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

## 🔄 Flux de Données Principal

```
User Move Map
      │
      ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ moveend/    │────▶│ Débounce    │────▶│ API Call    │
│ zoomend     │     │ 500ms       │     │ + BBox      │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Style &     │◀────│ Add to      │◀────│ GeoJSON     │
│ Popup       │     │ Layer       │     │ Response    │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 🎛️ Contrôles Utilisateur

```
┌──────────────────┐         ┌──────────────────┐
│  LAYER CONTROL   │◀──────▶ │  HTML TOGGLES    │
│   (Leaflet)      │  Sync   │  (Parent Comp)   │
├──────────────────┤         ├──────────────────┤
│ ☑️ Sites CENCA    │         │ ☑️ Afficher Sites │
│   Autres         │         │   CENCA          │
│                  │         │                  │
│ ☑️ Sites CENCA    │         │ ☑️ Afficher Sites │
│   Sites          │         │   CENCA Sites    │
└──────────────────┘         └──────────────────┘
        │                            │
        └─────────┬──────────────────┘
                  ▼
        ┌─────────────────┐
        │  ÉVÉNEMENTS     │
        │  • overlayadd   │
        │  • overlayremove│
        │  • emit()       │
        └─────────────────┘
```

## 🔧 Méthodes Clés par Couche

### CENCA Autres (Colorée)
```
setupDynamicSitesLoading()
        │
        ▼
onMapViewChanged() ─┐
        │           │ (Débounce)
        ▼           │
loadSitesInCurrentView() ◀─┘
        │
        ▼
updateSitesCencaLayer()
        │
        ▼
addSitesCencaToLayer()
        │
        ├─▶ getSiteCencaStyle() ────┐
        │                          │ (Par feature)
        └─▶ addSiteCencaPopup() ────┘
```

### CENCA Sites (Verte)  
```
setupDynamicSitesSitesLoading()
        │
        ▼
onMapViewChangedSites() ─┐
        │                │ (Débounce)
        ▼                │
loadSitesSitesInCurrentView() ◀─┘
        │
        ▼
updateSitesCencaSitesLayer()
        │
        ▼
addSitesCencaSitesToLayer()
        │
        ├─▶ getSiteCencaSitesStyle() ──┐
        │                              │ (Toujours vert)
        └─▶ addSiteCencaSitesPopup() ───┘
```

## 💾 Variables d'État Importantes

```
COUCHE AUTRES          COUCHE SITES          GLOBAL
├─ sitesCencaLayer     ├─ sitesCencaSitesLayer ├─ map: L.Map
├─ isLoadingSites      ├─ isLoadingSitesSites  ├─ chargerSites...
├─ lastBbox           ├─ lastBboxSites        └─ coucheSitesCenca
└─ loadingTimeout     └─ loadingTimeoutSites
```

## 🎯 Points de Performance

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DÉBOUNCE      │    │     CACHE       │    │   ÉTATS        │
│                 │    │                 │    │                │
│ • 500ms delay   │    │ • lastBbox      │    │ • isLoading    │
│ • Évite spam    │    │ • Évite reload  │    │ • Évite double │
│   requêtes      │    │   même zone     │    │   requête      │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ POPUP TRACKING │    │ UX PROTECTION   │    │ SMART RELOAD    │
│                 │    │                 │    │                │
│ • hasOpenPopup  │    │ • Popup stable  │    │ • Auto-resume   │
│ • Event-based   │    │ • Pas de flash  │    │ • après close   │
│ • Layer-aware   │    │ • UX fluide     │    │ • Intelligent   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔒 **Nouveauté 2025 : Protection des Popups**

**Problème résolu :** Les popups disparaissaient après 0.5s à cause du rechargement automatique des couches qui effaçait les éléments DOM.

**Solution implémentée :**

```typescript
private hasOpenPopup = false; // Variable de suivi globale

// Dans chaque méthode onMapViewChanged*()
if (this.hasOpenPopup) {
  console.log('🔒 Popup ouverte - rechargement suspendu');
  return;
}

// Dans chaque addXXXPopupAndTooltip()
layer.on('popupopen', () => {
  this.hasOpenPopup = true;
  console.log('🔓 Popup XXX ouverte - rechargements suspendus');
});

layer.on('popupclose', () => {
  this.hasOpenPopup = false;
  console.log('🔒 Popup XXX fermée - rechargements autorisés');
});
```

**Couches protégées :** Sites CENCA Autres, Sites CENCA Sites, Parcelles cadastrales ✅

## 🚀 Workflow Complet

```
1. INIT
   ngAfterViewInit() → initMap() → Setup couches
                                      │
                                      ▼
2. EVENTS                        Layer Control
   moveend/zoomend → Débounce → API Calls
                                      │
                                      ▼
3. DATA                          GeoJSON Response
   Style + Popup → Leaflet Layer → User Interaction
                                      │
                                      ▼
4. SYNC                          Parent Component
   Events emit() → HTML Updates → Toggle Sync
```

---

**Métriques du Composant :**

- 🎯 **Complexité :** Élevée (1100+ lignes)
- 🔄 **États gérés :** 12 variables privées
- 🌐 **API calls :** 2 couches dynamiques
- ⚡ **Performance :** Optimisée (débounce + cache)
- 🔗 **Couplage :** Faible (EventEmitter)
- 📥 **Inputs :** 7 propriétés configurables

*Schéma généré le 19 octobre 2025*