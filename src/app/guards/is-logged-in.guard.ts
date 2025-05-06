import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../login/login.service';
import { map } from 'rxjs/operators';
import { catchError, of } from 'rxjs';

export const isLoggedInGuard: CanActivateFn = (route, state) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  const user = loginService.user();

  console.log('isLoggedInGuard: Vérification de la route', route.routeConfig?.path);
  console.log('isLoggedInGuard: Utilisateur actuel', user);

  // Permettre l'accès à certaines routes publiques
  const publicRoutes = ['login', 'about', 'contact', 'documentation']; // Liste des routes publiques
  if (publicRoutes.includes(route.routeConfig?.path || '')) {
    console.log('isLoggedInGuard: Route publique détectée, accès autorisé');
    return true;
  }

  if (user === undefined) {
    console.log('isLoggedInGuard: Utilisateur non défini, tentative de récupération des utilisateurs');
    return loginService.getUsers().pipe(
      map(() => {
        console.log('isLoggedInGuard: Utilisateur récupéré avec succès, accès autorisé');
        return true;
      }),
      catchError(() => {
        console.log('isLoggedInGuard: Échec de la récupération des utilisateurs, redirection vers /login');
        router.navigate(['login']);
        return of(false);
      })
    );
  }

  if (user === null) {
    console.log('isLoggedInGuard: Utilisateur non connecté, redirection vers /login');
    router.navigate(['login']);
    return false;
  }

  console.log('isLoggedInGuard: Utilisateur connecté, accès autorisé');
  return true;
};