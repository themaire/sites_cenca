import { environment } from '../../../../environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { ApiResponse } from '../../../shared/interfaces/api';
import { Acte, ActeLite } from './acte';

@Injectable({
  providedIn: 'root',
})
export class ActeService {
  private activeUrl: string = environment.apiBaseUrl + 'sites/';

  constructor(private http: HttpClient) {}

  async getActe(subroute: string): Promise<ActeLite[]> {
    const data = await fetch(this.activeUrl + subroute);
    return (await data.json()) ?? [];
  }

  async getActeFull(subroute: string): Promise<Acte[]> {
    const data = await fetch(this.activeUrl + subroute);
    return (await data.json()) ?? [];
  }

  async getActesMultiSitesLite(subroute: string = 'mfu/multi-sites/lite'): Promise<any[]> {
    // Lecture des rattachements multi-sites utilises dans les chips de l'acte.
    const data = await fetch(this.activeUrl + subroute);
    const json = await data.json();
    
    if (!data.ok || !Array.isArray(json)) {
      console.warn(`Route ${subroute} error or non-array response:`, json);
      return [];
    }
    
    return json ?? [];
  }

  insertActe(acte: any): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=actes_mfu/insert`;
    return this.http.put<ApiResponse>(url, acte);
  }

  updateActe(uuid_acte: string, acte: any): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=actes_mfu/uuid=${uuid_acte}`;
    return this.http.put<ApiResponse>(url, acte);
  }

  deleteActe(uuid_acte: string): Observable<ApiResponse> {
    const deleteLinksUrl = `${this.activeUrl}delete/sitcenca.actes_mfu_multi/ref_uuid_acte=${uuid_acte}`;
    const deleteActeUrl = `${this.activeUrl}delete/sitcenca.actes_mfu/uuid_acte=${uuid_acte}`;

    return this.http
      .delete<ApiResponse>(deleteLinksUrl)
      .pipe(switchMap(() => this.http.delete<ApiResponse>(deleteActeUrl)))
      .pipe(
        catchError((error) => {
          console.error('Erreur lors de la suppression de l\'acte MFU:', error);
          return of({
            success: false,
            message: 'Erreur lors de la suppression de l\'acte MFU',
          } as ApiResponse);
        })
      );
  }

  detachActeFromSite(uuidActe: string, uuidSite: string, currentSiteUuid?: string): Observable<ApiResponse> {
    // Suppression d'un lien acte-site.
    const url = `${this.activeUrl}mfu/actes-multi/ref_uuid_acte=${uuidActe}/ref_uuid_site=${uuidSite}`;
    const params = currentSiteUuid ? new HttpParams().set('currentSiteUuid', currentSiteUuid) : undefined;

    return this.http.delete<ApiResponse>(url, { params }).pipe(
      catchError((error) => {
        console.error('Erreur lors du détachement du site de l\'acte MFU:', error);
        return of({
          success: false,
          message: 'Erreur lors du détachement du site de l\'acte MFU',
        } as ApiResponse);
      })
    );
  }
}
