import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../login/login.service';
import { User } from '../login/user.model';
import { map, catchError, of } from 'rxjs';

export const isFoncierGuard: CanActivateFn = (route, state) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  const checkAccess = (user: User | null | undefined): boolean => {
    if (!user) {
      router.navigate(['login']);
      return false;
    }
    if (loginService.isFoncier()) {
      return true;
    }
    router.navigate(['/']);
    return false;
  };

  const user = loginService.user();

  if (user === undefined) {
    return loginService.getUsers().pipe(
      map(() => checkAccess(loginService.user())),
      catchError(() => {
        router.navigate(['login']);
        return of(false);
      })
    );
  }

  return checkAccess(user);
};
