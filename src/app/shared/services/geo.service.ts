import { environment } from '../../../environments/environment';
import { Commune, Communes } from '../../../app/shared/interfaces/geo';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeoService {
  private activeUrl: string = environment.apiBaseUrl;

  constructor() { }

  apiWFSLizmapUrl(couche: string, bbox: string): string {
    return this.activeUrl + 'api-geo/lizmap/layer/' + couche + '?bbox=' + bbox;
  }

  apiGeoParcellesUrl(bbox: string): string {
    return this.activeUrl + 'api-geo/parcelles/bbox?bbox=' + bbox;
  }

  async apiGeoCommunesUrl(departements: string): Promise<Communes[]> {
    const response = await fetch(this.activeUrl + 'api-geo/communes?departements=' + departements);
    if (!response.ok) {
      throw new Error('Failed to fetch communes');
    }

    console.log('🔗 URL appelée pour les communes:', this.activeUrl + 'api-geo/communes?departement=' + departements);
    console.log('response', response);

    const data = await response.json();
    console.log(data); // Ajoutez ceci pour voir la structure réelle
    const communesArray = Array.isArray(data.data) ? data.data : [];
    console.log(communesArray.message);

    return communesArray.map((item: any) => ({
      nom: item.nom,
      insee: item.code,
      ...item
    }));
  }

  /** Récupère les informations d'une commune par son code INSEE
   * Si on ne précise pas le mode, toutes les infos sont retournées (mode 'full'), sinon utilisez un des paramètres disponibles (ex: 'nom')
   * @param insee Code INSEE de la commune
   * @param mode Mode de retour (full pour toutes les infos (PAR DEFAUT), nom pour avoir le nom seulement, etc.
   * @returns Promise avec les infos de la commune
  */

  async apiGeoCommuneByInsee(insee: string, mode: string = 'full'): Promise<{success: boolean, data?: string, mode: string}> {
    const response = await fetch(this.activeUrl + 'api-geo/commune/' + insee + '/' + mode);
    if (!response.ok) {
      throw new Error('Failed to fetch commune');
    }
    return response.json();
  }
}