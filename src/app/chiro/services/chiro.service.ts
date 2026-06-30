import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ListReleve, DetailReleve } from '../interfaces/releve';
import { ObservationDetail } from '../interfaces/observation';
import { ListSiteChiro, DetailSiteChiro } from '../interfaces/site-chiro';

export interface FiltresReleves {
  commune?: string;
  site?: number;
  annee?: string;
  espece?: string;
}

export interface Commune {
  insee: string;
  nom: string;
}

export interface Espece {
  cd_espece: string;
  nom: string;
}

@Injectable({ providedIn: 'root' })
export class ChiroService {
  private baseUrl = environment.apiUrl + 'chiro/';

  private async get<T>(subroute: string): Promise<T> {
    const url = this.baseUrl + subroute;
    console.log('[ChiroService] GET', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`[ChiroService] ${response.status} ${response.statusText} — ${url}`);
    }
    return (await response.json()) ?? [];
  }

  getReleves(filtres?: FiltresReleves): Promise<ListReleve[]> {
    const params = new URLSearchParams();
    if (filtres?.commune) params.set('commune', filtres.commune);
    if (filtres?.site) params.set('site', String(filtres.site));
    if (filtres?.annee) params.set('annee', filtres.annee);
    if (filtres?.espece) params.set('espece', filtres.espece);
    const qs = params.toString();
    return this.get<ListReleve[]>('releves' + (qs ? '?' + qs : ''));
  }

  getReleve(uuid: string): Promise<DetailReleve> {
    return this.get<DetailReleve>(`releve/${uuid}`);
  }

  getObservations(uuid: string): Promise<ObservationDetail[]> {
    return this.get<ObservationDetail[]>(`releve/${uuid}/observations`);
  }

  getSites(): Promise<ListSiteChiro[]> {
    return this.get<ListSiteChiro[]>('sites');
  }

  getSite(id: number): Promise<DetailSiteChiro> {
    return this.get<DetailSiteChiro>(`site/${id}`);
  }

  getSiteReleves(id: number): Promise<ListReleve[]> {
    return this.get<ListReleve[]>(`site/${id}/releves`);
  }

  getSitesGeoJSON(): Promise<any> {
    return this.get<any>('sites/geojson');
  }

  getCommunes(): Promise<Commune[]> {
    return this.get<Commune[]>('communes');
  }

  getEspeces(): Promise<Espece[]> {
    return this.get<Espece[]>('especes');
  }
}
