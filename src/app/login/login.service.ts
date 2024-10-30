import { environment } from '../../environments/environment';

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Credentials } from './credentials';
import { User } from './user.model';
import { Observable, tap, map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(private http: HttpClient) {}

  user = signal<User | undefined | null>(undefined);

  login(credentials: Credentials): Observable<User | undefined | null> {
    // console.log(backendAdress);
    return this.http.post(environment.apiUrl + 'auth/login', credentials).pipe(
      tap((result: any) => {
        localStorage.setItem('token', result['token']);
        let user = Object.assign(new User(), result['user']);
        user.initiales = this.getInitials();
        this.user.set(user);
      }),
      // Appel à getUsers() après avoir enregistré le token
      switchMap(() => this.getUsers()),
      map((result: any) => {
        return this.user();
      })
    );
  }
  getUsers(): Observable<User | undefined | null> {
    return this.http.get(environment.apiUrl + 'auth/me').pipe(
      tap((result: any) => {
        let user = Object.assign(new User(), result);
        user.initiales = this.getInitials(result['nom'], result['prenom']);
        this.user.set(user);
      }),
      map((result: any) => {
        return this.user();
      })
    );
  }

  // Méthode pour récupérer les initiales du nom et prénom
  getInitials(nom?: string, prenom?: string): string | null {
    // verifie qu'il y a bien un nom et un prénom (user= signal)
    if (nom && prenom) {
      // Extrait le premier caractère du nom et du prénom
      const nomInitial = nom.split(' ')[0][0];
      const prenomInitial = prenom.split(' ')[0][0];
      return prenomInitial! + nomInitial!;
    }
    // Retourne null si l'utilisateur ou les champs ne sont pas disponibles
    return null;
  }

  logout(): Observable<null> {
    // console.log('on est entrer dans logout');
    return this.http.get(environment.apiUrl + 'auth/logout').pipe(
      tap((result: any) => {
        // console.log('on est entrer dans tap logout');
        // console.log('on va supprimer le token');
        localStorage.removeItem('token');
        this.user.set(null);
      })
    );
  }
}
