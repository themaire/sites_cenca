# Champ de saisie du code avec validation

Ce composant Angular utilise Angular Material pour un champ de saisie numérique avec validation et un bouton de suppression.

## Fonctionnalités

## Pour l'input "code":

- **Clavier numérique** : `inputmode="numeric"` pour les mobiles.
- **Validation** :
- Longueur minimale.
- Uniquement des chiffres (via `pattern="[0-9]*"`).
- **Bouton d'effacement** : Affiché lorsque du texte est saisi.

```typescript

Ce code Angular utilise un `FormControl` pour gérer un champ de saisie avec validation et une méthode pour réinitialiser sa valeur.

**Validation du Champ

    Validators.minLength(4) :
Cette validation assure que le code saisi a une longueur minimale de 4 caractères. Si la longueur est inférieure, le contrôle sera invalidé.

    Validators.pattern('^[0-9]*$') :
Ce validateur applique une expression régulière pour permettre uniquement les chiffres (0-9). Toute autre entrée sera rejetée, et le champ sera marqué comme invalide.

**Réinitialisation du champ
    clearCode() :
Cette méthode est utilisée pour effacer le contenu du champ de saisie. En appelant setValue(''), le champ est réinitialisé à une chaîne vide, ce qui efface le texte saisi.
```
