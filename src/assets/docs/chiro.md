# Module Chiroptères

Le module Chiroptères permet de consulter et de saisir les relevés de chauves-souris et les sites chiroptères (gîtes, cavités, etc.).

## Accès

- Le module est réservé aux groupes qui portent le droit chiroptères : le groupe chiroptères, les administrateurs et l'un des deux groupes cadres. En cas de doute, demandez à un administrateur.
- Pour ces personnes, un bouton **Chiroptères** apparaît dans la barre de menu en haut de l'écran. Il ouvre la page d'accueil du module (`/chiro`).
- Si vous n'avez pas ce droit, l'adresse `/chiro` vous renvoie vers l'accueil de l'application.

Dans le module, toute personne qui y a accès peut créer, modifier et supprimer les relevés, les observations et les sites.

## Page d'accueil

La page **Chiroptères** propose deux blocs :

- **Consulter** : boutons **Relevés** (liste des relevés) et **Sites** (liste des sites).
- **Saisir** : boutons **Nouveau relevé** et **Nouveau site**.

## Relevés

### Liste des relevés

La page **Liste des relevés** affiche un tableau paginé (colonnes **Commune**, **Site**, **Date**, **Opérateur(s)**, **Nb espèces**, **Nb individus**). Cliquez sur un en-tête pour trier.

Filtres disponibles au-dessus du tableau :

- **Commune** et **Espèce** : listes déroulantes (**Toutes** pour retirer le filtre).
- **Année** : saisissez l'année (par exemple 2024), le tableau se recharge à la validation du champ.
- **Filtre texte** : filtre immédiat sur le contenu du tableau (commune, site...).

Cliquez sur une ligne pour ouvrir la fiche du relevé. Le bouton **Retour** ramène à l'accueil du module.

### Fiche d'un relevé

Le titre indique la date du relevé et le nom du site. La fiche comporte deux onglets.

**Onglet Relevé** : informations administratives (date de saisie, créateur), date d'observation, localisation (commune, site, coordonnées Lambert 93, habitat), programme ou étude, observateurs et commentaire.

Pour modifier le relevé :

1. Cliquez sur **Modifier** en haut de la fiche.
2. Modifiez la date, la commune, la précision de localisation, les coordonnées X et Y (Lambert 93), le code habitat, la liste des observateurs ou le commentaire. La date et la commune sont obligatoires.
3. Cliquez sur **Enregistrer**, ou sur **Annuler** (ou **Annuler édition**) pour abandonner.

**Onglet Observations** : liste des espèces observées (espèce, nombre, dénombrement, méthode, statut biologique, stade, sexe, état biologique). Des icônes signalent une mortalité, des biométries ou un commentaire ; survolez-les pour lire le détail.

Pour ajouter une observation :

1. Cliquez sur **Nouvelle observation**.
2. Renseignez au minimum **Espèce** et **Nombre**, puis les autres champs utiles (**Type d'observation**, **Dénombrement**, **Objet**, **Méthode**, **Statut biologique**, **Stade**, **Sexe**, **État biologique**, **Commentaire**).
3. Si le type d'observation correspond à une mortalité, une section **Mortalité** apparaît : **Cause de mortalité**, case **Test rabique effectué** et, si elle est cochée, **Résultat du test**.
4. Cliquez sur **Enregistrer**.

Sur chaque ligne, les icônes **Modifier** et **Supprimer** permettent de corriger ou de retirer une observation.

### Supprimer un relevé

Cliquez sur **Supprimer** en haut de la fiche et confirmez. La suppression est irréversible et supprime aussi toutes les observations du relevé.

### Saisir un nouveau relevé

1. Depuis l'accueil du module, cliquez sur **Nouveau relevé**.
2. **Date** : saisissez la **Date du relevé** (obligatoire).
3. **Localisation administrative** : choisissez le **Département**, puis la **Commune** (obligatoire). Cliquez sur **Choisir un site** pour rattacher le relevé à un site chiroptères : recherchez-le par code ou par nom, puis sélectionnez-le.
4. **Observateur(s)** : renseignez la **Liste des observateurs**.
5. **Localisation géographique** (facultatif) : cliquez sur **Saisir des coordonnées**, puis saisissez X et Y en Lambert 93 ou cliquez sur la carte. Si vous renseignez les deux, le point placé sur la carte est prioritaire. **Retirer la localisation** annule cette saisie.
6. **Commentaire** (facultatif).
7. Cliquez sur **Enregistrer**. La fiche du nouveau relevé s'ouvre : ajoutez-y les observations depuis l'onglet **Observations**.

## Sites chiroptères

### Liste des sites

La page **Sites chiroptères** affiche à gauche un tableau (**Code**, **Nom**, **Type**, **Commune**, **Relevés**, **Individus**) avec un champ **Recherche** (nom, code, commune...), et à droite une carte des sites.

- Cliquez sur une ligne, ou sur un site de la carte, pour ouvrir sa fiche.
- L'icône loupe d'une ligne (**Zoomer sur la carte**) centre la carte sur le site. Elle est grisée (**Pas de coordonnées**) si le site n'est pas localisé.

### Fiche d'un site

Le titre affiche le code et le nom du site. La fiche comporte deux onglets.

**Onglet Informations** : identification, localisation, propriété et accès, statuts, description et intérêt du site.

Pour modifier le site :

1. Cliquez sur l'icône crayon (**Modifier**).
2. Modifiez les champs. Le code et le nom sont obligatoires. Vous pouvez repositionner le site en cliquant sur la carte de la section **Localisation**.
3. Cliquez sur l'icône disquette (**Sauvegarder**), ou sur la croix (**Annuler**).

Pour supprimer le site, cliquez sur **Supprimer le site** (hors mode modification) et confirmez. La suppression est définitive.

**Onglet Relevés** : liste des relevés du site (date, opérateurs, nombre d'espèces et d'individus). Cliquez sur une ligne pour ouvrir le relevé. L'icône **Nouveau relevé** ouvre le formulaire de saisie avec ce site présélectionné.

### Créer un site

1. Depuis l'accueil du module, cliquez sur **Nouveau site**.
2. **Identification** : **Code** et **Nom du site** (obligatoires), puis type, nature, configuration, habitat et période.
3. **Localisation** : **Département** et **Commune** (obligatoires), **Description de la localisation**. Choisissez la **Position géographique** :
   - **Aucune** : pas de coordonnées ;
   - **Carte** : cliquez sur **Placer sur la carte**, puis cliquez sur la carte. **Repositionner** permet de déplacer le point, l'icône **Effacer le point** le supprime ;
   - **X / Y Lambert** : saisissez les coordonnées en Lambert 93.
4. Complétez si besoin **Propriété et accès**, **Statuts**, **Description** et **Intérêt**.
5. Cliquez sur **Enregistrer**. La fiche du nouveau site s'ouvre.

## Voir aussi

- [Utilisation de la carte](/aide/carte)
- [Questions fréquentes](/aide/faq)
