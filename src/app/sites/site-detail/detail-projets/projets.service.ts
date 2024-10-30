import { environment } from '../../../../environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';   

// prototypes utilisés dans la promise de la fonction
import { Projet } from './projets';
import { Operation, OperationLite } from './projet/operation/operations';

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

  insertDetail(operation: Operation): Observable<Operation> {
    const url = `${this.activeUrl}put/table=operation/insert`; // Construire l'URL avec le UUID du site
    return this.http.put<Operation>(url, operation);
  }
}