import { Injectable, Inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Credentials } from './credentials';
import { User } from './user.model';
import { backendAdress } from '../backendAdress';
import { Observable, pipe, tap, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(private http: HttpClient) {}

  user = signal<User | undefined | null>(undefined);

  login(credentials: Credentials): Observable<User | undefined | null> {
    console.log(backendAdress);
    return this.http.post(backendAdress + 'auth/login', credentials).pipe(
      tap((result: any) => {
        localStorage.setItem('token', result['token']);
        const user = Object.assign(new User(), result['user']);
        this.user.set(user);
      }),
      map((result: any) => {
        return this.user();
      })
    );
  }
  getUsers(): Observable<User | undefined | null> {
    return this.http.get(backendAdress + 'auth/me').pipe(
      tap((result: any) => {
        const user = Object.assign(new User(), result);
        this.user.set(user);
      }),
      map((result: any) => {
        return this.user();
      })
    );
  }

  logout(): Observable<null> {
    console.log('on est entrer dans logout');
    return this.http.get(backendAdress + 'auth/logout').pipe(
      tap((result: any) => {
        console.log('on est entrer dans tap logout');
        console.log('on va supprimer le token');
        localStorage.removeItem('token');
        this.user.set(null);
      })
    );
  }
}
