import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';

// prototypes utilisés dans la promise de la fonction
import { MenuItem } from './menuItem';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private url1: string = 'http://192.168.1.50:8889/menu/'; // Bureau
  private url2: string = 'http://192.168.27.66:8889/menu/'; // Télétravail
  private activeUrl: string = this.url1; // URL par défaut

  // L'objet " http " est créé dans le constructor
  constructor(private http: HttpClient) {
    this.getPublicIp().subscribe((data: any) => {
      if (data.ip == '212.39.135.202') {
        this.activeUrl = this.url1;
      } else {
        this.activeUrl = this.url2;
      }
      console.log('Adresse IP publique du client : ', data.ip);
      console.log('Adresse du backend : ', this.activeUrl);
    });
  }

  getPublicIp() {
    return this.http.get('https://api.ipify.org?format=json');
  }

  // Méthode pour tester et définir l'URL correcte
  detectBackend(): void {
    console.log('Détection du backend à utiliser');

    // this.http.get(`${this.url1}parent=null`).pipe(
    this.http
      .get(`${this.url1}parent=null`)
      .pipe(
        catchError(() => {
          // Si l'URL 1 échoue, essayer avec URL 2
          console.log('URL1 télétravail echouée : ' + this.activeUrl);
          return of(null);
        })
      )
      .subscribe((response) => {
        if (response) {
          console.log('URL1 métravail correcte : ' + this.activeUrl);
          this.activeUrl = this.url1;
        } else {
          this.activeUrl = this.url2;
          console.log("Utilisation de l'URL2 bureau : " + this.activeUrl);
        }
      });
  }

  private menuItemsSubject = new BehaviorSubject<MenuItem[]>([]);
  menuItems$ = this.menuItemsSubject.asObservable();

  async getMenu(subroute: string): Promise<MenuItem[]> {
    const url = `${this.activeUrl}${subroute}`;

    const data = await fetch(this.activeUrl + subroute);
    return (await data.json()) ?? [];
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
    let subroute: string = 'parent=null';
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
