# Système de recherche de projets

## 📁 Structure créée

```
src/app/sites/site-detail/detail-projets/
├── detail-projets.component.ts (✏️ modifié)
├── detail-projets.component.html
└── projetSearch/
    ├── projets-search.component.ts       (formulaire de recherche)
    ├── projets-search.component.html
    ├── projets-search.component.scss
    ├── projets-search.component.spec.ts
    └── projets-liste-search.component.ts (wrapper pour affichage résultats)
```

## 🔧 Fonctionnement

### 1. Composant de recherche (`projets-search`)
- Formulaire avec critères : **année**, **génération** (1_TVX/2_WEB), **responsable**, **statut**
- Validation de l'année (4 chiffres, format AAAA)
- Bouton "Rechercher les projets" qui navigue vers un outlet avec les paramètres

### 2. Composant de liste adapté (`detail-projets`)
Le composant `detail-projets` a été modifié pour fonctionner en **2 modes** :

#### Mode "site" (comportement actuel)
- Reçoit `@Input() siteDetailProjet`
- Charge les projets via `uuid_site`
- Route: `projets/uuid=${uuid_espace}/lite`

#### Mode "search" (nouveau)
- Détecte automatiquement les paramètres de route
- Charge les projets selon les critères de recherche
- Route: `projets/search?annee=2024&responsable=...&statut=...&generation=...`

## 🚀 Intégration dans votre application

### Étape 1 : Ajouter les routes

Dans votre fichier de routing (ex: `app.routes.ts` ou `sites.routes.ts`) :

```typescript
import { ProjetsSearchComponent } from './site-detail/detail-projets/projetSearch/projets-search.component';
import { DetailProjetsComponent } from './site-detail/detail-projets/detail-projets.component';

export const ROUTES = [
  // ... vos routes existantes
  {
    path: 'projets/recherche',
    component: ProjetsSearchComponent
  },
  {
    path: 'projets',
    outlet: 'listeProjets',
    children: [
      {
        path: 'filtre/:annee/:responsable/:statut/:generation',
        component: DetailProjetsComponent
      }
    ]
  }
];
```

### Étape 2 : Ajouter l'outlet dans le template parent

Dans le template où vous voulez afficher les résultats :

```html
<div class="container">
  <!-- Formulaire de recherche -->
  <app-projets-search></app-projets-search>
  
  <!-- Zone d'affichage des résultats -->
  <router-outlet name="listeProjets"></router-outlet>
</div>
```

### Étape 3 : Adapter le backend (API)

Créer une route API qui accepte les paramètres de recherche :

```
GET /api/sites/projets/search?annee=2024&responsable=John&statut=en_cours&generation=1_TVX
```

La route doit retourner un tableau de `ProjetLite[]` filtré selon les critères.

**Exemple de réponse attendue :**
```json
[
  {
    "uuid_proj": "abc-123",
    "responsable": "John Doe",
    "annee": "2024",
    "action": "Restauration",
    "statut": "en_cours",
    "generation": "1_TVX",
    "webapp": false,
    ...
  }
]
```

## 📝 Personnalisation

### Ajouter d'autres critères de recherche

Dans `projets-search.component.ts` :

```typescript
private params: any = {
  annee: '*',
  responsable: '*',
  statut: '*',
  generation: '*',
  programme: '*',     // ⬅️ nouveau critère
  typ_projet: '*'     // ⬅️ nouveau critère
};
```

Dans `projets-search.component.html` :

```html
<mat-form-field appearance="fill">
  <mat-label>Programme :</mat-label>
  <mat-select (selectionChange)="selectionSelectors($event, 'programme')">
    <!-- options -->
  </mat-select>
</mat-form-field>
```

### Modifier la route de navigation

Dans `projets-search.component.ts`, méthode `projetSelection()` :

```typescript
this.router.navigate([
  '/votre-route',  // ⬅️ adapter selon votre structure
  {
    outlets: {
      listeProjets: [
        'filtre',
        this.params.annee,
        this.params.responsable,
        // ... vos paramètres
      ]
    }
  }
]);
```

## ⚠️ Points d'attention

1. **Route API** : La route `projets/search?...` doit être implémentée côté backend
2. **Sélecteurs dynamiques** : Actuellement filtrés depuis les sélecteurs des sites. Vous pouvez créer une route `/projets/selectors` spécifique
3. **Mode détection** : Le composant détecte automatiquement le mode via `ActivatedRoute.params`
4. **Compatibilité** : Le mode "site" (actuel) reste totalement fonctionnel

## 🐛 Debug

Pour tester la détection du mode, ajoutez dans `ngOnInit()` :

```typescript
console.log('Mode détecté:', this.mode);
console.log('Paramètres de recherche:', this.searchParams);
```

Pour vérifier la route appelée :

```typescript
console.log('Recherche de projets avec:', subroute);
```
