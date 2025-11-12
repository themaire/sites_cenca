# Procédure dd'import de géométries dans une opération

Cette fiche décrit le workflow d'import d'un fichier zip contenant un shapefile (SIG) pour l'insertion de géométries dans la base de données.

## Objectif
Permettre à un utilisateur d'envoyer un zip contenant un shapefile (fichiers .shp, .dbf, etc.) afin d'insérer la géométrie dans une opération.

## Workflow

1. **Téléchargement du fichier de modèle**

2. **Décompression du zip téléchargé**

3. **Ouverture du shapefile dans QGIS**

4. **Copiez votre géométrie de votre couche source et collez là dans la couche modèle précédement ajoutée à QGIS**

5. **Sauvegardez et allez re-zipper le shapefile ainsi précédement modifié par vos soins**

6. **Chargez ce zip dans la fiche opération de l'application et validez**

7. **Un carte apparait, votre géométrie est visible! 👍**


Cas d'erreur typiques :

* Vous n'avez pas utilisé le modèle founi

## Points d’attention
- Un seul polygone dans le cas d'une couche de type polygone. Si votre même opération est en deux zones, alors faite un multi-polygone.

---

*Documenté le 31/10/2025.*
