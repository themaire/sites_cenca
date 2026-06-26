# Mémo — Rester sur l'onglet actif après sauvegarde

## Problème de départ

Le composant `DetailPmfuComponent` affiche un formulaire découpé en **3 onglets** (`mat-step`) :
1. Informations principales
2. Localisation
3. Pièces jointes

Après un clic sur « Enregistrer » (`onSubmit()`), le backend répond, le frontend recharge les données via `setupPmfuForm()`, et le stepper Material revenait systématiquement au **premier onglet**, perdant la position de l'utilisateur.

---

## Pourquoi ça se passait ainsi

`setupPmfuForm()` recrée entièrement le `FormGroup` (`this.pmfuForm = ...`). Cette réinitialisation force Angular Material à redessiner le stepper depuis son état par défaut, c'est-à-dire l'index 0.

---

## La solution

Trois ajouts dans `detail-pmfu.component.ts` :

### 1. Importer le type `MatStepper`

```ts
import { MatStepperModule, MatStepper, StepperOrientation } from '@angular/material/stepper';
```

`MatStepper` est la classe qui représente l'instance du composant stepper. Sans cet import, TypeScript ne connaît pas la propriété `selectedIndex`.

### 2. Référencer le stepper avec `@ViewChild`

```ts
@ViewChild('mfuStepper') mfuStepper!: MatStepper;
```

`#mfuStepper` est la référence template déclarée dans le HTML :
```html
<mat-horizontal-stepper [linear]="false" #mfuStepper>
```

`@ViewChild` permet au composant TypeScript d'accéder directement à l'instance Angular Material du stepper, et donc de lire ou d'écrire son `selectedIndex` (l'index de l'onglet actif, 0 = premier onglet).

### 3. Sauvegarder et restaurer l'index dans `onSubmit()`

```ts
onSubmit(): void {
  // Mémoriser l'onglet actif avant toute opération
  const activeStepIndex = this.mfuStepper?.selectedIndex ?? 0;

  // ... logique de soumission ...

  // Après le rechargement du formulaire, remettre l'onglet actif
  await this.setupPmfuForm();
  this.cdr.detectChanges();
  this.mfuStepper.selectedIndex = activeStepIndex;
}
```

- `this.mfuStepper?.selectedIndex` lit l'index de l'onglet affiché au moment du clic (le `?` protège si le stepper n'est pas encore rendu).
- `?? 0` fournit une valeur par défaut (premier onglet) si la lecture échoue.
- Après `setupPmfuForm()` et `detectChanges()`, on réassigne `selectedIndex` pour repositionner le stepper.

---

## Pourquoi après `detectChanges()` et non avant

`setupPmfuForm()` recrée le formulaire et émet de nouveaux signaux de changement. `cdr.detectChanges()` force Angular à appliquer ces changements au DOM. Ce n'est qu'**après** cette mise à jour que le stepper existe à nouveau dans sa nouvelle version et accepte une réassignation de `selectedIndex`. Faire le repositionnement avant produirait un effet sans résultat visible.

---

## Fichiers concernés

| Fichier | Modification |
|---|---|
| `detail-pmfu.component.ts` | Import `MatStepper`, ajout `@ViewChild`, sauvegarde/restauration de l'index dans `onSubmit()` |
| `detail-pmfu.component.html` | Aucune modification — `#mfuStepper` était déjà présent sur `<mat-horizontal-stepper>` |
