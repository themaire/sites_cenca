import { environment } from '../../../environments/environment';

import { Injectable } from '@angular/core';

import { ProjetTravaux } from './travaux';
import { Selector } from '../../shared/interfaces/selector';

@Injectable({
  providedIn: 'root',
})
export class TravauxService {
  private activeUrl: string = environment.apiUrl + 'sites/';

  async getData<T>(subroute: string): Promise<T> {
    const url = `${this.activeUrl}${subroute}`;
    console.log(`Dans getData() avec ${url}`);

    const data = await fetch(url);
    return (await data.json()) ?? [];
  }

  async getSelectors(): Promise<Selector[]> {
    return this.getData<Selector[]>('selectors_projets');
  }

  async getProjets(subroute: string): Promise<ProjetTravaux[]> {
    console.log(`Dans getProjets() avec ${subroute}`);
    return this.getData<ProjetTravaux[]>(subroute);
  }
}
