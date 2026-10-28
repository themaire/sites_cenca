# Ajouter une géométrie à une opération

Cette fiche explique comment rattacher une localisation (point, ligne ou polygone) à une opération d'un projet, à partir d'un fichier préparé dans un SIG.

Toutes les actions décrites ici demandent le droit d'édition.

## Où se trouvent les opérations

1. Ouvrez la fiche du site (voir [Gestion des sites](/aide/sites-management)).
2. Ouvrez l'onglet **Actions**, puis cliquez sur la ligne du projet.
3. Dans la fenêtre du projet, allez à l'étape **Opérations**.

L'étape Opérations n'existe que pour les projets saisis dans l'application. Pour créer un projet, cliquez sur l'icône **+** (**Ajouter une action**) en haut de l'onglet Actions.

## Créer l'opération

1. À l'étape Opérations, cliquez sur l'icône **+** (**Ajouter**).
2. Remplissez les étapes **Type de l'opération**, **Type de l'intervention**, **Financement** et **Informations sur l'opération** (boutons **Suivant** et **Précédent** pour naviguer).
3. Cliquez sur l'icône disquette (**Sauvegarder**).

La géométrie ne peut pas être ajoutée tant que l'opération n'a pas été enregistrée une première fois : l'étape **Données spatiales** affiche alors « La localisation sera à renseigner après le premier enregistrement de cette fiche. » Après la sauvegarde, la liste des opérations réapparaît.

## Préparer le fichier

Deux formats sont acceptés :

- **GeoJSON** : fichier `.geojson` ;
- **Shapefile** : archive `.zip` contenant les fichiers du shapefile (`.shp`, `.shx`, `.dbf`, `.prj`).

Dans QGIS, sélectionnez l'entité à envoyer, puis clic droit sur la couche > **Exporter** > **Sauvegarder les entités sélectionnées sous…**, et choisissez le format GeoJSON.

## Envoyer la géométrie

1. Dans la liste des opérations, cliquez sur la ligne de l'opération : elle s'ouvre en modification.
2. Allez à l'étape **Données spatiales**.
3. Dans **Fichier géographique (GeoJSON)**, choisissez votre fichier `.geojson` ou `.zip`.
4. Cliquez sur **Envoyer l'emprise**. Le bouton reste grisé tant qu'aucun fichier n'est choisi.

Un message confirme l'import et la géométrie s'affiche sur la carte de l'étape.

## Remplacer ou supprimer la géométrie

Une opération ne porte qu'une seule localisation : le champ d'envoi disparaît dès qu'une géométrie est enregistrée.

Pour la remplacer, cliquez sur **Supprimer la localisation** sous la carte, confirmez, puis envoyez le nouveau fichier.
