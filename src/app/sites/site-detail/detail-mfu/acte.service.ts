import { environment } from '../../../../environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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

  insertActe(acte: any): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=actes_mfu/insert`;
    return this.http.put<ApiResponse>(url, acte);
  }

  updateActe(uuid_acte: string, acte: any): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=actes_mfu/uuid=${uuid_acte}`;
    return this.http.put<ApiResponse>(url, acte);
  }

  deleteActe(uuid_acte: string): Observable<ApiResponse> {
    return this.http
      .delete<ApiResponse>(
        `${this.activeUrl}delete/sitcenca.actes_mfu/uuid_acte=${uuid_acte}`
      )
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
}
