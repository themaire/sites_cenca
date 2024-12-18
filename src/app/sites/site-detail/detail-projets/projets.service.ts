import { environment } from '../../../../environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';   

// prototypes utilisés dans la promise de la fonction
import { Projet } from './projets';
import { Operation, OperationLite } from './projet/operation/operations';
import { ApiResponse } from '../../../shared/interfaces/api';

@Injectable({
  providedIn: 'root'
})
export class ProjetService {
  private activeUrl: string = environment.apiUrl +"sites/"; // Bureau

  constructor(private http: HttpClient) {}

  async getProjet(subroute: string): Promise<Projet> {
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }
  
  async getOperations(subroute: string): Promise<OperationLite[]> {
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }
  
  async getOperation(subroute: string): Promise<Operation> {
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }

  insertDetail(operation: Operation): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=operations/insert`; // Construire l'URL avec le UUID du site
    return this.http.put<ApiResponse>(url, operation);
  }

  updateDetail(operation: Operation): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=operations/uuid=${operation.uuid_ope}`; // Construire l'URL avec le UUID du site
    return this.http.put<ApiResponse>(url, operation);
  }
}