import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// prototypes utilisés dans la promise de la fonction
import { ListSite } from './site'; // prototype d'un site
import { Commune } from './site-detail/detail-infos/commune';
import { DocPlan } from './site-detail/detail-gestion/docplan';
import { MilNat } from './site-detail/detail-habitats/docmilnat';
import { Acte } from './site-detail/detail-mfu/acte';
import { Operation } from './site-detail/detail-operations/operation';
import { DetailSite } from './site-detail';

import { Selector } from './selector';

@Injectable({
  providedIn: 'root',
})
export class SitesService {
  private activeUrl: string = 'http://192.168.1.50:8889/sites/'; // Bureau
  // private activeUrl: string = 'http://192.168.27.66:8889/sites/'; // Télétravail

  // Recherche une liste de plans de gestion par l'UUID d'un site
  // async getDocPlannn(siteUUID: string): Promise<DocPlan[]> {
  //   console.log("Dans la fonction getDocPlan(" + siteUUID + ')');
  //   const data = await fetch(this.url + siteUUID);
  //   return await data.json() ?? [];
  // }

  // Recherche des détails d'un site par son UUID

  async getSiteUUID(paramUUID: string): Promise<DetailSite> {
    console.log('Dans la fonction getSiteUUID du service avec ' + paramUUID);

    const data = await fetch(this.activeUrl + paramUUID);
    return (await data.json()) ?? [];
  }

  async getCommune(subroute: string): Promise<Commune[]> {
    const url = `${this.activeUrl}${subroute}`;
    console.log('Dans getCommune() avec ' + url);

    const data = await fetch(this.activeUrl + subroute);
    return (await data.json()) ?? [];
  }

  async getDocPlan(subroute: string): Promise<DocPlan[]> {
    const url = `${this.activeUrl}${subroute}`;
    console.log('Dans getDocPlan() avec ' + url);

    const data = await fetch(this.activeUrl + subroute);
    return (await data.json()) ?? [];
  }

  async getMilNat(subroute: string): Promise<MilNat[]> {
    const url = `${this.activeUrl}${subroute}`;
    console.log('Dans getMilNat() avec ' + url);

    const data = await fetch(this.activeUrl + subroute);
    return (await data.json()) ?? [];
  }

  async getMfu(subroute: string): Promise<Acte[]> {
    const url = `${this.activeUrl}${subroute}`;
    console.log('Dans getMfu() avec ' + url);

    const data = await fetch(this.activeUrl + subroute);
    return (await data.json()) ?? [];
  }

  async getOperations(subroute: string): Promise<Operation[]> {
    const url = `${this.activeUrl}${subroute}`;
    console.log('Dans getOperations() avec ' + url);

    const data = await fetch(this.activeUrl + subroute);
    return (await data.json()) ?? [];
  }

  // Recherche par critères ou par mots clefs
  // Pour la recherche de sites uniquement
  async getSites(parametres: string): Promise<ListSite[]> {
    // console.log("Dans getSites avec " + parametres);

    const data = await fetch(this.activeUrl + parametres);
    return (await data.json()) ?? [];
  }

  async getSelectors(): Promise<Selector[]> {
    const data = await fetch(this.activeUrl + 'selectors');
    return (await data.json()) ?? [];
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
