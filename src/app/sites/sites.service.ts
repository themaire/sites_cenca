import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// prototypes utilisés dans la promise de la fonction
import { ListSite } from './site'; // prototype d'un site
import { Commune } from  './site-detail/detail-infos/commune';
import { DocPlan } from  './site-detail/detail-gestion/docplan';
import { MilNat } from   './site-detail/detail-habitats/docmilnat';
import { Acte } from      './site-detail/detail-mfu/acte';
import { Operation } from      './site-detail/detail-operations/operation'; 
import { DetailSite } from './site-detail';

import { Selector } from './selector';


@Injectable({
  providedIn: 'root'
})
export class SitesService {
  // private url :string = "http://192.168.1.50:8889/Sites/"
  private url :string = "http://192.168.27.66:8889/Sites/"

  // L'objet " http " est créé dans le constructor
  constructor(private http: HttpClient) { }

  // Recherche une liste de plans de gestion par l'UUID d'un site
  // async getDocPlannn(siteUUID: string): Promise<DocPlan[]> {
  //   console.log("Dans la fonction getDocPlan(" + siteUUID + ')');
  //   const data = await fetch(this.url + siteUUID);
  //   return await data.json() ?? [];
  // }

  // Recherche des détails d'un site par son UUID
  async getSiteUUID(paramUUID :string): Promise<DetailSite> {
    console.log("Dans la fonction getSiteUUID du service avec " + paramUUID);
    
    const data = await fetch(this.url + paramUUID);
    return await data.json() ?? [];
  }

  async getCommune(subroute: string): Promise<Commune[]> {
    const url = `${this.url}${subroute}`;
    console.log("Dans getCommune() avec " + url);
    
    const data = await fetch(this.url + subroute);
    return await data.json() ?? [];
  }

  async getDocPlan(subroute: string): Promise<DocPlan[]> {
    const url = `${this.url}${subroute}`;
    console.log("Dans getDocPlan() avec " + url);
    
    const data = await fetch(this.url + subroute);
    return await data.json() ?? [];
  }

  async getMilNat(subroute: string): Promise<MilNat[]> {
    const url = `${this.url}${subroute}`;
    console.log("Dans getMilNat() avec " + url);
    
    const data = await fetch(this.url + subroute);
    return await data.json() ?? [];
  }

  async getMfu(subroute: string): Promise<Acte[]> {
    const url = `${this.url}${subroute}`;
    console.log("Dans getMfu() avec " + url);
    
    const data = await fetch(this.url + subroute);
    return await data.json() ?? [];
  }

  async getOperations(subroute: string): Promise<Operation[]> {
    const url = `${this.url}${subroute}`;
    console.log("Dans getOperations() avec " + url);
    
    const data = await fetch(this.url + subroute);
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

// Voici un exemple de comment tu pourrais refactoriser ton code :

// typescript
// CopyInsert
// async getData<T>(subroute: string): Promise<T[]> {
//   const url = `${this.url}${subroute}`;
//   console.log(`Dans getData() avec ${url}`);
  
//   const data = await fetch(url);
//   return await data.json() ?? [];
// }
// Dans cette méthode, T est un type générique qui représente le type de retour. Tu peux ensuite appeler cette méthode avec le type de retour et le sous-chemin de l'URL comme paramètres.

// Par exemple, pour récupérer les communes, tu pourrais appeler :

// typescript
// CopyInsert
// async getCommune(subroute: string): Promise<Commune[]> {
//   return this.getData<Commune[]>(subroute);
// }
// Et pour récupérer les plans de gestion, tu pourrais appeler :

// typescript
// CopyInsert
// async getDocPlan(subroute: string): Promise<DocPlan[]> {
//   return this.getData<DocPlan[]>(subroute);
// }
// Cela te permet de réduire la quantité de code dupliqué et de rendre ton code plus générique et plus facile à maintenir.

// Qu'en penses-tu ? Est-ce que cela te convient ?