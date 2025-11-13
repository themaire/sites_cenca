import { environment } from '../../environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { of, from, Observable } from 'rxjs';

import { ApiResponse } from '../shared/interfaces/api';
import { Selector } from '../shared/interfaces/selector';
import { Salaries } from './admin';
import { SnackbarService } from '../shared/services/snackbar.service';

@Injectable({
  providedIn: 'root'
})
export class AdminServiceService {
  private activeUrl: string = environment.apiUrl + 'admin/';

  constructor(
    private http: HttpClient,
    private snackbarService: SnackbarService,
  ) { }

  // fonction modèle de base réutilisée partout pour les différentes methode de ce fichier
  async getData<T>(subroute: string): Promise<T> {
    const url = `${this.activeUrl}${subroute}`;
    console.log(`Dans getData() avec ${url}`);

    const data = await fetch(url);
    return await data.json() ?? [];
  }

  // Récupérer les détails d'un utilisateur par son cd_salarie
  async getUserById(cd_salarie: string): Promise<any> {
    const subroute = `users/full/${cd_salarie}`;
    return this.getData<any>(subroute);
  }

  // Récupérer la liste de tous les utilisateurs
  async getAllUsers(): Promise<Salaries[]> {
    return this.getData<Salaries[]>('users/lite');
  }

   /**
   * Dupliquer un élément (salarie) en excluant certains champs
   * !! id et exclude sont passés dans le corps de la requête
   * 
   * @param type 'operations' ou 'projet'
   * @param cd_salarie L'ID de l'élément à dupliquer
   * @param excludeOptions Liste des champs à exclure de la duplication (ex: ['fonction', 'date_embauche'])
   * @returns Observable<ApiResponse> avec success true/false et message optionnel
   */
  duplicateItem(type: string, cd_salarie: string, excludeOptions?: string[]): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.activeUrl}put/table=${type}/clone`, {'cd_salarie': cd_salarie, 'excludeFieldsGroups': excludeOptions || [] }).pipe(
      catchError(error => {
        const messageTxt = `Erreur lors de la duplication ${type === 'operations' ? 'de l\'opération' : 'du projet'} (id: ${cd_salarie})`;
        console.error(messageTxt, error);
        return of({ success: false, message: messageTxt } as ApiResponse);
      })
    );
  }

  /**
   * Dupliquer un élément (salaries ou autre) en excluant certains champs
   * @param type 'salaries' ou 'a venir'
   * @param id L'ID de l'élément à dupliquer
   * @param excludeOptions Liste des champs à exclure de la duplication (ex: ['fonction', 'date_embauche'])
   * @returns un Observable<boolean> indiquant le succès ou l'échec de l'opération
   */
  duplicate(type: 'salaries' | 'a venir', id: string, excludeOptions?: string[]): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.duplicateItem(type, id, excludeOptions).subscribe(
        response => {
          observer.next(response.success);
          this.snackbarService.success(type === 'salaries' ? 'Salarié dupliqué avec succès' : 'Autre élément dupliqué avec succès');
          observer.complete();
        },
        error => {
          const errorMessage = error.message || `Erreur lors de la duplication ${type === 'salaries' ? 'du salarié' : 'de l\'autre élément'}`;
          this.snackbarService.error(errorMessage);
          console.error("Erreur lors de la duplication de l'élément:", error);
          observer.next(false);
          observer.complete();
        }
      );
    });
  }
}
