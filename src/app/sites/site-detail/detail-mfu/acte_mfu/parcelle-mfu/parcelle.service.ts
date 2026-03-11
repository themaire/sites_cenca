import { environment } from '../../../../../../environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApiResponse } from '../../../../../shared/interfaces/api';
import { Parcelle } from './parcelle';

@Injectable({
  providedIn: 'root',
})
export class ParcelleService {
  private activeUrl: string = environment.apiBaseUrl + 'sites/';

  constructor(private http: HttpClient) {}

  /**
   * Récupère les parcelles liées à un acte MFU
   * @param uuidActe UUID de l'acte MFU
   * @returns Promise avec la liste des parcelles
   */
  async getParcellesByActe(uuidActe: string): Promise<Parcelle[]> {
    try {
      const response = await fetch(this.activeUrl + `parcelles_mfu/uuid=${uuidActe}`);
      const data = await response.json();
      return data ?? [];
    } catch (error) {
      console.error('Erreur lors de la récupération des parcelles:', error);
      return [];
    }
  }

  /**
   * Récupère les informations d'une parcelle par son UUID
   * @param uuidParcelle UUID de la parcelle
   * @returns Promise avec les informations de la parcelle
   */
  async getParcelleByUuid(uuid_parcelle: string): Promise<Parcelle | null> {
    const data = await fetch(this.activeUrl + `parcelles_mfu/uuid=${uuid_parcelle}`);
    const result = await data.json();
    return result ? result : null;
  }

  /**
   * Insère une nouvelle parcelle MFU
   * @param parcelle Données de la parcelle à créer
   * @returns Observable avec la réponse de l'API
   */
  insertParcelle(parcelle: any): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=parcelles_mfu/insert`;
    return this.http.put<ApiResponse>(url, parcelle);
  }

  /**
   * Met à jour une parcelle MFU existante
   * @param uuidParcelle UUID de la parcelle à mettre à jour
   * @param parcelle Données de la parcelle
   * @returns Observable avec la réponse de l'API
   */
  updateParcelle(uuid_parcelle: string, parcelle: Partial<Parcelle>): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=parcelles_mfu/uuid=${uuid_parcelle}`;
    return this.http.put<ApiResponse>(url, parcelle);
  }

  /**
   * Supprime une parcelle MFU
   * @param uuidParcelle UUID de la parcelle à supprimer
   * @returns Observable avec la réponse de l'API
   */
  deleteParcelle(uuid_parcelle: string): Observable<ApiResponse> {
    return this.http
      .delete<ApiResponse>(
        `${this.activeUrl}delete/sitcenca.parcelles_mfu/uuid_parcelle=${uuid_parcelle}`
      )
      .pipe(
        catchError((error) => {
          console.error('Erreur lors de la suppression de la parcelle:', error);
          return of({
            success: false,
            message: 'Erreur lors de la suppression de la parcelle',
          } as ApiResponse);
        })
      );
  }

  /**
   * Recherche des parcelles par code parcelle ou partie
   * @param searchTerm Terme de recherche
   * @returns Observable avec les résultats
   */
  searchParcelles(searchTerm: string): Observable<Parcelle[]> {
    const url = `${this.activeUrl}parcelles_mfu/search?q=${encodeURIComponent(searchTerm)}`;
    return this.http.get<Parcelle[]>(url).pipe(
      catchError((error) => {
        console.error('Erreur lors de la recherche de parcelles:', error);
        return of([]);
      })
    );
  }
}

