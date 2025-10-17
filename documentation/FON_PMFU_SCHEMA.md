# 📋 FonPmfuComponent - Schéma Visuel Simplifié

## 📋 Architecture en un coup d'œil

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FON PMFU COMPONENT                            │
│                       (~230 lignes)                                │
│                   Liste Projets MFU Parent                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API SERVICE   │    │   CORE TABLE    │    │   CHILD DIALOG  │
│                 │    │                 │    │                 │
│ • FoncierService│─→  │ • MatTable      │ ─→ │ • DetailPmfu    │
│ • getProjetsMfu │    │ • Search        │    │ • Modal Dialog  │
│ • Async calls   │    │ • Sort/Paginate │    │ • CRUD Complete │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        RESPONSABILITÉS                             │
├─────────────────┬─────────────────┬─────────────────────────────────┤
│   NAVIGATION    │    LISTING      │        ORCHESTRATION            │
│                 │                 │                                 │
│ • Liste projets │ • Recherche     │ • Ouverture dialogues          │
│ • Sélection     │ • Tri colonnes  │ • Gestion refresh               │
│ • Actions       │ • Pagination    │ • Communication parent/enfant  │
└─────────────────┴─────────────────┴─────────────────────────────────┘
```

## 🔄 Flux Principal d'Utilisation

```
Chargement Initial
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ API Call    │────▶│ MatTable    │────▶│ User        │
│ ProjetsMfu[]│     │ + Controls  │     │ Interaction │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Dialog      │◀────│ Row Click / │◀────│ Search/Sort/│
│ Management  │     │ Add Button  │     │ Navigate    │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 📊 Architecture MatTable Complète

```
                        ┌─────────────────┐
                        │   API DATA      │
                        │ ProjetsMfu[]    │
                        └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   RECHERCHE     │───▶│ MATTABLEDATASRC │◀───│    TRI/ORDRE    │
│                 │    │                 │    │                 │
│ • Input field   │    │ • filterValue   │    │ • MatSort       │
│ • Real-time     │    │ • Auto filter   │    │ • Custom access │
│ • HighlightPipe │    │ • cleanString() │    │ • Multi-column  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │   PAGINATION    │
                    │                 │
                    │ • MatPaginator  │
                    │ • French labels │
                    │ • firstPage()   │
                    └─────────────────┘
```

## 🎭 Gestion des Dialogues

```
User Action
     │
     ▼
┌──────────────────┐         ┌──────────────────┐
│   EXISTING       │         │      NEW         │
│   PROJECT        │         │    PROJECT       │
├──────────────────┤         ├──────────────────┤
│ • Click row      │         │ • Add button     │
│ • data: ProjetMfu│         │ • data: ''       │
│ • Size: 90vw×85vh│         │ • Size: 50vw×70vh│
│ • Mode: View/Edit│         │ • Mode: Create   │
└──────────────────┘         └──────────────────┘
        │                            │
        └─────────┬──────────────────┘
                  ▼
        ┌─────────────────┐
        │ DETAIL PMFU     │
        │   COMPONENT     │
        ├─────────────────┤
        │ • Full CRUD     │
        │ • File upload   │
        │ • Map integrate │
        │ • Form validate │
        └─────────────────┘
                  │
                  ▼
        ┌─────────────────┐
        │ AFTER CLOSED    │
        │                 │
        │ • ngOnChanges() │
        │ • Refresh data  │
        │ • Update table  │
        └─────────────────┘
```

## 🔍 Système de Recherche Avancé

```
User Type in Search
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ INPUT CAPTURE   │───▶│ STRING CLEAN    │───▶│ APPLY FILTER    │
│                 │    │                 │    │                 │
│ • Event/String  │    │ • cleanString() │    │ • dataSource    │
│ • Value extract │    │ • normalize     │    │ • auto-filter   │
│ • toLowerCase() │    │ • multiple      │    │ • firstPage()   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                            ┌─────────────────┐
                                            │ HIGHLIGHT       │
                                            │                 │
                                            │ • HighlightPipe │
                                            │ • <span class>  │
                                            │ • SafeHtml      │
                                            └─────────────────┘

cleanString() Function:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ " Hello   World"│───▶│ "Hello World"   │───▶│ "hello world"   │
│ Multiple spaces │    │ Trim borders    │    │ Lowercase all   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎨 HighlightPipe Personnalisé

```
PIPE WORKFLOW:
Input: "Project Name" + search: "proj"
     │
     ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ REGEX CREATION  │───▶│ STRING REPLACE  │───▶│ SECURITY BYPASS │
│                 │    │                 │    │                 │
│ /(proj)/gi      │    │ <span class=    │    │ bypassSecurity  │
│ Global+IgnoreCase│    │ "highlight">    │    │ TrustHtml       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                            ┌─────────────────┐
                                            │ HTML OUTPUT     │
                                            │                 │
                                            │ <span class=    │
                                            │ "highlight">    │
                                            │ Proj</span>ect  │
                                            └─────────────────┘
```

## 🔄 États du Composant

```
ÉTATS PRINCIPAUX              DONNÉES TABLEAU
├─ isAddPmfu: boolean         ├─ pmfuLite: ProjetsMfu[]
├─ isEditPmfu: boolean        ├─ dataSource: MatTableDataSource
├─ filterValue: string        ├─ displayedColumns: string[]
└─ (modes inline futurs)      └─ paginator/sort: ViewChild

FORMULAIRES (STUBS)           CONFIGURATION
├─ pmfuForm: FormGroup        ├─ dialogConfig
├─ initialFormValues          ├─ backdropClass
└─ (inline editing future)    └─ animations
```

## 🔧 Services et Responsabilités

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  FONCIER        │    │     FORM        │    │    MATERIAL     │
│   SERVICE       │    │    SERVICE      │    │   SERVICES      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • getProjetsMfu │    │ • simpleToggle  │    │ • MatDialog     │
│ • API calls     │    │ • toggleForm    │    │ • Overlay       │
│ • Async/await   │    │ • (stubs only)  │    │ • Scroll strat  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Workflow Complet Utilisateur

```
1. CHARGEMENT INITIAL
   ngOnInit() → API call → initDataSource() → MatTable ready
                                      │
                                      ▼
2. NAVIGATION & RECHERCHE        User interaction
   Search input ← ─ ─ ─ ─ ─ ─ ─ ─ ─ → Table filter
   Sort columns ← ─ ─ ─ ─ ─ ─ ─ ─ ─ → Data reorder  
   Pagination ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ → Page change
                                      │
                                      ▼
3. SÉLECTION & ACTION            Row click / Add button
   onSelect() → openDialog() → DetailPmfuComponent
                                      │
                                      ▼
4. GESTION PROJET               CRUD operations in dialog
   Create/Read/Update/Delete → Save → afterClosed()
                                      │
                                      ▼
5. REFRESH AUTOMATIQUE          ngOnChanges() → API refresh
   New data → initDataSource() → Table updated → User feedback
```

## ⚡ Patterns de Performance

```
OPTIMISATIONS PRÉSENTES:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  ASYNC LOADING  │    │ CHANGE DETECT   │    │  VIEWCHILD      │
│                 │    │                 │    │   MANAGEMENT    │
│ • async/await   │    │ • Manual cdr    │    │ • AfterViewInit │
│ • Non-blocking  │    │ • detectChanges │    │ • Proper attach │
│ • Error handling│    │ • When needed   │    │ • Sort/Paginate │
└─────────────────┘    └─────────────────┘    └─────────────────┘

AMÉLIORATIONS POSSIBLES:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ SERVER PAGING   │    │ SEARCH DEBOUNCE │    │ LAZY LOADING    │
│                 │    │                 │    │                 │
│ • Pagination    │    │ • 300ms delay   │    │ • Dynamic       │
│   côté serveur  │    │ • Avoid spam    │    │   imports       │
│ • Large datasets│    │ • RxJS operator │    │ • Code splitting│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 Comparaison Parent vs Enfant

```
                    PARENT              ENFANT
                 FonPmfuComponent    DetailPmfuComponent
                       │                    │
    COMPLEXITÉ ────────┼── Modéré          │── Très élevé
                       │ (230 lignes)      │ (770 lignes)
                       │                   │
    RESPONSABILITÉ ────┼── Liste/Nav       │── CRUD complet
                       │ Navigation        │ Édition détaillée
                       │                   │
    FORMULAIRES ───────┼── Stubs           │── 2 FormGroup
                       │ Inline future     │ Validation avancée
                       │                   │
    FICHIERS ──────────┼── Aucun           │── Upload/validation
                       │                   │ Drag & drop
                       │                   │
    CARTE ─────────────┼── Aucune          │── Intégration 
                       │                   │ bidirectionnelle
                       │                   │
    SERVICES ──────────┼── 1 principal     │── 5+ services
                       │ FoncierService    │ Multiples
```

---

**Métriques du Composant :**
- 🎯 **Rôle :** Container/Smart Component (Liste)
- 📊 **Complexité :** Modérée (bien maîtrisée)
- 🔄 **États :** Simples et clairs
- 📱 **UI :** Material Design cohérent
- ⚡ **Performance :** Optimisée pour le rôle
- 🔗 **Couplage :** Faible (séparation responsabilités)

**Architecture :**
- ✅ Pattern Container/Presentational respecté
- ✅ Responsabilité unique bien définie
- ✅ Communication parent/enfant claire
- ✅ Réutilisabilité et maintenabilité
- ✅ Extension possible (stubs préparés)

**Évaluation Stagiaire :** 
**Note : 8/10** - Bon composant parent, bien structuré pour son rôle de liste/navigation. Les stubs montrent une réflexion sur l'architecture future.

*Schéma généré le 17 octobre 2025*