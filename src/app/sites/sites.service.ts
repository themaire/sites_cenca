import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { ListSite } from './site'; // prototype d'un site
import { DetailSite } from './site-detail';
import { Selector } from './selector';


@Injectable({
  providedIn: 'root'
})
export class SitesService {

  // L'objet " http " est créé dans le constructor
  constructor(private http: HttpClient) { }

  private url :string = "http://192.168.27.66:8889/Sites/"

  // Recherche par critères ou par mots clefs
  async getSiteUUID(paramUUID :string): Promise<DetailSite> {
    // console.log("Dans getSiteUUID avec " + paramUUID);
    const data = await fetch(this.url + paramUUID);
    return await data.json() ?? [];
  }

  // Recherche par critères ou par mots clefs
  // Pour la recherche de sites uniquement
  async getSites(parametres :string): Promise<ListSite[]> {
    // console.log("Dans getSites avec " + parametres);
    const data = await fetch(this.url + parametres);
    return await data.json() ?? [];
  }

  async getSelectors(): Promise<Selector[]> {
    const data = await fetch(this.url + "selectors");
    return await data.json() ?? [];
  }
}