import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';   

// prototypes utilisés dans la promise de la fonction
import { MenuItem } from './menuItem';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  // private url :string = "http://192.168.27.66:8889/menu/"
  private url :string = "http://192.168.1.50:8889/manu/"

  // L'objet " http " est créé dans le constructor
  constructor(private http: HttpClient) { }


  async getMenu(subroute: string): Promise<MenuItem[]> {
    const url = `${this.url}${subroute}`;
    
    const data = await fetch(this.url + subroute);
    return await data.json() ?? [];
  }

  getMenu2(subroute: string): Observable<MenuItem[]> {
    const url = `${this.url}${subroute}`;

    return this.http.get<MenuItem[]>(url).pipe(
      catchError(() => of([])) // Gestion des erreurs : retourne un tableau vide en cas d'erreur
    );
  }

}