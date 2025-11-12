# 📋 DetailPmfuComponent - Schéma Visuel Simplifié

## 📋 Architecture en un coup d'œil

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DETAIL PMFU COMPONENT                         │
│                        (~770 lignes)                               │
│              Gestion Projets MFU (Maîtrise Foncière)              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DIALOG DATA   │    │   CORE LOGIC    │    │  CHILD COMPS    │
│                 │    │                 │    │                 │
│ • ProjetsMfu    │─→  │ • Forms         │ ─→ │ • MapComponent  │
│ • pmfu_id       │    │ • Files         │    │ • FileExplorer  │
│ • Mode detect   │    │ • States        │    │ • FormButtons   │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          3 MODES D'OPERATION                        │
├─────────────────┬─────────────────┬─────────────────────────────────┤
│  CONSULTATION   │     EDITION     │           CREATION              │
│                 │                 │                                 │
│ • Lecture seule │ • Formulaires   │ • Nouveau projet               │
│ • Bouton Edit   │   activés       │ • Pré-rempli utilisateur       │
│ • Bouton Delete │ • Upload files  │ • Sauvegarde → Fermeture       │
│ • Carte info    │ • Carte active  │ • Upload différé               │
└─────────────────┴─────────────────┴─────────────────────────────────┘
```

## 🔄 Flux Principal d'Utilisation

```
Ouverture Dialog
      │
      ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Analyse     │────▶│ Mode        │────▶│ Setup       │
│ Dialog Data │     │ Selection   │     │ Forms       │
└─────────────┘     └─────────────┘     └─────────────┘
                            │                   │
                            ▼                   ▼
          ┌─────────────────────────────┐ ┌─────────────┐
          │ Nouveau │ Existant │ View  │ │ UI Ready    │
          └─────────────────────────────┘ └─────────────┘
```

## 📝 Double Système de Formulaires

```
┌──────────────────┐         ┌──────────────────┐
│   PMFU FORM      │         │    DOC FORM      │
│  (Projet MFU)    │         │  (Documents)     │
├──────────────────┤         ├──────────────────┤
│ • pmfu_nom       │         │ • photos_site    │
│ • pmfu_responsable│         │ • projet_acte    │
│ • pmfu_createur  │         │ • decision_bureau│
│ • dates, etc.    │         │ • note_bureau    │
└──────────────────┘         └──────────────────┘
        │                            │
        └─────────┬──────────────────┘
                  ▼
        ┌─────────────────┐
        │  VALIDATION     │
        │  • isFormValid  │
        │  • statusChange │
        │  • realtime     │
        └─────────────────┘
```

## 📂 Système de Gestion de Fichiers

```
Upload de Fichiers
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ VALIDATION      │───▶│ STORAGE         │───▶│ ORGANISATION    │
│                 │    │                 │    │                 │
│ • Type check    │    │ • FormData      │    │ • folders[]     │
│ • Extension OK  │    │ • filesNames[]  │    │ • doc_types     │
│ • Size limit    │    │ • docForm       │    │ • Counters      │
│ • Error handling│    │ • Temp storage  │    │ • FileExplorer  │
└─────────────────┘    └─────────────────┘    └─────────────────┘

TYPES SUPPORTÉS:
┌─────────────────┬─────────────────┐
│   DOCUMENTS     │     IMAGES      │
├─────────────────┼─────────────────┤
│ • .pdf          │ • .jpg          │
│ • .doc          │ • .jpeg         │ 
│ • .docx         │ • .png          │
└─────────────────┴─────────────────┘
```

## 🗺️ Intégration Cartographique

```
┌──────────────────┐         ┌──────────────────┐
│  DETAIL PMFU     │◀──────▶ │  MAP COMPONENT   │
│   TOGGLES        │  Sync   │  LAYER CONTROL   │
├──────────────────┤         ├──────────────────┤
│ ☑️ Sites CENCA    │         │ 🌿 Sites CENCA    │
│   Autres         │         │   Autres         │
│                  │         │                  │
│ ☑️ Sites CENCA    │         │ 🟢 Sites CENCA    │
│   Sites          │         │   Sites          │
└──────────────────┘         └──────────────────┘
        │                            │
        └─────────┬──────────────────┘
                  ▼
        ┌─────────────────┐
        │  SYNC EVENTS    │
        │  • Toggle → Map │
        │  • Map → Toggle │
        │  • Real-time    │
        └─────────────────┘
```

## 💾 Workflow de Sauvegarde

```
onSubmit()
    │
    ▼
┌─────────────┐
│ MODE CHECK  │
└─────────────┘
    │
    ├─▶ NOUVEAU PROJET
    │   ├─ FormService.putBdd('insert')
    │   ├─ Dialog.close() immédiat
    │   └─ Upload async après création
    │
    └─▶ MODIFICATION
        ├─ FormService.putBdd('update')
        ├─ Upload synchrone
        ├─ setupPmfuForm() refresh
        └─ UI update
```

## 🎛️ États du Composant

```
ÉTATS PRINCIPAUX              ÉTATS FICHIERS
├─ isLoading: boolean         ├─ isDragging: boolean
├─ isEditPmfu: boolean        ├─ filesNames: string[][]
├─ newPmfu: boolean           ├─ fileErrors: Record<>
├─ isFormValid: boolean       └─ allowedTypes: Record<>
└─ pmfuTitle: string

ÉTATS DONNÉES                 ÉTATS CARTE
├─ pmfu: ProjetMfu           ├─ afficherSitesCenca: boolean
├─ projetLite: ProjetsMfu    └─ afficherSitesCencaSites: boolean
├─ folders: Section[]
└─ salaries: SelectValue[]
```

## 🔧 Services et Responsabilités

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  FONCIER        │    │     FORM        │    │    DOCFILE      │
│   SERVICE       │    │    SERVICE      │    │    SERVICE      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • getProjetMfu  │    │ • newPmfuForm   │    │ • loadDocTypes  │
│ • deletePmfu    │    │ • putBdd        │    │ • handleSubmit  │
│ • API calls     │    │ • validation    │    │ • file upload   │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐
│     LOGIN       │    │  CONFIRMATION   │
│    SERVICE      │    │    SERVICE      │
├─────────────────┤    ├─────────────────┤
│ • user()        │    │ • confirm()     │
│ • cd_salarie    │    │ • delete dialog │
│ • auth check    │    │ • custom config │
└─────────────────┘    └─────────────────┘
```

## 🔄 Cycles de Vie Critiques

### Initialisation
```
Constructor
    ├─ Injection services
    ├─ Analyse MAT_DIALOG_DATA
    └─ Assignment projetLite
            │
            ▼
ngOnInit()
    ├─ loadDocTypes()
    ├─ getSelectValues('salaries')
    ├─ Branch: nouveau vs existant
    │   ├─ SI EXISTANT: fetch() + setupPmfuForm()
    │   └─ SI NOUVEAU: newPmfuForm() + mode edit
    └─ formStatusSubscription
```

### Édition
```
toggleEditPmfu()
    ├─ simpleToggle(isEditPmfu)
    ├─ toggleFormState()
    ├─ formStatusSubscription manage
    └─ detectChanges()
```

### Suppression
```
deletePmfuConfirm()
    ├─ ConfirmationService.confirm()
    ├─ Custom dialog config
    ├─ FoncierService.deletePmfu()
    └─ dialogRef.close() si succès
```

## ⚡ Optimisations Clés

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   LOADING       │    │ CHANGE DETECT   │    │   LAZY LOAD     │
│   MANAGEMENT    │    │   OPTIMIZATION  │    │   PATTERN       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • loadingDelay  │    │ • cdr.detect    │    │ • ViewChild ?   │
│ • setTimeout    │    │ • OnPush ready  │    │ • Conditional   │
│ • UX smooth     │    │ • Manual trigger│    │ • fileExplorator│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 Validation en Cascade

```
Validation Globale
        │
        ├─▶ FORMULAIRE PRINCIPAL
        │   ├─ Angular Validators
        │   ├─ Custom rules
        │   └─ Real-time statusChanges
        │
        ├─▶ FICHIERS
        │   ├─ Type extension
        │   ├─ Size limits
        │   └─ Field-specific rules
        │
        └─▶ BUSINESS RULES
            ├─ User permissions
            ├─ Required fields
            └─ Data consistency
```

## 🚀 Workflow Complet Utilisateur

```
1. OUVERTURE DIALOG
   User click → MAT_DIALOG_DATA → Component init
                                      │
                                      ▼
2. DETECTION MODE                Mode Analysis
   Nouveau projet ← Branch → Projet existant
         │                        │
         ▼                        ▼
3. SETUP                   Create form      Load data
   Forms + UI ← ─ ─ ─ ─ ─ ─ ─ ─ ─ → Setup form
                                      │
                                      ▼
4. INTERACTION               User editing + Files + Map
   Form changes → Real-time validation → UI feedback
                                      │
                                      ▼
5. SAUVEGARDE                Submit action
   Validation OK → API call → Upload → Refresh → Success
```

---

**Métriques du Composant :**
- 🎯 **Complexité :** Très élevée (gestion projet complète)
- 📝 **Formulaires :** 2 FormGroup + validation temps réel
- 📂 **Fichiers :** 4 types + drag&drop + validation
- 🗺️ **Intégration :** Carte bidirectionnelle
- 🔄 **États :** 15+ variables synchronisées
- ⚡ **Performance :** Change detection optimisée
- 🎭 **UX :** 3 modes + transitions fluides

**Responsabilités :**
- Gestion complète projet MFU (CRUD)
- Upload et validation fichiers multiples
- Intégration cartographique CENCA
- Interface utilisateur riche et responsive
- Validation métier et technique

*Schéma généré le 17 octobre 2025*