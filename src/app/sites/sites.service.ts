import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Observable } from 'rxjs';
import { Site } from './site';
import { Selector } from './selector';


@Injectable({
  providedIn: 'root'
})
export class SitesService {

  // L'objet " http " est créé dans le constructor
  constructor(private http: HttpClient) { }

  private url :string = "http://192.168.27.66:8889/Sites/"

  // getSitesById(id :string) :Observable<any> {
  //   console.log("Dans research.service.getProductById() => /Product/id="+id);	
  //   return this.http.get(this.url + id);
  // }

  // Recherche par critères ou par mots clefs
  async getSites(parametres :string): Promise<Site[]> {
    console.log("Dans getSites avec " + parametres);
    const data = await fetch(this.url + parametres);
    return await data.json() ?? [];
  }

  // getSelectors() :Observable<any> {
  //   console.log("Dans getSelectors.");
  //   return this.http.get(this.url + "selectors");
  // }

  // getSelectors(): Observable<Selector[]> {
  //   return this.http.get<Selector[]>(this.url + "selectors")
  // }

  async getSelectors(): Promise<Selector[]> {
    const data = await fetch(this.url + "selectors");
    return await data.json() ?? [];
  }


}