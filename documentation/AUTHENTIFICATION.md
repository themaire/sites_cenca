# Authentification et droits (frontend)

Documentation développeur. Ce fichier était auparavant publié dans l'aide (`src/assets/docs/auth/`), donc lisible sans connexion ; il vit désormais dans le dépôt uniquement.

## Session

- Le JWT est stocké dans `localStorage` sous la clé `token`.
- `LoginService.user` (signal) est la source de vérité : `undefined` = pas encore vérifié, `null` = déconnecté, sinon l'utilisateur (`groups`, `initiales`…).
- `authTokenInterceptor` ajoute `Authorization: Bearer <token>` à toutes les requêtes `HttpClient`. Les appels faits avec `fetch` (Sonneur, `TravauxService`) doivent ajouter l'en-tête eux-mêmes.

| Appel | Méthode | Effet |
| --- | --- | --- |
| `auth/login` | `LoginService.login()` | stocke le token, puis appelle `getUsers()` |
| `auth/me` | `LoginService.getUsers()` | met à jour `user` à partir du token |
| `auth/logout` | `LoginService.logout()` | supprime le token, `user` passe à `null` |

## Réhydratation au chargement

`AppComponent` (`src/app/app.component.ts`) :

- `ROUTES_PUBLIQUES = ['/aide', '/documentation', '/login', '/reset-password', '/not-found']` : aucune vérification sur ces préfixes.
- Au démarrage et à chaque `NavigationEnd` sur une route privée, `checkToken()` :
  - token présent → `getUsers()` ; si l'utilisateur est sur `/login`, redirection vers l'accueil ; en cas d'erreur, suppression du token et redirection vers `/login?returnUrl=<url>` ;
  - token absent → gestion du mode `/reset-password?token=…` ; sinon **aucune redirection** ici (simple log) : c'est `isLoggedInGuard` qui redirige.
- `afficherChatbot` : Sonneur n'est affiché qu'à un utilisateur connecté, hors routes publiques.

`isLoggedInGuard` (`src/app/guards/is-logged-in.guard.ts`) :

- `user === undefined` → `getUsers()` ; succès = accès, échec = `/login?returnUrl=…` ;
- `user === null` → `/login?returnUrl=…` ;
- sa liste `publicRoutes` (`login`, `about`, `contact`, `documentation`) est sans effet réel : ces routes ne portent pas la garde ou n'existent pas.

L'aide (`/aide`) n'a pas de garde : `AideComponent` tente une réhydratation silencieuse (`getUsers()` sans redirection) pour afficher les fiches réservées aux connectés.

## Groupes et droits

Les groupes se cumulent et **ne sont pas hiérarchiques** : ne jamais comparer leurs numéros (`Math.max(groups) >= 5` laisse passer les groupes 6 et 9). Utiliser les méthodes de `LoginService` :

| Méthode | Groupes | Garde |
| --- | --- | --- |
| `isConsultation()` | 1 (et utilisateur sans groupe) | — |
| `isEdit()` | 2, 3, 4, 5 | `isEditGuard` |
| `isChiro()` | 3, 5, 6 | `isChiroGuard` |
| `isFoncier()` | 9 | `isFoncierGuard` |
| `isCadre()` | 3, 4 | `isCadreGuard` |
| `isAdmin()` | 5 | `isAdminGuard` |

État au 20/10/2026 : seule `isChiroGuard` est branchée (`/chiro`). `/sites` (garde « désactivée temporairement »), `/foncier`, `/travaux` et `/docplan` n'ont aucune garde ; `/parametres` n'exige qu'une connexion. Les droits fins sont appliqués dans les composants et doivent l'être aussi par le backend.

## Droits dans l'aide

`src/assets/docs/index.hierarchical.json` : une catégorie ou une fiche peut porter `"droit": "admin" | "cadre" | "edit" | "chiro" | "foncier"`, vérifié par `DocumentationService.aLeDroit()` via les méthodes ci-dessus. Sans `droit`, la fiche est visible de tous (sous réserve de `requireAuth`). Ce filtrage ne fait que masquer le menu : les fichiers de `src/assets/docs/` restent téléchargeables directement, n'y mettez rien de confidentiel.
