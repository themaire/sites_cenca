import { backendAdress } from '../../../../backendAdress';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// prototypes utilisés dans la promise de la fonction
import { FicheMFU } from '../acte'; // prototype d'un site

@Injectable({
  providedIn: 'root',
})
export class ActeService {
  private activeUrl: string = backendAdress + 'sites/';

  // Recherche des détails d'un site par son UUID
  async getFullMFU(subroute: string): Promise<FicheMFU> {
    const url = `${this.activeUrl}${subroute}`;
    console.log('Dans getFullMfu() avec ' + url);

    const data = await fetch(url);
    return (await data.json()) ?? [];
  }
}
