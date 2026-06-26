# Documents planificateurs et entités cohérentes de gestion

## Qu'est-ce qu'un document planificateur ?

Un **document planificateur** est un document officiel qui définit les orientations de gestion d'un ou plusieurs sites naturels sur une période donnée. Il peut s'agir d'un plan de gestion, d'un document d'objectifs (DOCOB), d'un plan de conservation, etc.

Chaque document planificateur regroupe les informations suivantes :

- **Nom** : intitulé complet du document
- **Années de validité** : période couverte (année début / année fin)
- **Type de document** : nature du document (plan de gestion, DOCOB…)
- **Surface concernée** : superficie en hectares du ou des sites couverts
- **Année d'évaluation** : si le document a fait l'objet d'une évaluation
- **Document en cours de validité** : indique si le document est encore actif
- **PDF** : lien vers le document numérisé (renseigné par les administrateurs)

> Un même document peut concerner **plusieurs sites**. Dans ce cas, ne créez pas le document plusieurs fois — associez-lui une entité cohérente de gestion (voir ci-dessous).

---

## Consulter les documents planificateurs

### Depuis la fiche d'un site

1. Ouvrez la fiche d'un site (via la liste ou la carte)
2. Cliquez sur l'onglet **Gestion**
3. Le tableau liste tous les documents planificateurs associés à ce site
4. Cliquez sur une ligne pour ouvrir la fiche détaillée du document

### Depuis la route /docplan

La page **Documents de plans de gestion** (accessible via le menu) affiche l'ensemble des documents de tous les sites. Vous pouvez :

- **Filtrer** par site, type de document, ou validité en cours
- **Cliquer sur une ligne** pour ouvrir la fiche du document
- **Trier** les colonnes en cliquant sur leur en-tête

---

## Créer un document planificateur

1. Depuis l'onglet **Gestion** d'un site, cliquez sur le bouton **+**
2. Remplissez les champs obligatoires (marqués d'un `*`) :
   - Nom du document
   - Année début
   - Type de document
   - Document en cours de validité
3. Cliquez sur **Enregistrer**

---

## Modifier un document planificateur

1. Ouvrez la fiche du document (depuis l'onglet Gestion ou la page /docplan)
2. Cliquez sur l'icône **crayon** pour passer en mode édition
3. Modifiez les champs souhaités
4. Cliquez sur **Enregistrer**

> Le lien vers le PDF n'est modifiable que par les **administrateurs**.

---

## Supprimer un document planificateur

1. Ouvrez la fiche du document
2. Cliquez sur **Supprimer le document planificateur** (bouton en bas de la fiche)
3. Confirmez la suppression dans la boîte de dialogue

⚠️ **Attention** : cette action est irréversible. Le document sera définitivement supprimé.

---

## Qu'est-ce qu'une entité cohérente de gestion (ECG) ?

Une **entité cohérente de gestion** (ECG) regroupe plusieurs sites qui font l'objet d'un même document planificateur. Elle permet de matérialiser le fait qu'un plan de gestion couvre un ensemble de sites qui forment une unité fonctionnelle, même s'ils ne sont pas officiellement désignés ainsi dans le document.

Chaque ECG possède :
- un **nom** qui l'identifie
- la **liste des sites** qui lui sont associés (calculée automatiquement)

---

## Gérer les entités cohérentes de gestion

### Ouvrir le gestionnaire d'ECG

Depuis la page **/docplan**, cliquez sur le bouton **Entités cohérentes** (en haut à droite de la page). La fenêtre liste toutes les ECG existantes avec les sites associés à chacune.

### Créer une ECG

1. Dans le gestionnaire, cliquez sur **Nouvelle entité cohérente**
2. Saisissez un nom
3. Cliquez sur **Créer**

### Supprimer une ECG

Le bouton de suppression (corbeille) est **actif uniquement si l'ECG n'est associée à aucun document planificateur**. Si des documents lui sont encore rattachés, retirez d'abord l'ECG de ces documents.

---

## Associer une ECG à un document planificateur

1. Ouvrez la fiche du document planificateur en mode **édition**
2. Dans la section **Entité cohérente de gestion**, cliquez sur **Assigner une entité cohérente**
3. Dans la fenêtre qui s'ouvre, sélectionnez l'ECG souhaitée en cliquant sur **Définir**
   - Si l'ECG n'existe pas encore, créez-la depuis cette même fenêtre
4. L'ECG et les sites associés s'affichent dans la fiche
5. **Enregistrez** le document pour valider l'association

### Retirer une ECG d'un document

En mode édition, cliquez sur l'icône **délier** (à droite du nom de l'ECG) pour retirer l'association. N'oubliez pas d'enregistrer.
