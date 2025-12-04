import { environment } from '../../environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { of, from, Observable } from 'rxjs';

import { ApiResponse } from '../shared/interfaces/api';
import { Selector } from '../shared/interfaces/selector';
import { Salaries, Salarie, Groupes, Groupe } from './admin';
import { SnackbarService } from '../shared/services/snackbar.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
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

  // Récupérer les détails d'un groupe par son gro_id
  async getGroupById(gro_id: string): Promise<any> {
    const subroute = `group/full/${gro_id}`;
    return this.getData<any>(subroute);
  }

  // Récupérer la liste de tous les groupes
  async getAllGroups(): Promise<Groupes[]> {
    return this.getData<Groupes[]>('group/lite');
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

  /**
   * Modifier un utilisateur
   * @param userData Les données de l'utilisateur à modifier
   * @returns Observable<ApiResponse> avec success true/false et message optionnel
   */
  updateUser(userData: Salarie, id: string): Observable<ApiResponse> {
    console.log('Données envoyées pour la mise à jour de l\'utilisateur:', userData);
    
    return this.http.put<ApiResponse>(`${this.activeUrl}put/user/update/${id}`, userData).pipe(
      tap(response => {
        if (response.success) {
          this.snackbarService.success('Utilisateur mis à jour avec succès');
        } else {
          this.snackbarService.error(response.message || 'Erreur lors de la mise à jour de l\'utilisateur');
        }
      }),
      catchError(error => {
        const messageTxt = 'Erreur lors de la mise à jour de l\'utilisateur';
        console.error(messageTxt, error);
        this.snackbarService.error(messageTxt);
        return of({ success: false, message: messageTxt } as ApiResponse);
      })
    );
  }

  /**
   * Modifier un groupe
   * @param groupData Les données du groupe à modifier
   * @returns Observable<ApiResponse> avec success true/false et message optionnel
   */
  updateGroup(groupData: Groupe, id: string): Observable<ApiResponse> {
    console.log('Données envoyées pour la mise à jour du groupe:', groupData);
    
    return this.http.put<ApiResponse>(`${this.activeUrl}put/group/update/${id}`, groupData).pipe(
      tap(response => {
        if (response.success) {
          this.snackbarService.success('Groupe mis à jour avec succès');
        } else {
          this.snackbarService.error(response.message || 'Erreur lors de la mise à jour du groupe');
        }
      }),
      catchError(error => {
        const messageTxt = 'Erreur lors de la mise à jour du groupe';
        console.error(messageTxt, error);
        this.snackbarService.error(messageTxt);
        return of({ success: false, message: messageTxt } as ApiResponse);
      })
    );
  }

  /**
   * Supprimer un utilisateur par son cd_salarie
   * @param cd_salarie L'ID de l'utilisateur à supprimer
   * @returns Observable<ApiResponse> avec success true/false et message optionnel
   */
  deleteUser(cd_salarie: string): Observable<ApiResponse> {
    try {
      return this.http.delete<ApiResponse>(`${this.activeUrl}delete/admin.salaries/cd_salarie=${cd_salarie}`).pipe(
        tap(response => {
          if (response.success) {
            this.snackbarService.success('Utilisateur supprimé avec succès');
          } else {
            this.snackbarService.error(response.message || 'Erreur lors de la suppression de l\'utilisateur');
          }
        }),
        catchError(error => {
          const messageTxt = 'Erreur lors de la suppression de l\'utilisateur';
          console.error(messageTxt, error);
          this.snackbarService.error(messageTxt);
          return of({ success: false, message: messageTxt } as ApiResponse);
        })
      );
    } catch (error) {
      if (cd_salarie === '') {
        const messageTxt = 'CD salarié vide pour la suppression de l\'utilisateur. Il est obligatoire';
        console.error(messageTxt);
        this.snackbarService.error(messageTxt);
        return of({ success: false, message: messageTxt } as ApiResponse);
      } else {
        const messageTxt = 'Erreur inattendue lors de la suppression de l\'utilisateur';
        console.error(messageTxt, error);
        this.snackbarService.error(messageTxt);
        return of({ success: false, message: messageTxt } as ApiResponse);
      }
    }

  }
}
