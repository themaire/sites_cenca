import { environment } from '../../environments/environment';

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Credentials } from './credentials';
import { User } from './user.model';
import { Observable, tap, map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

/**
 * Service de connexion
 * @description
 * - login: envoie les identifiants de l'utilisateur et récupère le token
 * - getUsers: récupère les informations de l'utilisateur connecté
 * - getInitials: récupère les initiales de l'utilisateur
 * - logout: déconnecte l'utilisateur et supprime le token
 */
export class LoginService {
  constructor(private http: HttpClient) {}

  user = signal<User | undefined | null>(undefined);

  /**
   * Authentifie un utilisateur en utilisant les identifiants fournis et récupère les informations de l'utilisateur.
   * 
   * @param credentials - Les identifiants de connexion contenant le nom d'utilisateur et le mot de passe.
   * @returns Un observable qui émet l'objet utilisateur authentifié, ou `undefined`/`null` en cas d'échec d'authentification.
   * 
   * Cette méthode effectue les étapes suivantes :
   * 1. Envoie une requête POST au point de terminaison d'authentification avec les identifiants fournis.
   * 2. Stocke le token reçu dans le stockage local.
   * 3. Mappe les données utilisateur reçues à un objet `User` et définit des propriétés supplémentaires comme les initiales.
   * 4. Met à jour l'état de l'utilisateur en utilisant la méthode `this.user.set()`.
   * 5. Appelle `getUsers()` après avoir stocké le token pour récupérer des données supplémentaires liées à l'utilisateur.
   * 6. Retourne l'objet utilisateur actuel après traitement.
   */
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

  /**
   * Récupère les informations de l'utilisateur connecté.
   * 
   * @returns Un observable qui émet l'objet utilisateur actuel, ou `undefined`/`null` si aucune donnée n'est disponible.
   * 
   * Cette méthode effectue les étapes suivantes :
   * 1. Envoie une requête GET au point de terminaison d'authentification pour récupérer les données de l'utilisateur.
   * 2. Mappe les données reçues à un objet `User` et définit des propriétés supplémentaires comme les initiales.
   * 3. Met à jour l'état de l'utilisateur en utilisant la méthode `this.user.set()`.
   */
  getUsers(): Observable<User | undefined | null> {
    console.log('LoginService: getUsers() appelé');
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

  /**
   * Récupère les initiales de l'utilisateur à partir de son nom et prénom.
   * 
   * @param nom - Le nom de l'utilisateur.
   * @param prenom - Le prénom de l'utilisateur.
   * @returns Une chaîne contenant les initiales, ou `null` si le nom ou le prénom n'est pas fourni.
   * 
   * Cette méthode extrait la première lettre du nom et du prénom, puis les concatène.
   */
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

  /**
   * Déconnecte l'utilisateur en supprimant le token de stockage local et en mettant à jour l'état de l'utilisateur.
   * 
   * @returns Un observable qui émet `null` après la déconnexion.
   * 
   * Cette méthode effectue les étapes suivantes :
   * 1. Envoie une requête GET au point de terminaison de déconnexion.
   * 2. Supprime le token du stockage local.
   * 3. Met à jour l'état de l'utilisateur en utilisant la méthode `this.user.set(null)`.
   */
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
