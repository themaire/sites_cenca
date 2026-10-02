# 📰 Module Actualités

Fil d'actualités affiché sur la page d'accueil d'ATLAS, avec une petite dimension « réseau social » : **réactions**, **commentaires** et **suivi des actualités non lues**.

> La **publication** reste réservée aux administrateurs (groupe 5), depuis `/parametres` → « Gérer les news » (`src/app/admin/admin-news/`).
> Tous les utilisateurs connectés peuvent **réagir** et **commenter**.

---

## ✨ Fonctionnalités

| | Fonctionnalité | Détail |
|---|---|---|
| 🗂️ | **Fil en grille** | 4 cartes par ligne, puis 3 / 2 / 1 selon la largeur de l'écran |
| 📏 | **Cartes alignées** | Même hauteur sur une ligne ; l'image remplit l'espace laissé libre par le texte (140 px minimum) |
| ➕ | **Voir plus** | Pagination par paquets de 8 (`limite` + `offset`) ; le bouton disparaît quand tout est chargé |
| 👍 | **Réactions** | 👍 ❤️ 🌿 👏 😮 — **une seule par personne** : recliquer la retire, en choisir une autre la remplace |
| 💬 | **Commentaires** | Dans la fenêtre de détail : avatar à initiales, date relative, `Ctrl+Entrée` pour publier, 1000 caractères max |
| 🗑️ | **Suppression** | Par l'auteur de son propre commentaire, ou par un admin (groupe 5) pour modérer, après confirmation. Les autres utilisateurs ne voient pas la croix sur les commentaires des collègues |
| 🔔 | **Non lu** | Liseré orange + pastille « Nouveau » sur la carte, compteur « N nouvelles » à côté du titre ; marqué lu à l'ouverture |
| 🕒 | **Dates relatives** | « à l'instant », « il y a 5 min », « il y a 3 h », « hier », « il y a 4 j », puis jj/mm/aaaa |
| ✅ | **Publiée** | Case à cocher dans la fenêtre de détail, visible des admins uniquement |

---

## 📁 Arborescence

```
home/news/
├── news.component.*                 # Fil d'accueil (grille, pagination, compteur non lus)
├── newsDetail/
│   └── news-detail-dialog.component.*  # Fenêtre de détail : contenu, réactions, commentaires, case « Publiée »
├── reactions/
│   └── news-reactions.component.*   # Barre de réactions réutilisée par le fil ET la fenêtre de détail
├── temps-ecoule.pipe.ts             # Pipe `tempsEcoule` (dates relatives)
├── *.spec.ts                        # Tests unitaires
└── README.md
```

Fichiers partagés :

- `src/app/shared/services/news.service.ts` — `NewsService` + la liste `NEWS_REACTIONS` (emojis proposés, dans l'ordre d'affichage)
- `src/app/shared/interfaces/news.ts` — interfaces `News`, `NewsReaction`, `NewsComment`

---

## 🔄 Fonctionnement

```
Accueil ──GET /news?limite=8&offset=0──▶ fil (réactions, nb_commentaires, lu)
   │
   ├─ clic emoji ──POST /news/:id/reactions──▶ compteurs à jour (sans ouvrir le détail)
   │
   └─ clic carte ──▶ fenêtre de détail
                      ├─ GET  /news/:id            (contenu complet)
                      ├─ GET  /news/:id/comments
                      ├─ POST /news/:id/vue        (si non lue)
                      ├─ POST /news/:id/comments
                      └─ DELETE /news/comments/:commentId
```

- **Objet partagé** : la fenêtre de détail reçoit *le même objet* `News` que la carte et le modifie en place (`Object.assign`). Réactions, nombre de commentaires et statut « lu » sont donc à jour dans le fil à la fermeture, sans recharger.
- **JWT obligatoire** : `NewsService` passe par `HttpClient`, donc `authTokenInterceptor` ajoute le token. Le backend identifie l'utilisateur **uniquement par le JWT**, jamais par un paramètre envoyé par le front.
- **Dégradation propre** : si le backend ne renvoie pas `reactions` / `nb_commentaires`, ou si les commentaires sont indisponibles, ces blocs sont simplement masqués. Si `GET /news` échoue, tout le bloc Actualités disparaît de l'accueil.

---

## 🌐 API backend (Express)

Toutes les routes exigent le JWT (`401 Token manquant` sinon) et ne concernent que les actualités **publiées**.

| Méthode | Route | Body | Réponse |
|---|---|---|---|
| `GET` | `/news?limite=8&offset=0` | — | `News[]` avec `reactions`, `nb_commentaires`, `lu` |
| `GET` | `/news/:id` | — | `News` avec `contenu` + champs sociaux |
| `POST` | `/news/:id/reactions` | `{ emoji }` | `NewsReaction[]` à jour (toggle) |
| `GET` | `/news/:id/comments` | — | `NewsComment[]`, du plus ancien au plus récent |
| `POST` | `/news/:id/comments` | `{ contenu }` | le `NewsComment` créé |
| `DELETE` | `/news/comments/:commentId` | — | `204` (auteur ou admin groupe 5, sinon `403`) |
| `POST` | `/news/:id/vue` | — | `204` (idempotent) |

Erreurs : `400` (emoji non autorisé, commentaire vide ou > 1000 caractères), `403` (suppression du commentaire d'un collègue sans être admin), `404` (actualité ou commentaire introuvable).

Format d'une réaction : `{ "emoji": "👍", "count": 3, "mine": true }` (`mine` = l'utilisateur connecté a choisi cette réaction).

### 🗄️ Tables (schéma `gestint`)

| Table | Clé | Rôle |
|---|---|---|
| `gestint.news` | `id` | Les actualités (gérées depuis l'admin) |
| `gestint.news_reactions` | `(news_id, cd_salarie)` | Une réaction par personne et par actualité |
| `gestint.news_comments` | `id` | Commentaires (`contenu` de 1 à 1000 caractères) |
| `gestint.news_vues` | `(news_id, cd_salarie)` | Qui a ouvert quelle actualité → statut « lu » |

Les clés étrangères pointent vers `gestint.news(id)` et `admin.salaries(cd_salarie)` avec `ON DELETE CASCADE`.

---

## 🛠️ Personnaliser

- **Changer les emojis** : modifier `NEWS_REACTIONS` dans `news.service.ts` **et** la contrainte `CHECK` de `gestint.news_reactions` (et la liste autorisée côté backend).
- **Taille de page du fil** : constante `PAGE` dans `news.component.ts` (8 = 2 lignes de 4).
- **Nombre de colonnes / hauteur mini des images** : `.fil` et `.post img` dans `news.component.scss`.
- **Longueur max d'un commentaire** : `COMMENT_MAX` dans `news-detail-dialog.component.ts`, à garder aligné avec la contrainte SQL.

---

## 🧪 Tests

```bash
ng test --include='src/app/home/news/**/*.spec.ts'
```

Couvre : affichage du fil, échec propre si le backend est absent, pagination « Voir plus » + compteur de non lus, pipe `tempsEcoule`.

> ⚠️ Aujourd'hui, `ng test` ne compile pas à cause de specs cassées **sans rapport avec ce module** (`aide`, `app`, `hello-world`, `fon-extractions`, `sites`). En attendant, utiliser un tsconfig temporaire limité aux specs du module :
>
> ```json
> { "extends": "./tsconfig.spec.json", "include": ["src/app/home/news/**/*.spec.ts", "src/**/*.d.ts"] }
> ```
>
> puis `ng test --ts-config=<ce fichier> --include='src/app/home/news/**/*.spec.ts'`.

---

## ⚠️ Pièges connus

- **Pas de `<form (ngSubmit)>`** dans la fenêtre de détail : le composant n'importe que `ReactiveFormsModule`, sans `[formGroup]`. Le formulaire devient alors un submit HTML natif qui **recharge toute la page**. D'où un `<div>` + bouton `type="button" (click)`.
- **Clic sur une réaction** : `stopPropagation()` est indispensable, sinon le clic remonte à la carte et ouvre la fenêtre de détail.
- **Masquer la croix n'est pas une sécurité** : c'est le backend qui garantit qu'un non-admin ne supprime que ses propres commentaires (`403` sinon), un appel direct à l'API restant possible.
- **Champs calculés** : `reactions`, `nb_commentaires` et `lu` sont retirés avant `AdminService.updateNews()` (case « Publiée ») : ils n'existent pas dans `gestint.news`.
- **Accueil vide quelques secondes** après un rechargement : c'est le chargement en cascade des menus, pas un bug du module.
