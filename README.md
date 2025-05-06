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
  - [Notes](#notes)

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

## Notes
Ce projet utilise un webhook pour déclencher des builds Jenkins. Assurez-vous que le webhook est correctement configuré pour votre dépôt.