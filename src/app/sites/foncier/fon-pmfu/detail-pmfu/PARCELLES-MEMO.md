# Mémo — Mécanique de la sélection de parcelles (step 2 « Localisation »)

## Vue d'ensemble

La sélection de parcelles est le cœur du formulaire PMFU. Trois acteurs collaborent :

1. **`DetailPmfuComponent`** — le chef d'orchestre : détient l'état de la sélection et le synchronise avec le formulaire.
2. **`MapComponent`** (`src/app/map/map.component.ts`) — la carte Leaflet : affiche les parcelles cadastrales chargées dynamiquement et permet d'en ajouter/retirer via des popups.
3. **Le champ `pmfu_parc_list_array`** du `pmfuForm` — la destination : un tableau de chaînes qui sera converti en littéral PostgreSQL `{...}` (`pmfu_parc_list`, type `character varying[]`) au moment du submit par `form.service.ts` (`toPostgresArrayString`).

```
BDD pmfu_parc_list "{idu1,idu2:1}"
        │ postgresArrayStringToArray()
        ▼
fetch() ── split "idu:flag" ──► idus nus ──► POST api-geo/parcelles/infos-by-idus
        │                                            │
        │ pourPartieByIdu (Map)                      ▼
        └──────── regreffe pour_partie ──► ParcellesSelected[]
                                                     │
                                                     ▼
                                          onParcellesSelected()
                                                     │
                          ┌──────────────────────────┼─────────────────────────┐
                          ▼                          ▼                         ▼
                 parcellesSelected          syncParcellesToForm()      setParcellesSelection()
                 (chips + carte)         (pmfu_parc_list_array)           (carte Leaflet)
```

---

## L'encodage « pour partie » (depuis juillet 2026)

Chaque élément du `varchar[]` encode un **couple parcelle/booléen** :

| En base            | Signification            |
|--------------------|--------------------------|
| `511234000A0123`   | pour_partie = **false**  |
| `511234000A0123:1` | pour_partie = **true**   |

Pourquoi l'idu nu vaut false (plutôt qu'un `:0` explicite) :
- **Rétro-compatibilité totale** : les données existantes sont déjà au bon format, zéro migration.
- **Pas de faux positifs** dans la détection de modification : `normalizePmfuParcelles()` (form.service.ts) compare les chaînes brutes ; si on réécrivait `idu` en `idu:0` au chargement, chaque ouverture serait vue comme une modification.
- Le backend n'a **pas été modifié** : il stocke et restitue le champ tel quel.

⚠️ **Point de vigilance** : la route `api-geo/parcelles/infos-by-idus` doit recevoir des **idus nus** — c'est `fetch()` qui strippe le suffixe avant l'appel. Si un jour une requête SQL côté Express joint directement sur les éléments de `pmfu_parc_list`, le suffixe `:1` la cassera.

Encodage/décodage centralisés dans ce composant :
- décodage : `fetch()` (split sur `:`, Map `pourPartieByIdu`)
- encodage : `encodeParcelleEntry()`, appelé uniquement par `syncParcellesToForm()`

---

## Le cœur : les quatre listes d'état

C'est la partie subtile du composant. Quatre tableaux de `ParcellesSelected` :

| Liste                       | Rôle                                                                                  |
|-----------------------------|---------------------------------------------------------------------------------------|
| `parcellesInitialesBackup`  | **Photo intangible de la BDD.** Jamais modifiée pendant l'édition. Sert à tout restaurer à l'annulation. Réactualisée uniquement après un save réussi. |
| `initialparcellesSelected`  | Les initiales « courantes » : une initiale peut être retirée pendant l'édition.        |
| `parcellesAjoutees`         | Les ajouts de la session d'édition en cours.                                           |
| `parcellesSelected`         | **La vérité affichée** = recomposition `[...initiales courantes, ...ajoutées]`. Alimente les chips, le formulaire et la carte. |

(+ `trashParcelle`, poubelle des supprimées, prévue pour un futur undo — pas encore exploitée.)

### Règle d'or : les copies sont profondes

À chaque bascule d'édition (`toggleEditPmfu()`), les listes sont reconstruites par `backup.map(p => ({ ...p }))`. Les éléments de `parcellesSelected` ne sont donc **pas les mêmes objets** que ceux de `initialparcellesSelected`/`parcellesAjoutees`.

Conséquence pratique : toute mutation d'une parcelle affichée (ex. cocher « Pour partie ») doit être **propagée aux listes sources** — c'est ce que fait `onPourPartieChange()` — sinon la prochaine recomposition `[...initiales, ...ajoutées]` (déclenchée par un ajout/retrait sur la carte) écrase silencieusement le changement.

---

## Les flux, un par un

### 1. Chargement (ouverture du dialog)

`setupPmfuForm()` → `fetch(pmfu_id)` :
1. `pmfu_parc_list` (string Postgres) → `postgresArrayStringToArray()` → éléments `idu[:1]`.
2. Split idu/flag ; les idus nus partent en POST `infos-by-idus` qui renvoie les infos complètes (commune, section, numéro, **contenance**, **bbox**).
3. Le flag `pour_partie` est regreffé sur chaque parcelle au retour.
4. `onParcellesSelected(selection)` initialise les listes ; `parcellesInitialesBackup` prend sa photo.

La bbox arrive parfois en string CSV → convertie en `number[]` à ce moment-là.

### 2. Ajout depuis la carte

En mode édition (`isEditMode && selectParcellesMode` côté carte), la popup d'une parcelle affiche un caddie vert → `addParcelleToSelection()` (map.component) → la carte émet `(parcellesSelected)` avec sa liste complète → `onParcellesSelected()` côté parent :
- tri par idu, comparaison JSON pour éviter les boucles ;
- les idus inconnus des initiales et des ajouts sont classés dans `parcellesAjoutees` ;
- recomposition, `syncParcellesToForm()`, et renvoi vers la carte (`setParcellesSelection`) pour le restyle.

Une parcelle ajoutée par la carte n'a pas de `pour_partie` → `undefined` → traité comme false. La carte **ignore totalement** ce flag : aucun changement côté `MapComponent`.

### 3. Retrait (chips ou carte)

- Chips : corbeille → `removeParcelle()`.
- Carte : caddie rouge dans la popup → `removeParcelleFromSelection()` (map.component) → émission `(parcelleRemoved)` avec l'idu → `onParcelleRemoved()` → `removeParcelle()`.

`removeParcelle()` retire l'idu des initiales courantes **et** des ajoutées, recompose, pousse dans `trashParcelle`, resynchronise formulaire + carte. Le backup n'est **jamais** touché ici.

### 4. Checkbox « Pour partie » (chips)

`onPourPartieChange(parcelle, checked)` :
1. mute la parcelle affichée ;
2. propage le flag à l'entrée correspondante dans `initialparcellesSelected` et `parcellesAjoutees` (cf. règle d'or) ;
3. `syncParcellesToForm()` → le champ passe dirty, la valeur encodée change → la sauvegarde détectera la modification.

La checkbox est grisée hors édition (`[disabled]="!isEditPmfu"`).

### 5. Annulation

`toggleEditPmfu()` (sortie d'édition sans save) : toutes les listes sont reconstruites depuis `parcellesInitialesBackup` → retraits, ajouts **et flags** reviennent à l'état BDD.

### 6. Sauvegarde

`onSubmit()` appelle `syncParcellesToForm()` juste avant le diff. Dans `form.service.ts` :
- si rien n'a changé ailleurs, `normalizePmfuParcelles()` compare spécifiquement les tableaux de parcelles (chaînes brutes, donc les flags comptent) ;
- au submit, `pmfu_parc_list = toPostgresArrayString(pmfu_parc_list_array)` et le contrôle `_array` est retiré du payload.

Après succès : `parcellesInitialesBackup` et `initialFormValues` sont réactualisés depuis l'état courant.

---

## Côté carte (pour mémoire)

- **Chargement dynamique** : à chaque `moveend`/`zoomend`, appel backend `api-geo/parcelles/bbox?bbox=...` avec la bbox visible. Débounce, cache de la dernière bbox, **zoom minimum 14** (en dessous la couche se vide), suspendu popup ouverte (`hasOpenPopup`).
- **Styles** : sélectionnée vs normale, highlight au survol, zoom au double-clic.
- **Contrôle de surface** (haut droite) : somme des `contenance` de la sélection en ha.
- **Zoom initial unique** sur la sélection préchargée (`tryZoomToSelectedParcellesOnce`).
- `refreshParcellesPopups()` est appelé par le parent au toggle édition pour re-render les popups avec/sans boutons caddie.

---

## Bizarreries connues (assumées, à garder en tête)

1. **`parcelleRemoved` est branché deux fois** : dans le template `(parcelleRemoved)="onParcelleRemoved($event)"` **et** manuellement dans `ngAfterViewInit`. Chaque suppression déclenche donc le handler deux fois ; le second appel ne trouve plus la parcelle et se contente d'un `console.warn`. Redondant mais inoffensif.
2. **Projet démarrant sans parcelle** : la première parcelle ajoutée tombe dans la branche « initialisation » de `onParcellesSelected()` et est classée *initiale* au lieu d'*ajoutée*. Sans conséquence aujourd'hui, mais ça mordra le jour où `trashParcelle`/undo sera exploité.
3. **Course au chargement** : les infos parcelles arrivent en asynchrone ; si elles arrivent avant la création du `pmfuForm`, `syncParcellesToForm()` s'abstient (garde `if (!this.pmfuForm) return`). La valeur initiale du formulaire vient alors du `pmfu_parc_list_array` brut — cohérent puisque le même encodage y est conservé.
