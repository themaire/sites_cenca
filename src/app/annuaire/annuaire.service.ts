import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SelectValue } from '../shared/interfaces/formValues';
import { Annuaire, AnnuaireLite, Competence, Etiquette } from './interfaces/annuaire';

export interface FiltresAnnuaire {
  typ_personne?: string;
  validite?: boolean;
  q?: string;
}

@Injectable({ providedIn: 'root' })
export class AnnuaireService {
  private baseUrl = environment.apiUrl + 'annuaire/';

  constructor(private http: HttpClient) {}

  private async get<T>(subroute: string): Promise<T> {
    const url = this.baseUrl + subroute;
    console.log('[AnnuaireService] GET', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`[AnnuaireService] ${response.status} ${response.statusText} — ${url}`);
    }
    return (await response.json()) ?? [];
  }

  // ── Lecture ─────────────────────────────────────────────────────────────────

  getAnnuaires(filtres?: FiltresAnnuaire): Promise<AnnuaireLite[]> {
    const params = new URLSearchParams();
    if (filtres?.typ_personne) params.set('typ_personne', filtres.typ_personne);
    if (filtres?.validite !== undefined) params.set('validite', String(filtres.validite));
    if (filtres?.q) params.set('q', filtres.q);
    const qs = params.toString();
    return this.get<AnnuaireLite[]>('' + (qs ? '?' + qs : ''));
  }

  getAnnuaire(uuid: string): Promise<Annuaire> {
    return this.get<Annuaire>(uuid);
  }

  getCompetences(uuid: string): Promise<Competence[]> {
    return this.get<Competence[]>(`${uuid}/competences`);
  }

  getEtiquettes(uuid: string): Promise<Etiquette[]> {
    return this.get<Etiquette[]>(`${uuid}/etiquettes`);
  }

  getTypPersonnes(): Promise<SelectValue[]> {
    return this.get<SelectValue[]>('typ_personnes');
  }

  getTypCompetences(): Promise<SelectValue[]> {
    return this.get<SelectValue[]>('typ_competences');
  }

  getTypEtiquettes(): Promise<SelectValue[]> {
    return this.get<SelectValue[]>('typ_etiquettes');
  }

  // ── Écriture — Contact ──────────────────────────────────────────────────────

  createAnnuaire(data: Annuaire): Observable<{ success: boolean; uuid_ann: string }> {
    return this.http.post<{ success: boolean; uuid_ann: string }>(this.baseUrl, data);
  }

  updateAnnuaire(uuid: string, data: Annuaire): Observable<{ success: boolean; uuid_ann: string }> {
    return this.http.put<{ success: boolean; uuid_ann: string }>(this.baseUrl + uuid, data);
  }

  deleteAnnuaire(uuid: string): Observable<any> {
    return this.http.delete(this.baseUrl + uuid);
  }

  // ── Écriture — Compétences ──────────────────────────────────────────────────

  upsertCompetence(uuid: string, typCompetence: string, data: { notation?: number; remarque?: string }): Observable<any> {
    return this.http.put(this.baseUrl + `${uuid}/competences/${typCompetence}`, data);
  }

  deleteCompetence(uuid: string, typCompetence: string): Observable<any> {
    return this.http.delete(this.baseUrl + `${uuid}/competences/${typCompetence}`);
  }

  // ── Écriture — Étiquettes ────────────────────────────────────────────────────

  upsertEtiquette(uuid: string, typEtiquette: string): Observable<any> {
    return this.http.put(this.baseUrl + `${uuid}/etiquettes/${typEtiquette}`, {});
  }

  deleteEtiquette(uuid: string, typEtiquette: string): Observable<any> {
    return this.http.delete(this.baseUrl + `${uuid}/etiquettes/${typEtiquette}`);
  }
}
