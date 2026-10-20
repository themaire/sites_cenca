# Gestion des sites

La page **Sites** (adresse `/sites`, bandeau « Protéger ») permet de rechercher un site du CEN, d'ouvrir sa fiche, de la modifier et de créer un nouveau site.

## Rechercher un site

1. Renseignez un ou plusieurs critères dans la barre de recherche :
   - **Type** : « Site géré » ou « CAST » ;
   - **Code** : chiffres uniquement ;
   - **Nom** : 3 caractères minimum ;
   - les menus déroulants suivants (commune, milieux naturels, responsable), dont les valeurs viennent de la base.
2. Cliquez sur **Sélection des sites** (la touche Entrée fonctionne aussi dans les champs Code et Nom).

La liste affiche les colonnes Code, Statut, Nom, Communes, Milieux naturels, Bassin agence et Responsable. Vous pouvez :

- affiner le résultat avec le champ **Mots-clés** ;
- trier en cliquant sur l'en-tête d'une colonne ;
- changer le nombre de lignes par page en bas du tableau.

Cliquez sur une ligne pour ouvrir la fiche du site.

## Créer un site

1. Au-dessus de la liste, cliquez sur **Nouveau site**.
2. Remplissez le formulaire. Les champs Nom, Description du site, Code, Surface, Responsable, Type, Type d'espace et Bassin d'agence sont obligatoires. Le champ « Description sensibilité » ne s'active que si « Site sensible » est coché.
3. Cliquez sur l'icône disquette (**Sauvegarder**). Tant que le formulaire est incomplet, elle reste grisée. La croix (**Annuler**) ferme la fenêtre sans rien enregistrer.

La fiche du nouveau site s'ouvre directement. La localisation géographique et les communes se renseignent ensuite depuis cette fiche.

Un site peut aussi être créé depuis un projet de maîtrise foncière signé : voir [Projets MFU](/aide/projets-mfu).

## La fiche site

La fiche est organisée en onglets. Sur ordinateur :

| Onglet | Contenu |
| --- | --- |
| **Infos générales** | Identité du site (nom, code, surface, responsable, type, références…), communes concernées, conservateurs bénévoles |
| **Description et Ouverture** | Description, sensibilité, ouverture au public, liens CEN et MNHN |
| **Actes MFU** | Actes de maîtrise foncière et d'usage du site, filtrables (tous, valides, invalides) — voir [Foncier](/aide/foncier) |
| **Projets** | Projets du site et leurs opérations — voir [Ajouter une géométrie à une opération](/aide/ajout_shapefile) |
| **Plans de gestion** | Documents planificateurs du site — voir [Plans de gestion](/aide/plans-gestion) |
| **Habitats** | Milieux naturels et code géologie |

Sur téléphone, les mêmes contenus sont répartis en trois groupes d'onglets aux libellés raccourcis : **Infos gén.** et **Desc. et Ouv.**, puis **Actes MFU** et **Projets**, puis **Gestion** et **Habitats**.

Le bouton **Retour** ramène à la liste.

## Modifier une fiche

Réservé aux utilisateurs ayant le droit d'édition.

1. Dans l'onglet Infos générales ou Description et Ouverture, cliquez sur l'icône crayon (**Modifier**).
2. Modifiez les champs.
3. Cliquez sur l'icône disquette (**Sauvegarder**), ou sur la croix (**Annuler**) pour revenir aux valeurs d'origine.

Dans Infos générales, les communes et les conservateurs bénévoles s'ajoutent et se retirent en mode modification ; chaque ajout ou retrait est enregistré immédiatement, sans passer par la disquette. Un conservateur absent de l'annuaire peut être créé sur place avec l'icône **Créer un nouveau contact dans l'annuaire et l'ajouter comme conservateur**.

## Supprimer un site

Réservé aux utilisateurs ayant le droit d'édition. La suppression ne concerne que les sites créés par erreur.

1. Ouvrez la fiche et cliquez sur **Supprimer le site** en haut de la fiche.
2. Si des données sont rattachées au site, une fenêtre **Suppression impossible** en donne la liste ; le site n'est pas supprimé.
3. Sinon, une fenêtre de confirmation s'ouvre et indique ce qui sera supprimé avec le site. Confirmez : la suppression est irréversible.

## Partager une fiche (permalien)

Chaque fiche a une adresse directe de la forme `/site/<code>` (ou `/site/<identifiant>` pour un site sans code). Cette adresse s'affiche dans le navigateur dès que vous ouvrez une fiche.

Pour la copier, cliquez sur **Copier le lien** en haut de la fiche.

En ouvrant un permalien :

- si plusieurs sites portent le même code, la liste de ces sites s'affiche pour choisir ;
- si aucun site ne correspond, un message l'indique (lien périmé ou code modifié).
