import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';   

// prototypes utilisés dans la promise de la fonction
import { MenuItem } from './menuItem';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private url1: string = "http://192.168.27.66:8889/menu/"; // Télétravail
  private url2: string = "http://192.168.1.50:8889/menu/"; // Bureau
  private activeUrl: string = this.url1; // URL par défaut

  // L'objet " http " est créé dans le constructor
  constructor(private http: HttpClient) {
    this.detectBackend();
  }

  // Méthode pour tester et définir l'URL correcte
  detectBackend(): void {
    // this.http.get(`${this.url1}parent=null`).pipe(
    this.http.get(`${this.url1}parent=null`).pipe(
      catchError(() => {
        // Si l'URL 1 échoue, essayer avec URL 2
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.activeUrl = this.url1;
      } else {
        this.activeUrl = this.url2;
      }
    });
  }

  private menuItemsSubject = new BehaviorSubject<MenuItem[]>([]);
  menuItems$ = this.menuItemsSubject.asObservable();

  async getMenu(subroute: string): Promise<MenuItem[]> {
    const url = `${this.activeUrl}${subroute}`;
    
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }

  // getMenu2(subroute: string): Observable<MenuItem[]> {
  //   const url = `${this.url}${subroute}`;

  //   return this.http.get<MenuItem[]>(url).pipe(
  //     catchError(() => of([])) // Gestion des erreurs : retourne un tableau vide en cas d'erreur
  //   );
  // }
  // private menuItemsSubject = new BehaviorSubject<MenuItem[]>([]);
  // menuItems$ = this.menuItemsSubject.asObservable();


  loadMenuItems(): void {
    let subroute: string = "parent=null";
    this.getMenu(subroute).then((mainMenuItems) => {
      // Ici, compléter les sous-menus pour chaque élément
      const loadChildren = async () => {
        for (let item of mainMenuItems) {
          let subroute: string = `parent=${item.id}`;
          item.children = await this.getMenu(subroute);
        }
        // Met à jour le BehaviorSubject une fois les données chargées
        this.menuItemsSubject.next(mainMenuItems);
      };

      loadChildren();
    });
  }

}