import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// prototypes utilisés dans la promise de la fonction
import { MenuItem } from './menuItem';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  // private url :string = "http://192.168.27.66:8889/Sites/"
  private url :string = "http://192.168.1.50:8889/Sites/"

  // L'objet " http " est créé dans le constructor
  constructor(private http: HttpClient) { }


  async getMenu(subroute: string): Promise<MenuItem[]> {
    const url = `${this.url}${subroute}`;
    
    const data = await fetch(this.url + subroute);
    return await data.json() ?? [];
  }

}