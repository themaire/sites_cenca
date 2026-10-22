# Fiches de l'aide utilisateur

Ce dossier contient les fiches Markdown affichées sur `/aide/<id>` par `AideComponent` (`src/app/aide/`). `DocumentationService` (`src/app/services/documentation.service.ts`) lit l'index, filtre les fiches selon la connexion et les droits, puis convertit le Markdown en HTML avec `marked` (options `gfm` et `breaks`).

Ce fichier n'est pas référencé dans l'index : il n'apparaît pas dans l'aide.

## Ajouter une fiche

1. Créer le fichier `.md` dans ce dossier (sous-dossier par thème si besoin : `sites/`, `chatbot/`…).
2. Ajouter une entrée dans la catégorie voulue de `index.hierarchical.json`.
3. Vérifier l'affichage sur `/aide/<id>` avec un compte qui a le droit, puis avec un compte qui ne l'a pas.

## Format de l'index

```json
{
  "categories": [
    {
      "id": "utilisateur",
      "title": "Documentation utilisateur",
      "sections": [
        {
          "id": "travaux",
          "title": "Travaux",
          "path": "travaux.md",
          "order": 10,
          "published": true,
          "requireAuth": true,
          "backendUrl": null
        }
      ]
    }
  ]
}
```

| Champ | Rôle |
| --- | --- |
| `id` | identifiant dans l'URL (`/aide/travaux`) et dans les liens entre fiches |
| `title` | libellé du menu de l'aide |
| `path` | chemin du `.md`, relatif à ce dossier |
| `order` | ordre dans le menu (unique dans la catégorie) |
| `published` | `false` = fiche masquée (brouillon) |
| `requireAuth` | `true` = visible seulement une fois connecté |
| `backendUrl` | si renseigné, le contenu HTML est demandé au backend (`docs?file=…`) au lieu du `.md` |
| `droit` | facultatif, sur une catégorie ou une fiche : `admin`, `cadre`, `edit`, `chiro` ou `foncier` |

Les droits correspondent aux méthodes `isAdmin()`, `isCadre()`, `isEdit()`, `isChiro()` et `isFoncier()` de `LoginService`. Ils ne font que masquer le menu : les fichiers de ce dossier restent téléchargeables par leur URL. Une documentation sensible passe par `backendUrl` (protégée côté serveur) ou reste dans `documentation/` à la racine du dépôt.

## Rédaction

- Libellés copiés exactement depuis l'interface (boutons, onglets, infobulles).
- Indiquer le droit nécessaire pour chaque action réservée.
- Liens entre fiches : `[texte](/aide/<id>)`.
- Pas de fonctionnalité qui n'existe pas encore : une fiche se met à jour avec le code.
