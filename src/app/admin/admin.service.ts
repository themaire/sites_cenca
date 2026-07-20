import { environment } from '../../environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { of, from, Observable } from 'rxjs';

import { ApiResponse } from '../shared/interfaces/api';
import { Selector } from '../shared/interfaces/selector';
import { Salaries, Salarie, Groupes, Groupe, SalarieGroupe } from './admin';
import { News } from '../shared/interfaces/news';
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

    // fetch() n'est pas intercepté par authTokenInterceptor (qui ne patche que HttpClient) :
    // le token doit être attaché manuellement ici pour les routes admin protégées.
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message || `Erreur ${response.status} lors de l'appel à ${url}`);
    }

    return (await response.json()) ?? [];
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

  // Récupérer les groupes d'un salarié
  async getUserGroups(cd_salarie: string): Promise<SalarieGroupe[]> {
    return this.getData<SalarieGroupe[]>(`users/groups/${cd_salarie}`);
  }

  addGroupToUser(cd_salarie: string, gro_id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.activeUrl}post/user/group/${cd_salarie}`, { gro_id }).pipe(
      tap(response => {
        if (response.success) {
          this.snackbarService.success('Groupe ajouté avec succès');
        } else {
          this.snackbarService.error(response.message || 'Erreur lors de l\'ajout du groupe');
        }
      }),
      catchError(error => {
        const messageTxt = 'Erreur lors de l\'ajout du groupe';
        console.error(messageTxt, error);
        this.snackbarService.error(messageTxt);
        return of({ success: false, message: messageTxt } as ApiResponse);
      })
    );
  }

  removeGroupFromUser(salgro_id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.activeUrl}delete/salarie_groupes/salgro_id=${salgro_id}`).pipe(
      tap(response => {
        if (response.success) {
          this.snackbarService.success('Groupe retiré avec succès');
        } else {
          this.snackbarService.error(response.message || 'Erreur lors de la suppression du groupe');
        }
      }),
      catchError(error => {
        const messageTxt = 'Erreur lors de la suppression du groupe';
        console.error(messageTxt, error);
        this.snackbarService.error(messageTxt);
        return of({ success: false, message: messageTxt } as ApiResponse);
      })
    );
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
   * Créer un nouvel utilisateur
   * @param userData Les données de l'utilisateur à créer (sans cd_salarie, généré par la DB)
   * @returns Observable<ApiResponse> avec success true/false et message optionnel
   */
  createUser(userData: Omit<Salarie, 'cd_salarie'>): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.activeUrl}post/user/create`, userData).pipe(
      tap(response => {
        if (response.success) {
          this.snackbarService.success('Utilisateur créé avec succès');
        } else {
          this.snackbarService.error(response.message || 'Erreur lors de la création de l\'utilisateur');
        }
      }),
      catchError(error => {
        const messageTxt = 'Erreur lors de la création de l\'utilisateur';
        console.error(messageTxt, error);
        this.snackbarService.error(messageTxt);
        return of({ success: false, message: messageTxt } as ApiResponse);
      })
    );
  }

  /**
   * Créer un nouveau groupe
   * @param groupData Les données du groupe à créer (sans gro_id, généré par la DB)
   * @returns Observable<ApiResponse> avec success true/false et message optionnel
   */
  createGroup(groupData: Omit<Groupe, 'gro_id'>): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.activeUrl}post/group/create`, groupData).pipe(
      tap(response => {
        if (response.success) {
          this.snackbarService.success('Groupe créé avec succès');
        } else {
          this.snackbarService.error(response.message || 'Erreur lors de la création du groupe');
        }
      }),
      catchError(error => {
        const messageTxt = 'Erreur lors de la création du groupe';
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
   * Supprimer un groupe par son gro_id
   * @param gro_id L'ID du groupe à supprimer
   * @returns Observable<ApiResponse> avec success true/false et message optionnel
   */
  deleteGroup(gro_id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.activeUrl}delete/admin.groupes/gro_id=${gro_id}`).pipe(
      tap(response => {
        if (response.success) {
          this.snackbarService.success('Groupe supprimé avec succès');
        } else {
          this.snackbarService.error(response.message || 'Erreur lors de la suppression du groupe');
        }
      }),
      catchError(error => {
        const messageTxt = 'Erreur lors de la suppression du groupe';
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

  // Récupérer les détails d'une actualité par son id
  async getNewsById(id: string): Promise<News> {
    return this.getData<News>(`news/full/${id}`);
  }

  // Récupérer la liste de toutes les actualités (publiées et brouillons)
  async getAllNews(): Promise<News[]> {
    return this.getData<News[]>('news/lite');
  }

  /**
   * Créer une nouvelle actualité
   * @param newsData Les données de l'actualité à créer (sans id, généré par la DB)
   * @returns Observable<ApiResponse> avec success true/false et message optionnel
   */
  createNews(newsData: Omit<News, 'id'>): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.activeUrl}post/news/create`, newsData).pipe(
      tap(response => {
        if (response.success) {
          this.snackbarService.success('Actualité créée avec succès');
        } else {
          this.snackbarService.error(response.message || 'Erreur lors de la création de l\'actualité');
        }
      }),
      catchError(error => {
        const messageTxt = 'Erreur lors de la création de l\'actualité';
        console.error(messageTxt, error);
        this.snackbarService.error(messageTxt);
        return of({ success: false, message: messageTxt } as ApiResponse);
      })
    );
  }

  /**
   * Modifier une actualité
   * @param newsData Les données de l'actualité à modifier
   * @returns Observable<ApiResponse> avec success true/false et message optionnel
   */
  updateNews(newsData: News, id: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.activeUrl}put/news/update/${id}`, newsData).pipe(
      tap(response => {
        if (response.success) {
          this.snackbarService.success('Actualité mise à jour avec succès');
        } else {
          this.snackbarService.error(response.message || 'Erreur lors de la mise à jour de l\'actualité');
        }
      }),
      catchError(error => {
        const messageTxt = 'Erreur lors de la mise à jour de l\'actualité';
        console.error(messageTxt, error);
        this.snackbarService.error(messageTxt);
        return of({ success: false, message: messageTxt } as ApiResponse);
      })
    );
  }

  /**
   * Supprimer une actualité par son id
   * @param id L'ID de l'actualité à supprimer
   * @returns Observable<ApiResponse> avec success true/false et message optionnel
   */
  deleteNews(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.activeUrl}delete/gestint.news/id=${id}`).pipe(
      tap(response => {
        if (response.success) {
          this.snackbarService.success('Actualité supprimée avec succès');
        } else {
          this.snackbarService.error(response.message || 'Erreur lors de la suppression de l\'actualité');
        }
      }),
      catchError(error => {
        const messageTxt = 'Erreur lors de la suppression de l\'actualité';
        console.error(messageTxt, error);
        this.snackbarService.error(messageTxt);
        return of({ success: false, message: messageTxt } as ApiResponse);
      })
    );
  }
}
