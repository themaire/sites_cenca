## Pour le select "type":

Ce projet contient un composant de sélection (<mat-select>) créé avec Angular Material pour afficher une liste de types d'options.

    ## Fonctionnalités :

Un champ de sélection (dropdown) pour choisir parmi différents types.
Le champ utilise mat-form-field avec l'apparence fill pour le style.
Trois options sont proposées :

    * Type (par défaut)
    * Site géré
    * CAST

Un événement selectionChange est déclenché à chaque fois qu'une nouvelle option est sélectionnée, et la fonction selectionSelectors est appelée avec les paramètres suivants :

    * L'événement de sélection
    * Le nom de la sélection (Type)
    * Un indicateur booléen (true)

## Pour l'input "code":

Ce composant Angular utilise Angular Material pour un champ de saisie numérique avec validation et un bouton de suppression.

        ## Fonctionnalités :

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

## Pour l'input "name":

Ce composant Angular utilise un champ de saisie (<input>) avec Angular Material pour gérer la saisie d'un nom avec validation.

        ## Fonctionnalités

Champ de saisie texte (<input>) intégré dans un champ mat-form-field avec un style d'apparence fill.
Un contrôle de formulaire (nameFormControl) est utilisé pour la gestion de la validation et des interactions avec le champ.
Le champ vérifie la longueur minimale de l'entrée :
Une erreur de validation s'affiche si le texte est inférieur à 3 caractères.
Le message d'erreur "Minimum 3 caractères" s'affiche via <mat-error>.
Un bouton "fermer" (<button>) apparaît lorsque le champ contient une valeur :
En cliquant dessus, la fonction clearCode('nom') est appelée pour effacer le contenu du champ.

        ## Événements

<stringChange($event)> : déclenché à chaque fois que le contenu du champ change.
<clearCode('nom')> : appelé lorsque l'utilisateur clique sur le bouton de suppression pour vider le champ de texte.

## Pour les autres selects :

Ce composant Angular permet de générer dynamiquement plusieurs sélecteurs avec Angular Material à partir d'une liste de données (selectors).

        ## Fonctionnalités

Création dynamique de plusieurs sélecteurs (<mat-select>) à partir d'un tableau d'objets selectors.

Chaque sélecteur est défini par les propriétés suivantes :

    * title : utilisé pour afficher le label du sélecteur.
    * name : utilisé comme identifiant du sélecteur.
    * values : une liste d'options à afficher dans le menu déroulant.

Chaque sélecteur a une option par défaut qui invite l'utilisateur à sélectionner une valeur (par exemple, "Sélectionner Nom").
Les options de chaque sélecteur sont générées dynamiquement via \*ngFor.
Lorsque l'utilisateur sélectionne une option, l'événement selectionChange est déclenché et appelle la fonction selectionSelectors avec les arguments suivants :

    * L'événement de sélection
    * Le nom du sélecteur

        ## Événements

<selectionChange($event, selector.name) > : déclenché lorsque l'utilisateur sélectionne une option dans le sélecteur, permettant de gérer la sélection de manière dynamique en fonction du sélecteur.

## Le bouton :

Ce composant contient un simple bouton qui déclenche une action lorsque l'utilisateur clique dessus.

        ## Fonctionnalités

<Bouton de sélection > : Lorsque l'utilisateur clique sur le bouton, la méthode productSelection() est appelée.
Le texte du bouton est "Sélection des sites".

        ## Méthode associée

La méthode <productSelection()> doit être définie dans le composant TypeScript correspondant pour traiter l'événement lorsqu'un utilisateur clique sur le bouton.
