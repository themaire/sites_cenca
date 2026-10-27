import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
  ActionAutre,
  Localisant,
  NomenclaturesAutres,
  OperationAutre,
  OperationAutreBody,
  ProjetAutre,
  ProjetAutreBody,
  ProjetAutreLite,
  SelectorsAutres,
} from './projets-autres';

export interface FiltresProjetsAutres {
  annee?: number | null;
  typ_projet?: string | null;
  responsable?: string | null;
  statut?: string | null;
  texte?: string | null;
  uuid_site?: string | null;
  cd_localisation?: string | null;
  limite?: number | null;
}

/**
 * Projets « autres » (hors travaux) : schéma opeautres, routes /sites/autres/...
 * Les GET sont publics, les écritures passent par HttpClient pour recevoir le Bearer de l'intercepteur.
 */
@Injectable({ providedIn: 'root' })
export class ProjetsAutresService {
  private baseUrl = environment.apiBaseUrl + 'sites/autres/';

  // Les nomenclatures ne changent pas pendant la session : un seul appel
  private nomenclatures?: Promise<NomenclaturesAutres>;
  // Arbre des actions par type de projet (l'ordre des branches dépend du type)
  private actions = new Map<string, Promise<ActionAutre[]>>();

  constructor(private http: HttpClient) {}

  private params(valeurs: object): HttpParams {
    let params = new HttpParams();
    Object.entries(valeurs).forEach(([cle, valeur]) => {
      if (valeur !== null && valeur !== undefined && valeur !== '') params = params.set(cle, String(valeur));
    });
    return params;
  }

  // ── Listes du formulaire ────────────────────────────────────────────────────

  getNomenclatures(): Promise<NomenclaturesAutres> {
    if (!this.nomenclatures) {
      this.nomenclatures = firstValueFrom(this.http.get<NomenclaturesAutres>(this.baseUrl + 'nomenclatures'));
      this.nomenclatures.catch(() => (this.nomenclatures = undefined));
    }
    return this.nomenclatures;
  }

  getActions(typ_projet: string): Promise<ActionAutre[]> {
    let actions = this.actions.get(typ_projet);
    if (!actions) {
      actions = firstValueFrom(
        this.http.get<ActionAutre[]>(this.baseUrl + 'actions', { params: this.params({ typ_projet }) })
      );
      actions.catch(() => this.actions.delete(typ_projet));
      this.actions.set(typ_projet, actions);
    }
    return actions;
  }

  /** Autocomplétion des lieux (2 caractères minimum) */
  getLocalisants(q: string, cat?: string | null, limite: number = 50): Observable<Localisant[]> {
    return this.http.get<Localisant[]>(this.baseUrl + 'localisants', { params: this.params({ q, cat, limite }) });
  }

  getSelectors(): Promise<SelectorsAutres> {
    return firstValueFrom(this.http.get<SelectorsAutres>(this.baseUrl + 'selectors'));
  }

  // ── Projets ─────────────────────────────────────────────────────────────────

  getProjets(filtres: FiltresProjetsAutres = {}): Observable<ProjetAutreLite[]> {
    return this.http.get<ProjetAutreLite[]>(this.baseUrl + 'projets', { params: this.params(filtres) });
  }

  getProjet(uuid_proj: string): Promise<ProjetAutre> {
    return firstValueFrom(this.http.get<ProjetAutre>(this.baseUrl + 'projets/' + uuid_proj));
  }

  createProjet(projet: ProjetAutreBody): Observable<{ success: boolean; uuid_proj: string; projet: ProjetAutre }> {
    return this.http.post<{ success: boolean; uuid_proj: string; projet: ProjetAutre }>(this.baseUrl + 'projets', projet);
  }

  updateProjet(uuid_proj: string, projet: Partial<ProjetAutreBody>): Observable<{ success: boolean; uuid_proj: string; projet: ProjetAutre }> {
    return this.http.put<{ success: boolean; uuid_proj: string; projet: ProjetAutre }>(this.baseUrl + 'projets/' + uuid_proj, projet);
  }

  deleteProjet(uuid_proj: string): Observable<{ success: boolean; uuid_proj: string; operations_supprimees: number }> {
    return this.http.delete<{ success: boolean; uuid_proj: string; operations_supprimees: number }>(this.baseUrl + 'projets/' + uuid_proj);
  }

  // ── Opérations ──────────────────────────────────────────────────────────────

  getOperation(uuid_ope: string): Promise<OperationAutre> {
    return firstValueFrom(this.http.get<OperationAutre>(this.baseUrl + 'operations/' + uuid_ope));
  }

  createOperation(uuid_proj: string, operation: OperationAutreBody): Observable<{ success: boolean; uuid_ope: string; operation: OperationAutre }> {
    return this.http.post<{ success: boolean; uuid_ope: string; operation: OperationAutre }>(
      this.baseUrl + 'projets/' + uuid_proj + '/operations', operation
    );
  }

  updateOperation(uuid_ope: string, operation: Partial<OperationAutreBody>): Observable<{ success: boolean; uuid_ope: string; operation: OperationAutre }> {
    return this.http.put<{ success: boolean; uuid_ope: string; operation: OperationAutre }>(this.baseUrl + 'operations/' + uuid_ope, operation);
  }

  cloneOperation(uuid_ope: string, options: { date_deb?: string; date_fin?: string; projet?: string } = {}): Observable<{ success: boolean; uuid_ope: string; operation: OperationAutre }> {
    return this.http.post<{ success: boolean; uuid_ope: string; operation: OperationAutre }>(
      this.baseUrl + 'operations/' + uuid_ope + '/clone', options
    );
  }

  deleteOperation(uuid_ope: string): Observable<{ success: boolean; uuid_ope: string }> {
    return this.http.delete<{ success: boolean; uuid_ope: string }>(this.baseUrl + 'operations/' + uuid_ope);
  }

  // ── Erreurs ─────────────────────────────────────────────────────────────────

  /** Liste lisible des erreurs renvoyées par le backend (400 : toutes les erreurs d'un coup) */
  erreursDe(error: HttpErrorResponse): string[] {
    if (error.status === 401) return ['Vous devez être connecté pour enregistrer (session expirée ?).'];
    if (error.status === 404) return ["L'élément n'existe plus : il a peut-être été supprimé par un collègue."];
    const corps = error.error;
    if (corps?.erreurs?.length) return corps.erreurs;
    if (corps?.message) return [corps.message + (corps.detail ? ' : ' + corps.detail : '')];
    return ['Erreur de communication avec le serveur (' + error.status + ').'];
  }
}
