# Documentation : Authentification et gestion du token dans AppComponent

## Fichier concerné
`src/app/app.component.ts`

## Rôle du composant
`AppComponent` est le composant racine de l’application Angular. Il gère l’initialisation globale, l’affichage du header/footer, et surtout la logique d’authentification utilisateur.

## Logique d’authentification

### 1. Vérification du token
- À chaque navigation, le composant vérifie si un token d’authentification est présent dans le `localStorage`.
- Si le token existe, il tente de récupérer l’utilisateur via le backend (`loginService.getUsers()`).
- Si le backend répond une erreur (ex : token expiré ou invalide), le token est supprimé du `localStorage` pour éviter les boucles de redirection ou les faux positifs.

### 2. Routes publiques
- Une liste de routes publiques est définie (`/aide`, `/documentation`, `/login`, `/reset-password`, `/not-found`).
- Sur ces routes, aucune vérification du token ni redirection n’est effectuée, permettant l’accès même sans être connecté.

### 3. Redirections
- Si l’utilisateur est sur `/login` et que le token est valide, il est redirigé vers la page d’accueil.
- Si le token est absent ou invalide, l’utilisateur est redirigé vers `/login` (sauf sur les routes publiques ou en mode reset-password).

## Sécurité et robustesse
- La suppression automatique du token en cas d’erreur d’authentification évite les problèmes de session fantôme et les boucles de redirection.
- La logique protège l’accès aux routes privées tout en laissant les routes publiques accessibles à tous.

## Exemple de code clé
```typescript
const publicRoutes = ['/aide', '/documentation', '/login', '/reset-password', '/not-found'];
if (!publicRoutes.some(route => this.router.url.startsWith(route))) {
  this.checkToken();
}
// ...
checkToken() {
  if (publicRoutes.some(route => this.router.url.startsWith(route))) return;
  this.token = localStorage.getItem('token');
  if (this.token) {
    this.loginService.getUsers().subscribe({
      error: () => {
        localStorage.removeItem('token');
        this.token = null;
        if (this.router.url !== '/login') this.navigate('login');
      }
    });
  }
}
```

## À retenir
- Cette logique est centrale pour la sécurité et l’expérience utilisateur.
- Elle doit être maintenue à jour si de nouvelles routes publiques sont ajoutées ou si la gestion du token évolue.
