import { backendAdress } from '../../../backendAdress';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';   

// prototypes utilisés dans la promise de la fonction
import { Projet } from './projets';
import { Operation } from './projet/operation/operations';

@Injectable({
  providedIn: 'root'
})
export class ProjetService {
  private activeUrl: string = backendAdress +"sites/"; // Bureau

  // Reste a completer l'interface à utiliser

  async getProjet(subroute: string): Promise<Projet> {
    const url = `${this.activeUrl}${subroute}`;
    
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }
  
  async getOperations(subroute: string): Promise<Operation[]> {
    const url = `${this.activeUrl}${subroute}`;
    
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }

}