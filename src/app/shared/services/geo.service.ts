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

  async apiGeoCommuneByInsee(insee: string): Promise<Commune> {
    const response = await fetch(this.activeUrl + 'api-geo/commune/' + insee);
    if (!response.ok) {
      throw new Error('Failed to fetch commune');
    }
    return response.json();
  }
}