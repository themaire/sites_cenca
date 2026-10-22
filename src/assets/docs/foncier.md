# Foncier

Le module Foncier (`/foncier`) regroupe les outils de maîtrise foncière et d'usage : demandes d'extraction foncière, projets MFU et actes MFU rattachés à plusieurs sites.

## La page d'accueil Foncier

La page **Foncier** présente une carte par rubrique. Un clic sur une carte ouvre la rubrique :

- les demandes d'extraction foncière (`/foncier/extractions`) ;
- les projets MFU (`/foncier/pmfu`) : voir la fiche [Projets MFU](/aide/projets-mfu) ;
- les actes multi-sites (`/foncier/amfu`) : rattacher un acte MFU à plusieurs sites.

## Demandes d'extraction

La page liste les demandes d'extraction foncière existantes, avec leur nombre (« Nb de demandes d'extraction »). Le tableau affiche : **#**, **Demandeur**, **Code site**, **Description**, **Date**.

Pour ajouter une demande :

1. Cliquez sur le bouton **Ajouter** (+) en haut de la page.
2. Renseignez le **Code Site**. Laissez-le vide s'il s'agit d'un projet de site. Le code doit être un vrai code site ou un code CAST (08XXXXXX, 10XXXXXX, 51XXXXXX, 52XXXXXX).
3. Renseignez la **Description** (de 5 à 255 caractères).
4. Cliquez sur **Sauvegarder**. Le bouton reste grisé tant que le formulaire n'est pas valide.

**Annuler** referme le formulaire sans enregistrer.

## Actes multi-sites

Un acte MFU reste attaché à son site principal, mais peut être lié à plusieurs sites.

### Rattacher un acte à un ou plusieurs sites

1. Dans le bloc **Rattacher un acte à un site existant**, choisissez l'**Acte** dans la liste. Le champ « Rechercher un acte... » en tête de liste permet de filtrer par type, date ou site.
2. Choisissez un ou plusieurs **Site** (sélection multiple, avec « Rechercher un site... »).
3. Cliquez sur **Ajouter le rattachement**.

Les rattachements qui existent déjà sont ignorés. Un message indique le nombre de rattachements ajoutés.

### Consulter les actes

Le tableau liste tous les actes : **Type d'acte**, **Début**, **Fin**, **Nom du site** (site principal), **Nb. sites lies**.

- Le champ **Mots-clés** filtre la liste (type, date, site…).
- Les boutons **Tous les actes**, **Actes valides**, **Actes invalides** filtrent selon la validité, avec le nombre d'actes de chaque catégorie.
- Un clic sur une ligne ouvre la fiche de l'acte, la même que depuis la fiche site (voir ci-dessous).

## Les actes MFU dans la fiche site

Dans la fiche d'un site, l'onglet **Actes MFU** liste les actes du site (type, début, fin, surface totale, tacite reconduction, type de propriétaire, lien du document), avec les mêmes filtres de validité.

- **Ajouter un acte MFU** (+) crée un nouvel acte sur le site.
- Un clic sur une ligne ouvre la fiche de l'acte, en deux onglets : **Acte** et **Parcelles**.
- Dans l'onglet **Acte**, le lien **Télécharger l'acte** ouvre le document, et le bloc **Sites rattachés à cet acte** liste les sites liés. Un site rattaché autre que le site courant peut être détaché en cliquant sur sa croix, après confirmation.
- En mode modification (**Modifier cet acte**), le bouton **Rattacher cet acte à un AUTRE site** ouvre une fenêtre de recherche par code ou nom de site, puis **Rattacher**.
- **Supprimer l'acte** supprime l'acte.

## Droits

- Les pages du module Foncier ne sont pas réservées à un groupe particulier.
- Dans la fiche site, l'ajout, la modification, la suppression d'un acte et son rattachement à un autre site sont réservés aux utilisateurs ayant les droits d'édition.
- Le champ **URL document** d'un acte n'est modifiable que par les utilisateurs du groupe foncier, les cadres et les administrateurs.

Voir aussi : [Projets MFU](/aide/projets-mfu), [Gérer les sites](/aide/sites-management).
