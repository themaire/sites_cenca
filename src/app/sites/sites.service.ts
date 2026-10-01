import { environment } from '../../environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { of, from, Observable } from 'rxjs';

// interfaces utilisés dans la promise de la fonction
import { ListSite } from './site'; // prototype d'un site
import { Commune } from './site-detail/detail-infos/commune';
import { DocPlan, DocPlanDetail, UniteGestion, EntiteCoherente } from './site-detail/detail-gestion/docplan';
import { MilNat } from './site-detail/detail-habitats/docmilnat';
import { ActeLite, Acte } from './site-detail/detail-mfu/acte';
import { ProjetLite } from './site-detail/detail-projets/projets';
import { Operation, OperationLite } from './site-detail/detail-projets/projet/operation/operations';
import { DetailSite } from './site-detail';
import { Localisation } from '../shared/interfaces/localisation';
import { ApiResponse } from '../shared/interfaces/api';
import { Selector } from '../shared/interfaces/selector';

export interface UrlCheck {
  etat: 'ok' | 'ko' | 'inconnu';
  /** Code HTTP final (null en cas d'erreur réseau ou d'URL refusée) */
  status: number | null;
  /** Message du backend quand l'URL est refusée */
  message?: string;
}

/** Conservateur bénévole rattaché à un site (contact de l'annuaire) */
export interface Conservateur {
  uuid_ann: string;
  nom: string;
  telephone?: string;
  mail?: string;
  adresse?: string;
}

export interface SiteDeleteDependance {
  table: string;
  libelle: string;
  nombre: number;
}

/** Réponse de GET sites/delete/site/uuid_site=:uuid (vérification, ne supprime rien) */
export interface SiteDeleteCheck {
  supprimable: boolean;
  dependances: SiteDeleteDependance[];
  /** Ce qui disparaîtrait avec le site (géométries, milieux naturels, aménagements, communes...) */
  supprime_avec_le_site?: Record<string, unknown>;
  message?: string;
}

interface SiteLite {
  // Listes courtes de sites
  uuid_site: string;
  code_site?: string;
  nom_site: string;
}

interface ActeMultiSiteInsert {
  ref_uuid_site: string;
  ref_uuid_acte: string;
  amm_date_crea?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SitesService {
  private activeUrl: string = environment.apiUrl + 'sites/';

  constructor(private http: HttpClient) { }

  /** Vérifie si un site peut être supprimé (route de contrôle, ne supprime rien). */
  checkSiteDeletion(uuid_site: string): Observable<SiteDeleteCheck> {
    return this.http
      .get<any>(`${this.activeUrl}delete/site/uuid_site=${uuid_site}`)
      // Le détail peut être à la racine de la réponse ou dans data selon l'enveloppe du backend
      .pipe(map((res) => ({ ...res, ...(res?.data ?? {}) }) as SiteDeleteCheck));
  }

  /**
   * Supprime un site créé par erreur. Le backend répond 409 (avec message et data.dependances)
   * dès qu'une donnée est rattachée au site : l'erreur est laissée au composant appelant.
   */
  deleteSite(uuid_site: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.activeUrl}delete/site/uuid_site=${uuid_site}`);
  }

  /**
   * Communes d'un site (table esp.localisations, via l'espace du site).
   * Route backend existante : GET sites/commune/uuid=:uuid_site -> [{ insee, nom, departement }]
   */
  getCommunesSite(uuid_site: string): Observable<Commune[]> {
    return this.http
      .get<any>(`${this.activeUrl}commune/uuid=${uuid_site}`)
      .pipe(map((res) => (Array.isArray(res) ? res : res?.data ?? []) as Commune[]));
  }

  /** Rattache une commune au site. Route backend : POST sites/commune/uuid_site=:uuid, body { insee } */
  addCommuneSite(uuid_site: string, insee: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.activeUrl}commune/uuid_site=${uuid_site}`, { insee });
  }

  /** Détache une commune du site. Route backend : DELETE sites/commune/uuid_site=:uuid/insee=:insee */
  removeCommuneSite(uuid_site: string, insee: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.activeUrl}commune/uuid_site=${uuid_site}/insee=${insee}`);
  }

  /**
   * Conservateurs bénévoles d'un site (table sitcenca.conservateurs -> ann.annuaire).
   * Route backend : GET sites/conservateur/uuid_site=:uuid_site -> [{ uuid_ann, nom, telephone, mail, adresse }]
   */
  getConservateursSite(uuid_site: string): Observable<Conservateur[]> {
    return this.http
      .get<any>(`${this.activeUrl}conservateur/uuid_site=${uuid_site}`)
      .pipe(map((res) => (Array.isArray(res) ? res : res?.data ?? []) as Conservateur[]));
  }

  /** Rattache un conservateur au site. Route backend : POST sites/conservateur/uuid_site=:uuid, body { uuid_ann } */
  addConservateurSite(uuid_site: string, uuid_ann: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.activeUrl}conservateur/uuid_site=${uuid_site}`, { uuid_ann });
  }

  /** Détache un conservateur du site. Route backend : DELETE sites/conservateur/uuid_site=:uuid/uuid_ann=:uuid_ann */
  removeConservateurSite(uuid_site: string, uuid_ann: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.activeUrl}conservateur/uuid_site=${uuid_site}/uuid_ann=${uuid_ann}`);
  }

  /**
   * Teste côté serveur qu'un lien répond (le navigateur ne peut pas lire le code HTTP d'un autre
   * domaine à cause de CORS). Route backend : GET sites/check-url?url=... -> { ok, status }.
   * Réponse 400 (URL refusée) -> 'ko' avec le message du serveur ; route absente ou autre erreur
   * -> 'inconnu' (le lien reste affiché normalement).
   */
  checkUrl(url: string): Observable<UrlCheck> {
    return this.http
      .get<{ ok: boolean; status?: number | null }>(`${this.activeUrl}check-url`, { params: { url } })
      .pipe(
        map((res): UrlCheck => ({ etat: res.ok ? 'ok' : 'ko', status: res.status ?? null })),
        catchError((err) =>
          of<UrlCheck>(
            err?.status === 400
              ? { etat: 'ko', status: null, message: err.error?.message }
              : { etat: 'inconnu', status: null },
          ),
        ),
      );
  }

  // fonction modèle de base réutilisée partout pour les différentes methode de ce fichier
  async getData<T>(subroute: string): Promise<T> {
    const url = `${this.activeUrl}${subroute}`;
    console.log(`Dans getData() avec ${url}`);

    const data = await fetch(url);
    return await data.json() ?? [];
  }

  // Recherche des détails d'un site par son UUID
  async getSiteUUID(paramUUID: string): Promise<DetailSite> {
    console.log('Dans la fonction getSiteUUID du service avec ' + paramUUID);

    const data = await fetch(this.activeUrl + paramUUID);
    const site = await data.json();

    // Création de l'objet Localisation à partir des champs de la réponse
    const localisation: Localisation = {
      // Transformation de la chaîne GeoJSON en VRAI DE VRAI objet JSON (GeoJSON dans notre cas)
      geojson: typeof site.geojson === 'string' ? JSON.parse(site.geojson) : site.geojson,
      loc_date: site.date_crea_geom ? new Date(site.date_crea_geom) : null,
      type: site.type_geom,
      surface: site.surface_geom
    };

    // Ajout de l'attribut localisation à l'objet site
    site.localisation = localisation;

    return site as DetailSite;
  }

  async getCommune(subroute: string): Promise<Commune[]> {
    return this.getData<Commune[]>(subroute);
  }

  async getDocPlan(subroute: string): Promise<DocPlan[]> {
    return this.getData<DocPlan[]>(subroute);
  }

  async getDocPlanDetail(uuid_doc: string): Promise<DocPlanDetail> {
    return this.getData<DocPlanDetail>(`pgestion/doc/uuid=${uuid_doc}`);
  }

  async getDocPlanUG(uuid_doc: string): Promise<UniteGestion[]> {
    return this.getData<UniteGestion[]>(`pgestion/doc/uuid=${uuid_doc}/ug`);
  }

  async getEntitesCoherentes(): Promise<EntiteCoherente[]> {
    return this.getData<EntiteCoherente[]>('pgestion/entites_coherentes');
  }

  deleteDocPlanUG(uuid_ug: string): Observable<any> {
    const url = `${this.activeUrl}delete/docplan_unites_gestion/uuid_ug=${uuid_ug}`;
    return this.http.delete<any>(url).pipe(
      catchError(error => {
        console.error('Erreur lors de la suppression de l\'unité de gestion', error);
        throw error;
      })
    );
  }

  deleteDocPlan(uuid_doc: string): Observable<any> {
    const url = `${this.activeUrl}delete/docplan_documents/uuid_doc=${uuid_doc}`;
    return this.http.delete<any>(url).pipe(
      catchError(error => {
        console.error('Erreur lors de la suppression du document planificateur', error);
        throw error;
      })
    );
  }

  deleteEntiteCoherente(uuid_ecg: string): Observable<any> {
    const url = `${this.activeUrl}delete/docplan_entites_coherentes/uuid_ecg=${uuid_ecg}`;
    return this.http.delete<any>(url).pipe(
      catchError(error => {
        console.error('Erreur lors de la suppression de l\'entité cohérente', error);
        throw error;
      })
    );
  }

  async getMilNat(subroute: string): Promise<MilNat[]> {
    return this.getData<MilNat[]>(subroute);
  }

  async getActe(subroute: string): Promise<ActeLite[]> {
    return this.getData<ActeLite[]>(subroute);
  }

  async getActeFull(subroute: string): Promise<Acte[]> {
    return this.getData<Acte[]>(subroute);
  }

  async getMfuSitesLite(subroute: string = 'mfu/sites/lite'): Promise<SiteLite[]> {
    return this.getData<SiteLite[]>(subroute);
  }

  async getSitesLiteFallback(subroute: string = 'criteria/*/*/*/*/*/*'): Promise<SiteLite[]> {
    const rows = await this.getData<any[]>(subroute);
    return (rows || []).map((row: any) => ({
      uuid_site: row.uuid_site,
      code_site: row.code,
      nom_site: row.nom,
    }));
  }

  // Utilisé dans operation.component.ts
  async getLocalisations_orig(subroute: string): Promise<Localisation[]> {
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }

  // Utilisé dans operation.component.ts
  async getLocalisations(subroute: string): Promise<Localisation[]> {
    const data = await fetch(this.activeUrl + subroute);
    const localisations = await data.json(); // <-- tableau d'objets

    console.log('Localisation obtenue depuis siteService.getLocalisations():', localisations);

    const locali_objects: Localisation[] = localisations.map((loc: any) => ({
      geojson: typeof loc.geojson === 'string' ? JSON.parse(loc.geojson) : loc.geojson,
      loc_date: loc.date_crea_geom ? new Date(loc.date_crea_geom) : null,
      type: loc.type_geom,
      surface: loc.surface_geom,
      loc_id: loc.loc_id,
      ref_uuid_ope: loc.ref_uuid_ope,
      ref_uuid_proj: loc.ref_uuid_proj,
    }));

    console.log('Localisation transformée en objet Localisation :', locali_objects);

    return locali_objects;
  }

  /**
   * Récupère la liste des fichiers pour un type et une section donnés
   * @param cd_type - Id du type de document (ex: 1 pour photos)
   * @param section - Grande famille de document (de la table files.libelles_nom)
   * @param ref_id - ID de référence (ex: pActe_id ou uuid_site ...) optionnel
   * @returns Observable<ApiResponse>
   */
  getFiles(cd_type: number, section: number, ref_id?: any): Observable<ApiResponse> {
    const url = ref_id ? `${this.activeUrl}docs/${section}/cd_type=${cd_type}/full/${ref_id}` : `${this.activeUrl}docs/${section}/cd_type=${cd_type}/lite`;
    return this.http.get<ApiResponse>(url).pipe(
      catchError((error) => {
        console.error('Erreur lors de la récupération des docfiles', error);
        return of({ success: false, message: 'Erreur lors de la récupération des docfiles' } as ApiResponse);
      })
    );
  }

  deleteLocalisation(loc_id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.activeUrl}delete/opegerer.localisations/loc_id=${loc_id}`).pipe(
      catchError(error => {
        console.error('Erreur lors de la suppression de la localisation:', error);
        return of({ success: false, message: 'Erreur lors de la suppression de la localisation' } as ApiResponse);
      })
    );
  }

  async getProjets(subroute: string): Promise<ProjetLite[]> {
    return this.getData<ProjetLite[]>(subroute);
  }

  /**
   * Récupère la liste des sites
   * @param subroute - sous-route de l'API
   * @returns Promise<ListSite[]>
   */
  async getSites(subroute: string): Promise<ListSite[]> {
    return this.getData<ListSite[]>(subroute);
  }

  /**
   * Pour récuperer une liste de choix (selectors)
   * @returns Promise<Selector[]>
   */
  async getSelectors(): Promise<Selector[]> {
    const data = await fetch(this.activeUrl + 'selectors_sites');
    return (await data.json()) ?? [];
  }

  getOperations(subroute: string): Observable<OperationLite[]> {
    // Est utilisé dans le step "Operations" de la page détail d'un projet pour lister les opérations du projet actuel
    const url = `${this.activeUrl}${subroute}`;
    return this.http.get<OperationLite[]>(url).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des opérations', error);
        throw error;
      })
    );
  }

  getOperation(subroute: string): Observable<Operation> {
    // Est utilisé dans le step "Operations" de la page détail d'un projet pour lister les opérations du projet actuel
    const url = `${this.activeUrl}${subroute}`;
    return this.http.get<Operation>(url).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des opérations', error);
        throw error;
      })
    );
  }

  // Sauvegarde les modifications
  // Fonction utilisée dans updateTable() de form.service.ts
  updateTable(tableName: String, uuid: String, formData: any): Observable<any> {
    const url = `${this.activeUrl}put/table=${tableName}/uuid=${uuid}`; // Construire l'URL avec le UUID du site
    console.log('Dans updateTable() avec ' + url);

    return this.http.put<any>(url, formData).pipe(
      tap(response => {
        console.log('Mise à jour réussie:', response);
      }),
      catchError(error => {
        console.error('Erreur lors de la mise à jour', error);
        throw error;
      })
    );
  }

  // Insertion d'enregistrements
  // Fonction utilisée dans updateTable() de form.service.ts
  insertTable(tableName: String, formData: any): Observable<any> {
    const url = `${this.activeUrl}put/table=${tableName}/insert`; // Construire l'URL avec le UUID du site
    console.log('Dans updateTable() avec ' + url);
    console.log(formData);
    return this.http.put<ApiResponse>(url, formData).pipe(
      tap(response => {
        console.log('Mise à jour réussie:', response);
        return response.data;
      }),
      catchError(error => {
        console.error('Erreur lors de la mise à jour', error);
        throw error;
      })
    );
  }

  attachActeToSite(payload: ActeMultiSiteInsert): Observable<ApiResponse> {
    // Cree un rattachement entre un acte et un site.
    const url = `${this.activeUrl}put/table=actes_mfu_multi/insert`;
    return this.http.put<ApiResponse>(url, payload).pipe(
      catchError((error) => {
        console.error('Erreur lors du rattachement multi-sites de l\'acte', error);
        throw error;
      })
    );
  }

  /**
   * Crée un nouveau site (et son espace parent) en une seule opération atomique côté backend.
   * `table=espace_site` est une valeur spéciale de la route générique d'insertion : elle ne
   * correspond à aucune vraie table SQL, elle déclenche la création combinée espace + site.
   * Les uuid (uuid_espace, uuid_site) sont générés côté backend et renvoyés dans response.data.
   */
  createSite(data: Record<string, any>): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=espace_site/insert`;
    return this.http.put<ApiResponse>(url, data).pipe(
      catchError((error) => {
        console.error('Erreur lors de la création du site', error);
        throw error;
      })
    );
  }

  deleteOperation(ope_uuid: string): Observable<void> {
    const url = `${this.activeUrl}delete/operations/uuid=${ope_uuid}`;
    return this.http.delete<void>(url).pipe(
      catchError(error => {
        console.error('Erreur lors de la suppression de l\'opération', error);
        throw error;
      })
    );
  }
}
