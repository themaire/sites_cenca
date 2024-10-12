import { backendAdress } from '../backendAdress';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';

// prototypes utilisés dans la promise de la fonction
import { ListSite } from './site'; // prototype d'un site
import { Commune } from './site-detail/detail-infos/commune';
import { DocPlan } from './site-detail/detail-gestion/docplan';
import { MilNat } from './site-detail/detail-habitats/docmilnat';
import { Acte } from './site-detail/detail-mfu/acte';
import { ProjetLite } from './site-detail/detail-projets/projets';
import { DetailSite } from './site-detail';

import { Selector } from './selector';

@Injectable({
  providedIn: 'root',
})
export class SitesService {
  private activeUrl: string = backendAdress + 'sites/';

  constructor(private http: HttpClient) {}

  // fonction modèle de base réutilisée pour les différentes methode de ce fichier
  async getData<T>(subroute: string): Promise<T> {
    const url = `${this.activeUrl}${subroute}`;
    console.log(`Dans getData() avec ${url}`);

    const data = await fetch(url);
    return await data.json() ?? [];
  }

  // Recherche des détails d'un site par son UUID
  async getSiteUUID(paramUUID: string): Promise<DetailSite> {
    console.log('Dans la fonction getSiteUUID du service avec ' + paramUUID);

    const data = await fetch(this.activeUrl + paramUUID);
    return (await data.json()) ?? [];
  }

  async getCommune(subroute: string): Promise<Commune[]> {
    return this.getData<Commune[]>(subroute);
  }

  async getDocPlan(subroute: string): Promise<DocPlan[]> {
    return this.getData<DocPlan[]>(subroute);
  }

  async getMilNat(subroute: string): Promise<MilNat[]> {
    return this.getData<MilNat[]>(subroute);
  }

  async getMfu(subroute: string): Promise<Acte[]> {
    return this.getData<Acte[]>(subroute);
  }

  async getProjets(subroute: string): Promise<ProjetLite[]> {
    return this.getData<ProjetLite[]>(subroute);
  }
  
    // Recherche par critères ou par mots clefs
    // Pour la recherche de sites uniquement
  async getSites(subroute: string): Promise<ListSite[]> {
    return this.getData<ListSite[]>(subroute);
  }

  async getSelectors(): Promise<Selector[]> {
    const data = await fetch(this.activeUrl + 'selectors');
    return (await data.json()) ?? [];
  }


  // Sauvegarde les modifications
  updateDetail(siteDetail: DetailSite): Observable<DetailSite> {
    const url = `${this.activeUrl}put/table=espace_site/uuid=${siteDetail.uuid_site}`; // Construire l'URL avec le UUID du site
    return this.http.put<DetailSite>(url, siteDetail);
  }

  // Sauvegarde les modifications
  async updateDetail(siteDetail: DetailSite): Promise<void> {
    const url = `${this.activeUrl}${siteDetail.uuid_site}`; // Construire l'URL avec le UUID du site

    try {
      const response = await fetch(url, {
        // Méthode PUT pour mettre à jour
        method: 'PUT',
        headers: {
          // Indiquer que le corps est en JSON
          'Content-Type': 'application/json',
        },
        // Convertir l'objet siteDetail en chaîne JSON
        body: JSON.stringify(siteDetail),
      });

      // Vérifier si la requête a réussi
      if (!response.ok) {
        throw new Error(`Erreur HTTP : ${response.status}`);
      }

      console.log('------------------------> Modifications sauvegardées');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du site :', error);
    }
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
