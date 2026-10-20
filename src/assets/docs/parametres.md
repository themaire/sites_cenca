# Paramètres

La page Paramètres (titre **Préférences**) est l'espace d'administration de l'application : gestion des utilisateurs, des groupes de droits et des actualités.

## Accès

- Le bouton **Paramètres** de la barre de menu n'apparaît que pour les administrateurs (le menu est chargé selon le groupe principal de l'utilisateur).
- La page s'ouvre à l'adresse `/parametres`. Elle affiche une carte par rubrique d'administration ; cliquez sur une carte pour afficher la rubrique sous les cartes.

## Gérer les utilisateurs

La rubrique utilisateurs présente le nombre d'utilisateurs, un champ **Rechercher** (nom, email, identifiant...) et un tableau (**Nom**, **Email**, **Fonction**, **Identifiant**, **Actions**).

### Créer un utilisateur

1. Cliquez sur **Ajouter un utilisateur**.
2. Dans la fenêtre **Nouvel utilisateur**, renseignez **Nom**, **Prénom**, **Identifiant** et **Email** (obligatoires ; l'email est prérempli avec le domaine du CENCA), puis **Fonction**, **Rôle**, **Date embauche**, **Date départ** et la case **Actif**.
3. Cliquez sur l'icône disquette (**Sauvegarder**).

Les groupes s'ajoutent sur un utilisateur déjà enregistré : après la création, rouvrez sa fiche pour lui attribuer ses groupes.

### Consulter et modifier un utilisateur

1. Cliquez sur l'icône œil (**Voir l'utilisateur**) de la ligne. La fenêtre **Détail utilisateur** s'ouvre en lecture.
2. Cliquez sur l'icône crayon (**Modifier**) pour activer la modification.
3. Modifiez les champs, puis cliquez sur **Sauvegarder**, ou sur la croix (**Annuler**) pour revenir aux valeurs d'origine.

Pour désactiver un compte sans le supprimer (départ d'un salarié, par exemple), décochez **Actif** et renseignez la **Date départ**.

### Attribuer ou retirer des groupes

La section **Groupes** de la fiche liste les groupes de l'utilisateur. Les boutons ne sont actifs qu'en mode modification (icône crayon).

- Pour ajouter un groupe : choisissez-le dans **Ajouter un groupe**, puis cliquez sur **Ajouter**.
- Pour retirer un groupe : cliquez sur l'icône de retrait à droite du groupe.

Ces changements sont enregistrés immédiatement. Un utilisateur peut appartenir à plusieurs groupes : ses droits s'additionnent.

### Dupliquer un utilisateur

1. Cliquez sur l'icône de copie (**Dupliquer l'utilisateur**) de la ligne.
2. Dans la confirmation, cochez éventuellement **Fonction** dans **Champs à exclure**.
3. Cliquez sur **Dupliquer**. La liste est rechargée avec le nouvel utilisateur, que vous pouvez ensuite compléter.

Le mot de passe n'est jamais recopié.

### Supprimer un utilisateur

Ouvrez la fiche, cliquez sur **Supprimer** et confirmez. La suppression est irréversible.

## Gérer les groupes

La rubrique groupes présente le nombre de groupes, un champ **Rechercher** (nom du groupe, description...) et un tableau (**#**, **Nom du groupe**, **Description**, **Actions**). La colonne **#** est l'identifiant du groupe, celui qui détermine les droits (voir le tableau ci-dessous).

- **Ajouter un groupe** : renseignez le **Nom du groupe**, la **Description** et la case **Actif**, puis sauvegardez.
- Icône œil (**Voir le groupe**) : ouvre la fiche du groupe ; l'icône crayon permet de modifier son nom, sa description et son statut.
- Icône de copie (**Dupliquer le groupe**) : crée une copie du groupe après confirmation.
- Icône corbeille (**Supprimer le groupe**), ou bouton **Supprimer** de la fiche : supprime le groupe après confirmation. Cette action est irréversible.

Créer un nouveau groupe ne lui donne aucun droit dans l'application : les droits sont attachés aux identifiants listés ci-dessous.

## Ce que permet chaque groupe

| # | Droits dans l'application |
| --- | --- |
| 1 | Consultation. Un utilisateur sans aucun groupe est traité comme membre de ce groupe. |
| 2 | Édition : création et modification des données des sites (fiche site, projets, opérations, maîtrise foncière, plans de gestion). |
| 3 | Cadre : droit d'édition, saisie du champ **URL document** des actes de maîtrise foncière, accès au module Chiroptères. |
| 4 | Cadre : droit d'édition et saisie du champ **URL document** des actes de maîtrise foncière, sans accès au module Chiroptères. |
| 5 | Administrateur : droit d'édition, saisie du champ **URL document** des actes de maîtrise foncière, accès au module Chiroptères, page Paramètres, publication des actualités et modération des commentaires. |
| 6 | Chiroptères : accès au module Chiroptères. |
| 9 | Foncier : saisie du champ **URL document** des actes de maîtrise foncière. |

Les droits se cumulent : un utilisateur à la fois dans les groupes 2 et 6 peut éditer les sites et utiliser le module Chiroptères.

## Gérer les actualités

La rubrique actualités permet de créer, modifier, publier et supprimer les actualités du fil d'accueil. La procédure est décrite dans la fiche [Actualités](/aide/actualites).
