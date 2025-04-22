import { environment } from '../../../../environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';   

// prototypes utilisés dans la promise de la fonction
import { Projet } from './projets';
import { Operation, OperationLite } from './projet/operation/operations';
import { Objectif } from './projet/objectif/objectifs';
import { ApiResponse } from '../../../shared/interfaces/api';
import { Localisation } from '../../../shared/interfaces/localisation';

@Injectable({
  providedIn: 'root'
})
export class ProjetService {
  private activeUrl: string = environment.apiUrl +"sites/"; // Bureau

  constructor(private http: HttpClient) {}

  // PROJETS
  // Utilisé dans projet.component.ts
  async getProjet(subroute: string): Promise<Projet> {
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }

  // Utilisé dans x.component.ts
  insertProjet(projet: Projet): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=projets/insert`;
    return this.http.put<ApiResponse>(url, projet);
  }


  // OPERATIONS
  // Utilisé dans operation.component.ts
  async getOperations(subroute: string): Promise<OperationLite[]> {
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }
  
  // Utilisé dans operation.component.ts
  async getOperation(subroute: string): Promise<Operation> {
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }
  
  // Utilisé dans operation.component.ts
  insertOperation(operation: Operation): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=operations/insert`;
    return this.http.put<ApiResponse>(url, operation);
  }
  
  // updateOperation(operation: Operation): Observable<ApiResponse> {
    //   const url = `${this.activeUrl}put/table=operations/uuid=${operation.uuid_ope}`;
    //   return this.http.put<ApiResponse>(url, operation);
    // }
  
  deleteOperation(uuid_ope: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.activeUrl}delete/opegerer.operations/uuid=${uuid_ope}`).pipe(
      catchError(error => {
        console.error("Erreur lors de la suppression de l'opération:", error);
        return of({ success: false, message: "Erreur lors de la suppression de l'opération" } as ApiResponse);
      })
    );
  }
    
  // Utilisé dans objectifs.component.ts
  async getObjectif(subroute: string): Promise<Objectif> {
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }

  // Utilisé dans objectifs.component.ts
  async getObjectifs(subroute: string): Promise<Objectif[]> {
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }

  // Utilisé dans objectifs.component.ts
  insertObjectif(objectif: Operation): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=objectifs/insert`;
    return this.http.put<ApiResponse>(url, objectif);
  }
  
  // Envoyer le fichier shapefile et le type de géométrie
  // Utilisé dans objectifs.component.ts
  uploadShapefile(formData: FormData): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/ope_shapefile`;
    
    // Log du contenu du FormData avant envoi
    console.log('Contenu du FormData avant envoi depuis projetSerice.uploadShapefile():');
    for (let pair of (formData as any).entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    
    return this.http.post<ApiResponse>(url, formData).pipe(
      catchError(error => {
        console.error('Error uploading shapefile:', error);
        return of({ success: false, message: 'Error uploading shapefile' } as ApiResponse);
      })
    );
  }
  
  // Utilisé dans operation.component.ts
  async getLocalisations(subroute: string): Promise<Localisation[]> {
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }

  deleteLocalisation(loc_id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.activeUrl}delete/opegerer.localisations/uuid=${loc_id}`).pipe(
      catchError(error => {
        console.error('Erreur lors de la suppression de la localisation:', error);
        return of({ success: false, message: 'Erreur lors de la suppression de la localisation' } as ApiResponse);
      })
    );
  }
}