import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface CommuneIGN {
  code: string;
  nom: string;
}

@Injectable({ providedIn: 'root' })
export class CommuneIgnService {
  readonly departements = [
    { code: '08', nom: 'Ardennes' },
    { code: '10', nom: 'Aube' },
    { code: '51', nom: 'Marne' },
    { code: '52', nom: 'Haute-Marne' },
  ];

  async getCommunesByDepartement(codeDept: string): Promise<CommuneIGN[]> {
    try {
      const url = `${environment.apiBaseUrl}api-geo/communes?departements=${codeDept}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = await response.json();
      if (data?.data && Array.isArray(data.data)) {
        return data.data.map((c: any) => ({ code: c.code, nom: c.nom }));
      }
      return [];
    } catch {
      return [];
    }
  }
}
