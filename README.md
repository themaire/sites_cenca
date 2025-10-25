# SiteCenca

SiteCenca est une application Angular générée avec [Angular CLI](https://github.com/angular/angular-cli) version 17.1.3.

---

## Table des matières
- [SiteCenca](#sitecenca)
  - [Table des matières](#table-des-matières)
  - [Prérequis](#prérequis)
  - [Installation](#installation)
  - [Serveur de développement](#serveur-de-développement)
  - [Build](#build)
  - [Tests](#tests)
  - [Déploiement](#déploiement)
  - [Contribuer](#contribuer)
  - [Support](#support)
  - [Ressources supplémentaires](#ressources-supplémentaires)
  - [Architecture des composants](#architecture-des-composants)
  - [Ci/Cd](#cicd)

---

## Prérequis

Avant de commencer, assurez-vous d'avoir les outils suivants installés sur votre machine :
- [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
- [Angular CLI](https://angular.io/cli) (version 17.1.3 ou supérieure)
- [Docker](https://www.docker.com/) (si vous utilisez des conteneurs)

---

## Installation

Clonez le dépôt et installez les dépendances :

```bash
git clone https://github.com/votre-utilisateur/site-cenca.git
cd site-cenca
npm install
```

---

## Serveur de développement
Pour lancer un serveur de développement local, exécutez :

```bash
ng serve
```

Accédez à l'application dans votre navigateur à l'adresse http://localhost:4200/. L'application se rechargera automatiquement lorsque vous modifiez les fichiers source.

---

## Build
Pour construire le projet pour la production, exécutez :

```bash
ng build --configuration production
```

Les artefacts de build seront générés dans le répertoire dist/.

---

## Tests
Tests unitaires
Pour exécuter les tests unitaires avec Karma, utilisez :
```bash
ng test
```

Tests end-to-end
Pour exécuter les tests end-to-end, ajoutez un package de test e2e (comme Cypress) et exécutez :

```bash
ng test
```

---

## Déploiement
Pour déployer l'application dans un conteneur Docker, suivez ces étapes :

1. Construisez l'image Docker :
```bash
docker build -t site-cenca .
```

2. Lancez le conteneur :
```bash
docker run -d -p 80:80 --name site-cenca site-cenca
```

Accédez à l'application à l'adresse http://localhost.

---

## Contribuer
Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le dépôt.

2. Créez une branche pour votre fonctionnalité ou correctif :
```bash
docker run -d -p 80:80 --name site-cenca site-cenca
```

3. Faites vos modifications et validez-les :
```bash
git commit -m "Ajout de ma fonctionnalité"
```

4. Poussez vos changements :
```bash
git push origin feature/ma-fonctionnalite
```

5. Ouvrez une pull request sur la branche dev.

---

## Support

Si vous rencontrez des problèmes, ouvrez une issue sur le dépôt GitHub ou contactez l'équipe de développement.

---

## Ressources supplémentaires

Ressources supplémentaires
Angular CLI Documentation
Docker Documentation
Karma Documentation
Cypress Documentation

---


---

## Architecture des composants


L'application SiteCenca est organisée autour de composants Angular modulaires, chacun dédié à une fonctionnalité ou une section de l'interface. Cette architecture favorise la maintenabilité, la réutilisation et la clarté du code.

Chaque dossier principal correspond à une grande partie de l'application : navigation, authentification, administration, affichage des données, etc. Les sous-dossiers permettent de structurer les fonctionnalités plus fines (ex : cartes sur la page d'accueil, gestion des utilisateurs admin, composants partagés).

Ci-dessous, une carte ASCII illustre la structure des composants sur deux niveaux :

Voici une vue simplifiée de la structure des composants principaux :

```
src/app/
│
├── header/                # Barre de navigation et bouton d'aide
│   └── header.component.*
│
├── footer/                # Pied de page
│   └── footer.component.*
│
├── home/                  # Page d'accueil
│   ├── home.component.*
│   └── card/              # Cartes d'affichage sur la home
│       └── card.component.*
│
├── login/                 # Authentification utilisateur
│   ├── login.component.*
│   ├── login.service.ts
│   ├── credentials.ts
│   └── user.model.ts
│
├── admin/                 # Espace d'administration
│   ├── admin.component.*
│   ├── admin-service.service.ts
│   ├── admin.routes.ts
│   └── admin-users/       # Gestion des utilisateurs admin
│       └── admin-users.component.*
│
├── map/                   # Carte interactive des sites
│   └── map.component.*
│
├── shared/                # Composants réutilisables
│   ├── confirmation/
│   ├── costomMaterial/
│   ├── file-explorator/
│   ├── form-buttons/
│   ├── image-view/
│   ├── interfaces/
│   └── services/
│
├── services/              # Services Angular (API, validation, documentation)
│   ├── documentation.service.ts
│   ├── form.service.ts
│   └── custom_validators.ts
│
└── ...
```

Chaque dossier contient généralement :
- `*.component.ts` : logique du composant
- `*.component.html` : template HTML
- `*.component.scss` : styles spécifiques

---

## Ci/Cd
Ce projet utilise un webhook pour déclencher des builds via l'outil Jenkins. C'est un réglage depuis les paramètres du repo sur GitHub qui déclanche ce webhook à chaque commit sur la branche main pour le serveur de production et la branche dev pour le serveur de pré-production.