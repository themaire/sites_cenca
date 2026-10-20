# Plans de gestion

Cette fiche explique comment consulter et saisir les documents planificateurs (plans de gestion, DOCOB…) des sites, et comment les relier entre sites grâce aux entités cohérentes de gestion (ECG).

Si la page affiche « Fonctionnalité en cours de déploiement », la fonctionnalité n'est pas encore ouverte sur votre installation.

## Droits

- Consultation : tous les utilisateurs connectés.
- Création, modification et suppression d'un document, assignation d'une ECG : droit d'édition.
- Champ **URL du PDF** : réservé aux profils au-delà du simple droit d'édition (cadres et administrateurs notamment).

## Ce que contient un document planificateur

Nom du document, Année début, Année fin, Type de document, Surface du site concerné (ha), Année d'évaluation, Document en cours de validité ?, lien vers le PDF et entité cohérente de gestion.

Un même document peut couvrir plusieurs sites. Dans ce cas, ne le saisissez pas plusieurs fois : rattachez-le à une entité cohérente de gestion qui regroupe ces sites.

## Consulter

### Depuis la fiche d'un site

1. Ouvrez la fiche du site (voir [Gestion des sites](/aide/sites-management)).
2. Ouvrez l'onglet **Plans de gestion** (sur téléphone : **Gestion**).
3. Le tableau liste les documents du site (Nom du document, Début, Fin, En cours, PDF). L'icône PDF ouvre le document dans un nouvel onglet.
4. Cliquez sur une ligne pour ouvrir la fiche du document.

### Depuis la page Documents de plans de gestion

La page `/docplan` liste les documents de tous les sites.

1. Choisissez vos filtres : année de début, localisation, type de document, validité.
2. Cliquez sur **Sélection des documents**.
3. Affinez si besoin avec **Mots-clés**, triez en cliquant sur les en-têtes, puis cliquez sur une ligne pour ouvrir la fiche.

## Créer un document

1. Dans l'onglet Plans de gestion du site, cliquez sur l'icône **+** (**Ajouter un document planificateur**).
2. Remplissez les champs obligatoires (marqués `*`) : Nom du document, Année début, Type de document, Document en cours de validité ?
3. Cliquez sur l'icône disquette (**Sauvegarder**).

## Modifier un document

1. Ouvrez la fiche du document.
2. Cliquez sur l'icône crayon (**Modifier**).
3. Modifiez les champs, puis cliquez sur la disquette (**Sauvegarder**). La croix (**Annuler**) restaure les valeurs d'origine.

## Supprimer un document

1. Ouvrez la fiche du document.
2. Cliquez sur **Supprimer le document planificateur** en bas de la fiche.
3. Confirmez. La suppression est irréversible.

## Assigner une entité cohérente de gestion

1. Ouvrez la fiche du document et passez en modification (crayon).
2. Dans la section **Entité cohérente de gestion**, cliquez sur **Assigner une entité cohérente**.
3. Dans la liste, cliquez sur **Définir** en face de l'ECG voulue (le champ **Rechercher** filtre par nom ou par site).
4. Si l'ECG n'existe pas : cliquez sur l'icône **+** (**Créer une nouvelle entité cohérente**), saisissez son nom puis cliquez sur **Créer et définir**.
5. Enregistrez le document avec la disquette (**Sauvegarder**).

Pour retirer l'ECG d'un document, en modification, cliquez sur l'icône **Retirer l'entité cohérente de gestion** à droite de son nom, puis enregistrez.

## Gérer les entités cohérentes de gestion

Sur la page `/docplan`, cliquez sur l'icône à droite des filtres (**Gérer les entités cohérentes de gestion**). La fenêtre liste chaque ECG avec ses **Sites concernés**.

- **Créer** : icône **+**, saisissez le nom, puis **Créer et définir**.
- **Supprimer** : icône corbeille. Elle est grisée tant que l'ECG est utilisée par des sites ; l'infobulle indique lesquels.
