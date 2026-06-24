# Dialog Angular Material — Problème de scroll et ScrollStrategy

## Le problème

Quand une `MatDialog` est ouverte alors que la page est **scrollée vers le bas**, le fond (backdrop) et la boîte de dialogue ne se positionnent pas correctement : on voit le bas de la page derrière le dialog plutôt que le haut, et le fond semi-transparent ne couvre pas toute la fenêtre visible.

C'est un comportement par défaut d'Angular CDK : la `ScrollStrategy` par défaut laisse la page libre de scroller pendant que le dialog est ouvert, ce qui crée ce décalage visuel.

---

## Pourquoi ça arrive

Angular Material utilise `@angular/cdk/overlay` pour positionner les dialogs. Le `Overlay` doit savoir quoi faire quand l'utilisateur (ou le contenu) scrolle pendant qu'un panel est ouvert. Ce comportement est contrôlé par la `ScrollStrategy`.

Par défaut, `MatDialog` utilise `BlockScrollStrategy` qui **bloque le scroll de la page** pendant que le dialog est ouvert — mais uniquement à partir du moment où le dialog s'ouvre. Si la page est **déjà scrollée**, la position du backdrop est calculée depuis le haut du document, pas depuis le haut de la fenêtre visible, ce qui cause le décalage.

---

## Les quatre stratégies disponibles

Toutes sont accessibles via `this.overlay.scrollStrategies` (service `Overlay` du CDK) :

| Stratégie | Méthode | Comportement |
|---|---|---|
| **Block** | `.block()` | Bloque le scroll de la page (défaut de MatDialog). Décale si déjà scrollé. |
| **Reposition** | `.reposition()` | Repositionne le panel quand la page scrolle. Reste visible. |
| **Close** | `.close()` | Ferme le panel si la page scrolle. |
| **Noop** | `.noop()` | Ne fait rien, le panel reste fixe quoi qu'il arrive. |

---

## La solution appliquée dans ce projet

### Choix : `reposition()` pour les formulaires, `close()` pour les lectures seules

- **`reposition()`** — utilisé dans les dialogs de formulaire (`admin-users`, `admin-groups`). Le dialog suit le scroll, l'utilisateur ne perd pas sa saisie.
- **`close()`** — peut convenir pour des dialogs de consultation rapide où on accepte que le scroll ferme la fenêtre (ex: `detail-projets`).

### Injection et utilisation

**1. Importer `Overlay` depuis le CDK :**

```typescript
import { Overlay } from '@angular/cdk/overlay';
```

**2. L'injecter dans le constructeur :**

```typescript
constructor(
  private dialog: MatDialog,
  private overlay: Overlay,
) {}
```

**3. Passer la stratégie à `dialog.open()` :**

```typescript
this.dialog.open(MonDialogComponent, {
  width: '840px',
  data: { ... },
  scrollStrategy: this.overlay.scrollStrategies.reposition(),
});
```

---

## Composants concernés dans le projet

| Composant | Fichier | Stratégie |
|---|---|---|
| Liste utilisateurs | `admin/admin-users/admin-users.component.ts` | `reposition()` |
| Liste groupes | `admin/admin-groups/admin-groups.component.ts` | *(à appliquer si besoin)* |
| Détail projets | `sites/site-detail/detail-projets/detail-projets.component.ts` | `close()` |

---

## À retenir

Dès qu'un `MatDialog` est ouvert depuis un composant dont la page peut être scrollée, il faut explicitement passer une `scrollStrategy` à `dialog.open()`. Sans ça, le backdrop ne couvre pas correctement la fenêtre visible si la page est déjà scrollée.
