import { environment } from '../../../environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { from, Observable, of } from 'rxjs';

import { ApiResponse } from '../../shared/interfaces/api';

// interfaces utilisées dans la promise de la fonction
import {
  Extraction,
  ProjetMfu,
  ProjetsMfu,
  DocPmfu,
  ActeMultiSiteLite,
  SiteLite,
  ActeMultiSiteInsert,
} from './foncier';
import { ActeLite } from '../site-detail/detail-mfu/acte';

@Injectable({
  providedIn: 'root',
})
export class FoncierService {
  private activeUrl: string = environment.apiBaseUrl + 'sites/';

  constructor(private http: HttpClient) {}

  /**
   * Récupère les informations détaillées de tous les projets MFU (pour la liste des projets MFU)
   * @param subroute Sous-route à ajouter à l'URL de base
   * @returns Promise avec les infos des projets MFU
   */
  async getProjetsMfu(subroute: string): Promise<ProjetsMfu[]> {
    // Récupère les infos détaillées du projet MFU sélectionné
    const data = await fetch(this.activeUrl + subroute);
    const pmfu = (await data.json()) ?? [];
    return pmfu;
  }

  /** Récupère les infos détaillées du projet MFU sélectionné (pour la page détail d'un seul projet MFU)
    * @param subroute Sous-route à ajouter à l'URL de base
    * @return Promise avec les infos du projet MFU
  */
  async getProjetMfu(subroute: string): Promise<ProjetMfu> {
    // Récupère les infos détaillées du projet MFU sélectionné
    const data = await fetch(this.activeUrl + subroute);
    const pmfu = (await data.json()) ?? [];
    return pmfu;
  }


  /**
   * Récupère les infos des parcelles via POST sur l'API backend
   * @param idus Tableau d'idus à envoyer
   * @returns Observable<any> avec les infos des parcelles
   */
  getParcellesInfosByIdus(idus: string[]): Observable<any> {
    const url = environment.apiBaseUrl + 'api-geo/parcelles/infos-by-idus';
    const body = { idus };
    return this.http.post<any>(url, body, {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      catchError((error) => {
        console.error('Erreur lors de la récupération des infos parcelles (POST)', error);
        throw error;
      })
    );
  }

  // Sert à utiliser le fichier excel donné par l'utilisateur et l'info de l'historique pour les envoyer au backend
  processFile(file: File, writeHisto: boolean): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    formData.append('writeHisto', String(writeHisto));

    return this.http.post(`${this.activeUrl}/process`, formData);
  }

  getExtractions(subroute: string): Observable<Extraction[]> {
    // Est utilisé dans le step "Operations" de la page détail d'un projet pour lister les opérations du projet actuel
    const url = `${this.activeUrl}${subroute}`;
    return this.http.get<Extraction[]>(url).pipe(
      catchError((error) => {
        console.error(
          'Erreur lors de la récupération des extractions foncières',
          error
        );
        throw error;
      })
    );
  }

  getParcellesExtractions(subroute: string): Observable<Extraction[]> {
    // Est utilisé dans le step "Operations" de la page détail d'un projet pour lister les opérations du projet actuel
    const url = `${this.activeUrl}${subroute}`;
    return this.http.get<Extraction[]>(url).pipe(
      catchError((error) => {
        console.error(
          'Erreur lors de la récupération des extractions foncières',
          error
        );
        throw error;
      })
    );
  }

  /** Récupère les informations des parcelles à partir de son code parcelle ou idu
   * @param iduList Liste des IDU des parcelles à récupérer
   * @returns Observable avec les informations des parcelles
   */
  getParcellesInfos(subroute: string): Observable<any> {
    const url = `${this.activeUrl}${subroute}`;

    return this.http.get<any>(url).pipe(
      catchError((error) => {
        console.error('Erreur lors de la récupération des infos parcelles', error); 
        throw error;
      })
    );
  }

  // A VERIFIER - TOUT NEUF
  insertExtraction(extraction: any): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=extractions/insert`;
    return this.http.put<ApiResponse>(url, extraction).pipe(
      tap((response) => {
        console.log('Insertion réussie:', response);
      }),
      catchError((error) => {
        console.error("Erreur lors de l'insertion", error);
        throw error;
      })
    );
  }

  // Sauvegarde les modifications
  updateTable(tableName: String, uuid: String, formData: any): Observable<any> {
    const url = `${this.activeUrl}put/table=${tableName}/uuid=${uuid}`; // Construire l'URL avec le UUID du site
    console.log('Dans updateTable() avec ' + url);

    return this.http.put<any>(url, formData).pipe(
      tap((response) => {
        console.log('Mise à jour réussie:', response);
      }),
      catchError((error) => {
        console.error('Erreur lors de la mise à jour', error);
        throw error;
      })
    );
  }

  deleteExtraction(ope_uuid: string): Observable<void> {
    const url = `${this.activeUrl}delete/operations/uuid=${ope_uuid}`;
    return this.http.delete<void>(url).pipe(
      catchError((error) => {
        console.error("Erreur lors de la suppression de l'opération", error);
        throw error;
      })
    );
  }

  deletePmfu(pmfu_id: number): Observable<ApiResponse> {
    return this.http
      .delete<ApiResponse>(
        `${this.activeUrl}delete/sitcenca.projets_mfu/pmfu_id=${pmfu_id}`
      )
      .pipe(
        catchError((error) => {
          console.error("Erreur lors de la suppression de l'opération:", error);
          return of({
            success: false,
            message: "Erreur lors de la suppression de l'opération",
          } as ApiResponse);
        })
      );
  }

  async getDocMfu(subroute: string): Promise<DocPmfu> {
    const data = await fetch(this.activeUrl + subroute);
    const pmfu = (await data.json()) ?? [];
    return pmfu;
  }

  async getActesMultiSites(subroute: string = 'mfu/multi-sites/lite'): Promise<ActeMultiSiteLite[]> {
    // Nouvelle route: liste legere des actes avec leur rattachement multi-sites.
    return this.fetchArray<ActeMultiSiteLite>(subroute, 'getActesMultiSites');
  }

  async getMfuSitesLite(subroute: string = 'mfu/sites/lite'): Promise<SiteLite[]> {
    return this.fetchArray<SiteLite>(subroute, 'getMfuSitesLite');
  }

  async getSitesLiteFallback(subroute: string = 'criteria/*/*/*/*/*/*'): Promise<SiteLite[]> {
    const rows = await this.fetchArray<any>(subroute, 'getSitesLiteFallback');
    return rows.map((row: any) => ({
      uuid_site: row.uuid_site,
      nom_site: row.nom,
    }));
  }

  async getActesBySiteLite(siteUuid: string): Promise<ActeLite[]> {
    return this.fetchArray<ActeLite>(`mfu/uuid=${siteUuid}/lite`, 'getActesBySiteLite');
  }

  private async fetchArray<T>(subroute: string, context: string): Promise<T[]> {
    // Helper commun pour centraliser les controles de reponse API.
    const response = await fetch(this.activeUrl + subroute);
    let payload: unknown = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const details = typeof payload === 'object' && payload !== null ? JSON.stringify(payload) : String(payload ?? '');
      throw new Error(`${context}: HTTP ${response.status} ${details}`);
    }

    if (!Array.isArray(payload)) {
      throw new Error(`${context}: réponse non itérable`);
    }

    return payload as T[];
  }

  attachActeToSite(payload: ActeMultiSiteInsert): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=actes_mfu_multi/insert`;
    return this.http.put<ApiResponse>(url, payload).pipe(
      catchError((error) => {
        console.error('Erreur lors du rattachement multi-sites de l\'acte', error);
        throw error;
      })
    );
  }
}
