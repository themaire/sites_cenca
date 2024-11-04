import { environment } from '../../environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { from, Observable } from 'rxjs';

// prototypes utilisés dans la promise de la fonction
import { ListSite } from './site'; // prototype d'un site
import { Commune } from './site-detail/detail-infos/commune';
import { DocPlan } from './site-detail/detail-gestion/docplan';
import { MilNat } from './site-detail/detail-habitats/docmilnat';
import { Acte } from './site-detail/detail-mfu/acte';
import { ProjetLite } from './site-detail/detail-projets/projets';
import { Operation, OperationLite } from './site-detail/detail-projets/projet/operation/operations';
import { DetailSite } from './site-detail';

import { Selector } from './selector';

@Injectable({
  providedIn: 'root',
})
export class SitesService {
  private activeUrl: string = environment.apiUrl + 'sites/';

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
  updateTable(tableName: String, uuid: String, formData: any): Observable<any> {
    const url = `${this.activeUrl}put/table=${tableName}/uuid=${uuid}`; // Construire l'URL avec le UUID du site
    console.log('Dans updateTable() avec ' + url);
    
    return this.http.put<any>(url, formData).pipe(
      tap(response => {
        console.log('Mise à jour réussie:', response);
      }),
      catchError(error => {
        console.error('Erreur lors de la mise à jour', error);
        throw error;
      })
    );
  }

  getOperations(subroute: string): Observable<OperationLite[]> {
    // Est utilisé dans le step "Operations" de la page détail d'un projet pour lister les opérations du projet actuel
    const url = `${this.activeUrl}${subroute}`;
    return this.http.get<OperationLite[]>(url).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des opérations', error);
        throw error;
      })
    );
  }

  getOperation(subroute: string): Observable<Operation> {
    // Est utilisé dans le step "Operations" de la page détail d'un projet pour lister les opérations du projet actuel
    const url = `${this.activeUrl}${subroute}`;
    return this.http.get<Operation>(url).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des opérations', error);
        throw error;
      })
    );
  }

  deleteOperation(ope_uuid: string): Observable<void> {
    const url = `${this.activeUrl}delete/operations/uuid=${ope_uuid}`;
    return this.http.delete<void>(url).pipe(
      catchError(error => {
        console.error('Erreur lors de la suppression de l\'opération', error);
        throw error;
      })
    );
  }
}
