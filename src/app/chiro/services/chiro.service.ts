import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ListReleve, DetailReleve, CreateReleve, UpdateReleve } from '../interfaces/releve';
import { ObservationDetail, CreateObservation, UpdateObservation, Typologies } from '../interfaces/observation';
import { ListSiteChiro, DetailSiteChiro, CreateSite, UpdateSite } from '../interfaces/site-chiro';

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

  constructor(private http: HttpClient) {}

  private async get<T>(subroute: string): Promise<T> {
    const url = this.baseUrl + subroute;
    console.log('[ChiroService] GET', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`[ChiroService] ${response.status} ${response.statusText} — ${url}`);
    }
    return (await response.json()) ?? [];
  }

  // ── Lecture ─────────────────────────────────────────────────────────────────

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

  getTypologies(): Promise<Typologies> {
    return this.get<Typologies>('typologies');
  }

  // ── Écriture — Relevés ──────────────────────────────────────────────────────

  createReleve(data: CreateReleve): Observable<{ uuid_releve: string }> {
    return this.http.post<{ uuid_releve: string }>(this.baseUrl + 'releve', data);
  }

  updateReleve(uuid: string, data: UpdateReleve): Observable<any> {
    return this.http.put(this.baseUrl + `releve/${uuid}`, data);
  }

  deleteReleve(uuid: string): Observable<any> {
    return this.http.delete(this.baseUrl + `releve/${uuid}`);
  }

  // ── Écriture — Observations ─────────────────────────────────────────────────

  createObservation(uuidReleve: string, data: CreateObservation): Observable<{ uuid_observation: string }> {
    return this.http.post<{ uuid_observation: string }>(this.baseUrl + `releve/${uuidReleve}/observation`, data);
  }

  updateObservation(uuid: string, data: UpdateObservation): Observable<any> {
    return this.http.put(this.baseUrl + `observation/${uuid}`, data);
  }

  deleteObservation(uuid: string): Observable<any> {
    return this.http.delete(this.baseUrl + `observation/${uuid}`);
  }

  // ── Écriture — Sites ────────────────────────────────────────────────────────

  createSite(data: CreateSite): Observable<{ id_site: number }> {
    return this.http.post<{ id_site: number }>(this.baseUrl + 'site', data);
  }

  updateSite(id: number, data: UpdateSite): Observable<any> {
    return this.http.put(this.baseUrl + `site/${id}`, data);
  }

  deleteSite(id: number): Observable<any> {
    return this.http.delete(this.baseUrl + `site/${id}`);
  }
}
