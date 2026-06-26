import { environment } from '../../../environments/environment';

import { Injectable } from '@angular/core';

import { DocPlanListe } from './docplan';
import { Selector } from '../../shared/interfaces/selector';

@Injectable({
  providedIn: 'root',
})
export class DocplanService {
  private activeUrl: string = environment.apiUrl + 'sites/';

  async getData<T>(subroute: string): Promise<T> {
    const url = `${this.activeUrl}${subroute}`;
    console.log(`DocplanService → fetch : ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status} sur ${url} — ${body}`);
    }

    return (await response.json()) ?? [];
  }

  async getSelectors(): Promise<Selector[]> {
    return this.getData<Selector[]>('selectors_pgestion');
  }

  async getDocplans(subroute: string): Promise<DocPlanListe[]> {
    console.log(`Dans getDocplans() avec ${subroute}`);
    return this.getData<DocPlanListe[]>(subroute);
  }
}
