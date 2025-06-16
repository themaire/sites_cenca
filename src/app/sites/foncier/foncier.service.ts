import { environment } from '../../../environments/environment';


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { from, Observable } from 'rxjs';

import { ApiResponse } from '../../shared/interfaces/api';

// interfaces utilisées dans la promise de la fonction
import { Extraction } from './foncier';

@Injectable({
  providedIn: 'root',
})
export class FoncierService {
  private activeUrl: string = environment.apiUrl + 'sites/foncier/';

  constructor(private http: HttpClient) {}

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
      catchError(error => {
        console.error('Erreur lors de la récupération des extractions foncières', error);
        throw error;
      })
    );
  }

  getParcellesExtractions(subroute: string): Observable<Extraction[]> {
    // Est utilisé dans le step "Operations" de la page détail d'un projet pour lister les opérations du projet actuel
    const url = `${this.activeUrl}${subroute}`;
    return this.http.get<Extraction[]>(url).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des extractions foncières', error);
        throw error;
      })
    );
  }

  // A VERIFIER - TOUT NEUF
  insertExtraction(extraction: any): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=extractions/insert`;
    return this.http.put<ApiResponse>(url, extraction).pipe(
      tap(response => {
        console.log('Insertion réussie:', response);
      }),
      catchError(error => {
        console.error('Erreur lors de l\'insertion', error);
        throw error;
      })
    );
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

  deleteExtraction(ope_uuid: string): Observable<void> {
    const url = `${this.activeUrl}delete/operations/uuid=${ope_uuid}`;
    return this.http.delete<void>(url).pipe(
      catchError(error => {
        console.error('Erreur lors de la suppression de l\'opération', error);
        throw error;
      })
    );
  }
}