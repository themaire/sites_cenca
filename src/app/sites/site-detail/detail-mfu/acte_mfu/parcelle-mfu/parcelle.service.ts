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
    const apiUrl = this.activeUrl + `parcelles_mfu/uuid=${uuidActe}`;
    console.log('[ParcelleService] 🔍 API URL:', apiUrl);
    try {
      const response = await fetch(apiUrl);
      console.log('[ParcelleService] 📡 Response status:', response.status, response.statusText);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('[ParcelleService] 📦 Response data:', data);
      console.log('[ParcelleService] 📊 Parcels count:', data?.length || 0);
      return data ?? [];
    } catch (error) {
      console.error('[ParcelleService] ❌ Full error details:', {
        url: apiUrl,
        message: String(error),
        ...(error as any)
      });
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

  /**
   * Valide qu'une parcelle existe dans le cadastre
  * Utilise d'abord les donnees locales, puis l'API apicarto.ign.fr en solution de repli
   * @param codeInsee Code INSEE de la commune (5 caractères)
   * @param section Section de la parcelle (2 caractères)
   * @param numero Numéro de la parcelle (4 caractères)
   * @returns Promise avec les informations de la parcelle si elle existe, null sinon
   */
  async validateParcelleExists(codeInsee: string, section: string, numero: string): Promise<any | null> {
    try {
      // Normaliser les valeurs
      const normalizedSection = section.toUpperCase().trim();
      const normalizedNumero = String(numero).trim();

      // D'abord, essayer de valider avec les données locales (plus fiable)
      const localParcelles = await this.getNumerosBySection(codeInsee, normalizedSection);
      
      if (localParcelles && localParcelles.length > 0) {
        // Chercher la parcelle dans les données locales
        const found = localParcelles.find((p: any) => {
          const pNumero = String(p.numero).trim();
          const pSection = normalizedSection;
          return pNumero === normalizedNumero || pNumero === normalizedNumero.replace(/^0+/, '') || String(p.numero).padStart(4, '0') === normalizedNumero;
        });

        if (found) {
          console.log('[ParcelleService] Validation locale réussie:', found);
          return {
            exists: true,
            properties: {
              idu: found.idu,
              contenance: found.contenance,
              section: normalizedSection,
              numero: found.numero
            }
          };
        }
      }

      // Solution de repli : utiliser l'API apicarto.ign.fr
      const sectionForApi = normalizedSection.length === 1 ? '0' + normalizedSection : normalizedSection;
      const numeroForApi = String(normalizedNumero).padStart(4, '0');
      
      const url = `https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=${codeInsee}&section=${sectionForApi}&numero=${numeroForApi}&_limit=1`;
      console.log('[ParcelleService] URL validation API:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('Erreur lors de la validation de la parcelle:', response.status);
        return null;
      }
      
      const data = await response.json();
      
      // Vérifier si on a des résultats
      if (!data || !data.features || data.features.length === 0) {
        // Essayer avec un autre format
        const altUrl = `https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=${codeInsee}&section=${normalizedSection}&numero=${normalizedNumero}&_limit=1`;
        console.log('[ParcelleService] Essai avec format alternatif:', altUrl);
        
        const altResponse = await fetch(altUrl);
        if (altResponse.ok) {
          const altData = await altResponse.json();
          if (altData && altData.features && altData.features.length > 0) {
            const feature = altData.features[0];
            return {
              exists: true,
              feature: feature,
              properties: feature.properties
            };
          }
        }
        return null;
      }
      
      const feature = data.features[0];
      return {
        exists: true,
        feature: feature,
        properties: feature.properties
      };
    } catch (error) {
      console.error('Erreur lors de la validation de la parcelle:', error);
      return null;
    }
  }

  /**
   * Récupère les communes d'un département via le backend
   * @param codeDepartement Code du département (2 caractères)
   * @returns Promise avec la liste des communes
   */
  async getCommunesByDepartement(codeDepartement: string): Promise<any[]> {
    try {
      // Utiliser le backend pour les communes
      const url = `${environment.apiBaseUrl}api-geo/communes?departements=${codeDepartement}`;
      console.log('[ParcelleService] URL communes:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('Erreur lors de la récupération des communes:', response.status);
        return [];
      }
      
      const data = await response.json();
      console.log('[ParcelleService] Données communes:', data);
      
      // Le backend retourne { success: true, data: [...] }
      if (data && data.data && Array.isArray(data.data)) {
        return data.data.map((commune: any) => ({
          code: commune.code,
          nom: commune.nom
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des communes:', error);
      return [];
    }
  }

  /**
   * Récupère les sections existantes pour une commune via le backend
   * @param codeInsee Code INSEE de la commune (5 caractères)
   * @returns Promise avec la liste des sections uniques
   */

  async getSectionsByCommune(codeInsee: string): Promise<string[]> {
    // Validation INSEE : 5 chiffres obligatoires
    if (!/^[0-9]{5}$/.test(codeInsee)) {
      console.error('[ParcelleService] Code INSEE invalide:', codeInsee, '(doit être 5 chiffres)');
      return [];
    }

    // Le endpoint `api-geo/sections` n'est pas disponible partout (404).
    // On utilise directement la source fiable qui alimentait la cascade auparavant.
    return await this.getSectionsFromParcelles(codeInsee);
  }

  private async getParcellesByCommune(codeInsee: string, maxFeatures: number = 5000): Promise<any[]> {
    const ignUrl = `https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=${codeInsee}&_limit=${maxFeatures}`;
    try {
      console.log('[ParcelleService] URL parcelles (IGN direct):', ignUrl);
      const response = await fetch(ignUrl);
      if (!response.ok) {
        console.error('[ParcelleService] Erreur parcelles IGN:', response.status);
        return [];
      }

      const data = await response.json();
      if (data && Array.isArray(data.features)) {
        return data.features;
      }
      return [];
    } catch (error) {
      console.error('[ParcelleService] Erreur fetch parcelles IGN:', error);
      return [];
    }
  }

  private async getSectionsFromParcelles(codeInsee: string): Promise<string[]> {
    try {
      const features = await this.getParcellesByCommune(codeInsee, 5000);
      const sections = new Set<string>();

      features.forEach((feature: any) => {
        const section = feature?.properties?.section;
        if (section) {
          sections.add(String(section).toUpperCase());
        }
      });

      if (sections.size === 0) {
        return [];
      }

      return Array.from(sections).sort();
    } catch (error) {
      console.error('Echec du fallback de sections:', error);
      return [];
    }
  }

  /**
   * Récupère les numéros de parcelles existants pour une commune et une section
   * @param codeInsee Code INSEE de la commune (5 caractères)
   * @param section Section de la parcelle
   * @returns Promise avec la liste des numéros de parcelles
   */


  async getNumerosBySection(codeInsee: string, section: string): Promise<any[]> {
    // Validation INSEE : 5 chiffres obligatoires
    if (!/^[0-9]{5}$/.test(codeInsee)) {
      console.error('[ParcelleService] ❌ Code INSEE invalide pour numeros:', codeInsee);
      return [];
    }
    
    try {
      const features = await this.getParcellesByCommune(codeInsee, 5000);
      if (!features || features.length === 0) {
        return [];
      }
      
      // Filtrer par section et retourner les parcelles
      const filteredFeatures = features.filter((feature: any) => {
        return feature.properties && 
               feature.properties.section && 
               feature.properties.section.toUpperCase() === section.toUpperCase();
      });
      
      return filteredFeatures.map((feature: any) => ({
        numero: feature.properties.numero,
        contenance: feature.properties.contenance,
        idu: feature.properties.idu,
        geojson: feature
      })).sort((a: any, b: any) => {
        const numA = parseInt(a.numero) || 0;
        const numB = parseInt(b.numero) || 0;
        return numA - numB;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des numéros:', error);
      return [];
    }
  }

  /**
   * Récupère le GeoJSON d'une parcelle spécifique
   * @param codeInsee Code INSEE de la commune (5 caractères)
   * @param section Section de la parcelle
   * @param numero Numéro de la parcelle
   * @returns Promise avec le GeoJSON de la parcelle
   */
  async getParcelleGeoJson(codeInsee: string, section: string, numero: string): Promise<any | null> {
    // Validation INSEE : 5 chiffres obligatoires
    if (!/^[0-9]{5}$/.test(codeInsee)) {
      console.error('[ParcelleService] ❌ Code INSEE invalide pour geojson:', codeInsee);
      return null;
    }
    
    try {
      const features = await this.getParcellesByCommune(codeInsee, 5000);
      if (!features || features.length === 0) {
        return null;
      }
      
      // Filtrer par section et numéro
      const normalizedSection = section.toUpperCase();
      const normalizedNumero = String(numero).padStart(4, '0');
      
      const foundFeature = features.find((feature: any) => {
        const props = feature.properties;
        return props && 
               props.section && 
               props.section.toUpperCase() === normalizedSection &&
               String(props.numero).padStart(4, '0') === normalizedNumero;
      });
      
      return foundFeature || null;
    } catch (error) {
      console.error('Erreur lors de la récupération du GeoJSON:', error);
      return null;
    }
  }
}

