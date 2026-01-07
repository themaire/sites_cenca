# Fix batch – Tests unitaires (ng test)

Ce fichier consigne les correctifs à appliquer pour que `ng test` repasse sur ce repo.

## Constat (sortie `ng test`)
Les erreurs vues ne sont pas liées au PMFU (la compilation applicative passe via `ng build`), mais à des fichiers `*.spec.ts` et à une dépendance manquante.

Principaux blocages observés :
- `src/app/hello-world.spec.ts` : import de `chai` → module introuvable.
- `src/app/sites/foncier/fon-extractions/fon-extractions.component.spec.ts` : imports d’un composant exporté sous un autre nom.
- `src/app/sites/sites.component.spec.ts` : import `SiteComponent` alors que le composant exporté est `SitesComponent`.
- `src/app/aide/aide.component.spec.ts` : mock `User` incomplet (`gro_id` requis) + attentes sur une propriété `sections` qui n’existe pas.
- `src/app/app.component.spec.ts` : attente sur `app.title` alors que la propriété `title` n’existe pas.

À noter : les messages Karma/Chrome (404 `/_karma_webpack_/main.js`, “full page reload”, crash Chrome) arrivent après/avec ces erreurs de compilation. Une fois les erreurs TS/module réglées, on re-teste avant d’investiguer Karma.

---

## Batch de corrections proposées

### 1) `chai` manquant (`hello-world.spec.ts`)
Option A (recommandée) : basculer sur Jasmine (déjà standard avec Angular/Karma)
- Remplacer `import { expect } from 'chai'` par les assertions Jasmine `expect(...)`.
- Supprimer toute API Chai (`to.be.true`, etc.) au profit de Jasmine (`toBeTrue()`, `toEqual(...)`, …).

Option B : installer Chai (moins standard avec Angular/Karma)
- Commande PowerShell :
  - `npm i -D chai @types/chai`

### 2) Mauvais noms de composants importés dans les specs
#### `src/app/sites/foncier/fon-extractions/fon-extractions.component.spec.ts`
- Le spec importe `FonDemandesComponent`, mais le fichier exporte `FonExtractionComponent`.
- Action : renommer l’import + toutes les occurrences.

#### `src/app/sites/sites.component.spec.ts`
- Le spec importe `SiteComponent`, mais le composant exporté est `SitesComponent`.
- Action : renommer l’import + toutes les occurrences.

### 3) Types/models qui ont évolué
#### `src/app/aide/aide.component.spec.ts`
- Le mock utilisateur doit inclure `gro_id` (ex: `gro_id: 0`).
- Les attentes sur `component.sections` doivent être alignées avec le vrai composant :
  - soit remplacer par la propriété/structure actuelle (à vérifier dans `aide.component.ts`),
  - soit supprimer/adapter le test si la feature a disparu.

#### `src/app/app.component.spec.ts`
- Le test attend `app.title` mais `AppComponent` n’a plus `title`.
- Action :
  - soit réintroduire `title` (peu souhaitable si l’app n’en a plus besoin),
  - soit adapter le test (ex: vérifier que le composant se crée, ou vérifier le rendu réel dans le template).

---

## Procédure conseillée (safe)
1) Faire passer les erreurs de compilation TypeScript/modules.
2) Relancer `ng test`.
3) Seulement si ça compile mais Karma/Chrome crash encore : investiguer la config Karma/Chrome (headless, flags, versions).

### Commandes (PowerShell)
- Lancer les tests :
  - `npm test`
- Relancer en mode non-watch si besoin :
  - `npx ng test --watch=false`

---

## Checklist de validation
- `ng build` OK.
- `ng test` compile (plus d’erreurs TS/module avant lancement Chrome).
- Les specs exécutent un nombre > 0 de tests.

---

## Notes
- Si certains specs sont obsolètes (fonctionnalités retirées), la solution la plus saine peut être de les mettre à jour pour refléter le comportement actuel, plutôt que de forcer le retour d’anciennes propriétés (ex: `title`, `sections`).
