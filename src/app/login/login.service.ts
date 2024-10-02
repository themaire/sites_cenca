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
  private http = Inject(HttpClient);

  user = signal<User | undefined | null>(undefined);

  login(credentials: Credentials): Observable<User | undefined | null> {
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
    return this.http.get(backendAdress + 'auth/login/me').pipe(
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
    return this.http.get(backendAdress + 'auth/logout').pipe(
      tap((result: any) => {
        localStorage.removeItem('token');
        this.user.set(null);
      })
    );
  }
  constructor() {}
}
