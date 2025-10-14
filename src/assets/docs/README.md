# Système de Documentation Utilisateur

Ce système permet d'intégrer facilement de la documentation utilisateur en format Markdown dans l'application Angular.

## Structure

```
src/
├── assets/
│   └── docs/                     # Fichiers Markdown de documentation
│       ├── index.json            # ⭐ Configuration dynamique des sections
│       ├── index.md              # Page d'accueil de l'aide
│       ├── getting-started.md    # Guide de démarrage
│       ├── sites-management.md   # Gestion des sites
│       ├── faq.md               # Questions fréquentes
│       ├── .map-usage.md         # Fichier draft (convention POSIX)
│       └── .draft-*.md          # Autres fichiers draft
└── app/
    ├── aide/                    # Dossier du composant aide
    │   ├── aide.component.ts    # Composant principal (Observable-based)
    │   └── aide.component.spec.ts # Tests du composant
    └── services/
        ├── documentation.service.ts      # Service Observable pour MD
        └── documentation.service.spec.ts # Tests du service
```

## Fonctionnalités

### Service DocumentationService

- **Chargement dynamique** via `index.json` (plus de sections codées en dur !)
- **Architecture Observable** (RxJS) pour un chargement asynchrone
- **Filtrage contextuel** selon l'état d'authentification (`requireAuth`)
- **Conversion automatique** du Markdown en HTML avec la librairie `marked`
- **Filtrage automatique** des fichiers draft (convention POSIX)
- **Gestion d'erreurs** robuste et états de chargement

### Composant AideComponent

- **Interface Material Design** avec sidebar de navigation
- **Affichage responsive** (mobile et desktop)
- **Navigation par URL** (`/aide/:section`)
- **Indicateur de chargement** pendant le parsing
- **Styles personnalisés** pour le rendu Markdown
- **Support complet** des Observables Angular

## Utilisation

### Accès à l'aide utilisateur
- URL directe : `/aide`
- URL avec section : `/aide/getting-started`
- Bouton "Aide" vert dans le header (accessible sans authentification)

### Gestion des fichiers draft (Convention POSIX)

Le système utilise la convention POSIX pour gérer les fichiers en cours de rédaction :

#### Fichiers publiés (visibles dans l'aide)
- `index.md` → Visible dans la navigation
- `getting-started.md` → Visible dans la navigation
- `faq.md` → Visible dans la navigation

#### Fichiers draft (cachés)
- `.draft-nouvelle-section.md` → **Non visible** dans la navigation
- `.work-in-progress.md` → **Non visible** dans la navigation
- `.template-example.md` → **Non visible** dans la navigation

#### Workflow de publication

1. **Créer un draft**
   ```bash
   touch /src/assets/docs/.draft-ma-nouvelle-section.md
   ```

2. **Rédiger le contenu** dans le fichier `.draft-*`

3. **Publier le fichier**

   ```bash
   mv .draft-ma-nouvelle-section.md ma-nouvelle-section.md
   ```

4. **Ajouter dans index.json**

   ```json
   {
     "id": "ma-section",
     "title": "Ma nouvelle section", 
     "path": "ma-nouvelle-section.md",
     "order": 6,
     "published": true,
     "requireAuth": false
   }
   ```

### ⭐ Nouveau : Système de chargement dynamique

**Fini les sections codées en dur !** Le système utilise maintenant `/assets/docs/index.json` :

```json
[
  {
    "id": "index",
    "title": "Accueil",
    "path": "index.md",
    "order": 1,
    "published": true,
    "requireAuth": false
  },
  {
    "id": "getting-started", 
    "title": "Guide de démarrage",
    "path": "getting-started.md",
    "order": 2,
    "published": true,
    "requireAuth": false
  },
  {
    "id": "sites-management",
    "title": "Gestion des sites",
    "path": "sites-management.md",
    "order": 4,
    "published": true,
    "requireAuth": true
  }
]
```

**Avantages :**

- ✅ **Contrôle total de l'ordre** avec la propriété `order` (plus flexible qu'un scan automatique)
- ✅ **Titres personnalisés** indépendants du nom de fichier
- ✅ **Publication toggle** avec `published: false` pour masquer temporairement
- ✅ **Accès contextuel** avec `requireAuth` (sections publiques/privées)
- ✅ **Convention POSIX** automatique (fichiers `.` ignorés)
- ✅ **Métadonnées extensibles** (possibilité d'ajouter d'autres propriétés)

### 🔐 Nouveau : Gestion de l'authentification

Le système supporte maintenant des **sections contextuelles** selon l'état de connexion :

#### Sections publiques (`requireAuth: false`)
- Visibles par **tous les utilisateurs** (connectés ou non)
- Exemples : Accueil, Guide de démarrage, FAQ

#### Sections privées (`requireAuth: true`)
- Visibles **uniquement** par les utilisateurs connectés
- Exemples : Gestion des sites, Administration, Fonctionnalités avancées

#### Configuration dans index.json

```json
{
  "id": "sites-management",
  "title": "Gestion des sites",
  "path": "sites-management.md",
  "order": 4,
  "published": true,
  "requireAuth": true  // ← Section réservée aux utilisateurs connectés
}
```

#### Fonctionnement automatique
- Le composant `AideComponent` détecte automatiquement l'état de connexion
- Les sections `requireAuth: true` sont **filtrées dynamiquement**
- Aucune modification de code nécessaire pour ajouter/retirer des restrictions

### Structure d'un fichier Markdown
```markdown
# Titre principal

## Section 1

Contenu avec **gras**, *italique*, et `code`.

### Sous-section

- Liste à puces
- Autre élément

> Citation ou conseil important

1. Liste numérotée
2. Deuxième élément

## Section 2

Plus de contenu...
```

## Styles supportés

- **Titres** (H1 à H6) avec couleurs personnalisées
- **Listes** à puces et numérotées
- **Code inline** et blocs de code
- **Citations** avec barre latérale bleue
- **Liens** et texte formaté
- **Responsive design** pour mobile

## Dépendances

- `marked` : Parser Markdown vers HTML
- `@types/marked` : Types TypeScript pour marked
- Angular Material : Interface utilisateur

## Configuration

Le service est configuré avec les options Marked suivantes :

- `breaks: true` : Conversion des retours à la ligne
- `gfm: true` : Support GitHub Flavored Markdown

## Routes

Les routes d'aide utilisateur sont configurées dans `app.routes.ts` :

```typescript
{
  path: 'aide',
  component: AideComponent,
  // Pas de canActivate = accessible sans authentification
},
{
  path: 'aide/:section',
  component: AideComponent,
}
```

### Séparation des responsabilités

- `/aide` → Documentation **utilisateur** (fichiers Markdown)
- `/documentation` → Documentation **développeur** (générée par Compodoc)

## Sécurité

- **Accès libre** : Aucune authentification requise pour `/aide`
- **Sanitisation automatique** du HTML par Angular
- **Validation des sections** existantes
- **Filtrage automatique** des fichiers draft (convention POSIX)

## Avantages de la convention POSIX

✅ **Standard universel** : Convention Unix/Linux reconnue
✅ **Simplicité** : Pas de dossier séparé à gérer
✅ **Visibilité** : Distinction claire entre draft et publié
✅ **Git friendly** : Possibilité d'ignorer les fichiers `.draft-*` si nécessaire
✅ **Publication rapide** : Un simple `mv` pour publier un draft
✅ **Développement agile** : Itération rapide sur la documentation

## Extension possible

- Support des images dans les fichiers Markdown
- Système de recherche dans la documentation
- Export PDF des sections
- Versioning de la documentation
- Système de commentaires ou feedback
- Interface d'administration pour gérer les drafts

## 🎉 Récap des améliorations v2.0

### ✅ Système hybride optimal

- **Configuration JSON maîtrisée** : Contrôle total de l'ordre et des métadonnées
- **Observable-based** : Architecture Angular moderne et asynchrone
- **Authentification contextuelle** : Sections publiques/privées automatiques
- **Flexibilité maximale** : Titres personnalisés + ordre sur mesure
- **Meilleur des deux mondes** : Convention POSIX + contrôle fin JSON

### ✅ Convention POSIX renforcée

- **Filtrage automatique** des fichiers `.draft-*` et `.hidden-*`
- **Test validé** : Renommer `map-usage.md` → `.map-usage.md` cache instantanément la section
- **Workflow simplifié** : Un simple `mv` pour publier/cacher du contenu

### ✅ Architecture robuste

- **Gestion d'erreurs** complète (fichiers manquants, JSON malformé)
- **Tests unitaires** complets avec mocks Observable
- **Types TypeScript** stricts pour `DocSection`
- **Compilation propre** sans warnings TypeScript

**Le système offre maintenant le parfait équilibre entre simplicité et contrôle !** 🚀

## 🎯 **Pourquoi ce choix hybride est optimal**

Plutôt qu'un scan automatique des fichiers (qui limiterait le contrôle), le système JSON offre :

- **🎨 Créativité totale** : Ordre et titres entièrement personnalisables
- **📋 Gestion fine** : Toggle published/draft indépendant des noms de fichiers  
- **🔧 Extensibilité** : Ajout futur de métadonnées (catégories, tags, etc.)
- **⚡ Performance** : Pas de scan filesystem à chaque chargement
- **🛡️ Stabilité** : Configuration explicite vs génération automatique imprévisible

**C'est exactement le niveau de contrôle nécessaire pour une documentation professionnelle !** 💪

## 🔐 **Exemple concret d'authentification**

### Utilisateur **non connecté** voit :
- ✅ Accueil
- ✅ Guide de démarrage  
- ✅ Utilisation de la carte
- ✅ FAQ

### Utilisateur **connecté** voit EN PLUS :
- ✅ **Gestion des sites** (requireAuth: true)
- ✅ Toute autre section privée

### Workflow magique ✨
1. **Créer une section privée** : Ajouter `"requireAuth": true` dans index.json
2. **Publier** : L'authentification se fait automatiquement !
3. **Aucun code à modifier** dans les composants 🎯
