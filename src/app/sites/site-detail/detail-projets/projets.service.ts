import { environment } from '../../../../environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { SnackbarService } from '../../../shared/services/snackbar.service';


// prototypes utilisés dans la promise de la fonction
import { Projet } from './projets';
import { Operation, OperationLite, OperationCheckbox } from './projet/operation/operations';
import { Objectif } from './projet/objectif/objectifs';
import { SelectValue } from '../../../shared/interfaces/formValues';
import { ApiResponse } from '../../../shared/interfaces/api';
import { Localisation } from '../../../shared/interfaces/localisation';
// import { emitDistinctChangesOnlyDefaultValue } from '@angular/compiler';

export enum DeleteItemTypeEnum {
    localisation = 'localisation',
    operation = 'operation',
    projet = 'projet',
    objectif = 'objectif'
}

@Injectable({
  providedIn: 'root'
})
export class ProjetService {
  private activeUrl: string = environment.apiUrl +"sites/"; // Bureau

  constructor(
    private http: HttpClient,
    private snackbarService: SnackbarService,
  ) {}

  // PROJETS
  // Utilisé dans projet.component.ts
  async getProjet(subroute: string): Promise<Projet> {
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }

  // Utilisé dans x.component.ts
  insertProjet(projet: Projet): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=projets/insert`;
    return this.http.put<ApiResponse>(url, projet);
  }


  // OPERATIONS
  // Utilisé dans operation.component.ts
  async getOperations(subroute: string): Promise<OperationLite[]> {
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }
  
  // Utilisé dans operation.component.ts
  async getOperation(subroute: string): Promise<Operation> {
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }
  
  // Utilisé aussi dans operation.component.ts
  async getOperationProgrammes(subroute: string): Promise<OperationCheckbox[]> {
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }
  
  // Utilisé aussi dans operation.component.ts
  async getOperationAnimaux(subroute: string): Promise<OperationCheckbox[]> {
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }

  insertOperation(operation: Operation): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=operations/insert`;
    return this.http.put<ApiResponse>(url, operation);
  }
  
  // updateOperation(operation: Operation): Observable<ApiResponse> {
    //   const url = `${this.activeUrl}put/table=operations/uuid=${operation.uuid_ope}`;
    //   return this.http.put<ApiResponse>(url, operation);
    // }
  
  deleteOperation(uuid_ope: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.activeUrl}delete/opegerer.operations/uuid_ope=${uuid_ope}`).pipe(
      catchError(error => {
        console.error("Erreur lors de la suppression de l'opération:", error);
        return of({ success: false, message: "Erreur lors de la suppression de l'opération" } as ApiResponse);
      })
    );
  }
  
  deleteProjet(uuid_proj: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.activeUrl}delete/opegerer.projets/uuid_proj=${uuid_proj}`).pipe(
      catchError(error => {
        console.error("Erreur lors de la suppression de l'opération:", error);
        return of({ success: false, message: "Erreur lors de la suppression de l'opération" } as ApiResponse);
      })
    );
  }

  /** Gestion des cases à cocher dans un formumaire
  *   Utilisé dans operation.component.ts - Ajouter un élément revient à cocher une case dans le formulaire
  *   @param checkBoxList: OperationCheckbox[] : l'objet contenant les informations du programme d'une opération
  */
  insertCheckbox(checkBoxList: OperationCheckbox, table: string): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=${table}/insert`;
    return this.http.put<ApiResponse>(url, checkBoxList);
  }

  /** Supprimer un programme d'une opération - Gestion des cases à cocher dans le formulaire d'édition d'une opération
  *   Utilisé dans operation.component.ts - Supprimer un élément revient à faire décocher une case dans le formulaire
  *   @param uuid_ope : l'uuid de l'opération
  *   @param programme_id : l'id du programme
  */
  deleteCheckbox(keyName: string, uuid: string, programme_id: number, table: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.activeUrl}delete/opegerer.${table}/${keyName}=${uuid}/checkbox_id/${programme_id}`).pipe(
      catchError(error => {
        const messageTxt = `Erreur lors de la suppression de l'opération-programme (uuid: ${uuid}, checkbox_id: ${programme_id})`;
        console.error(messageTxt, error);
        return of({ success: false, message: messageTxt } as ApiResponse);
      })
    );
  }
    
  // Utilisé dans objectifs.component.ts
  async getObjectif(subroute: string): Promise<Objectif> {
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }

  // Utilisé dans objectifs.component.ts
  async getObjectifs(subroute: string): Promise<Objectif[]> {
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }

  // Utilisé dans objectifs.component.ts
  insertObjectif(objectif: Operation): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/table=objectifs/insert`;
    return this.http.put<ApiResponse>(url, objectif);
  }
  
  // Envoyer le fichier shapefile et le type de géométrie
  // Utilisé dans objectifs.component.ts
  uploadShapefile(formData: FormData): Observable<ApiResponse> {
    const url = `${this.activeUrl}put/ope_shapefile`;
    
    // Log du contenu du FormData avant envoi
    console.log('Contenu du FormData avant envoi depuis projetSerice.uploadShapefile():');
    for (let pair of (formData as any).entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    
    return this.http.post<ApiResponse>(url, formData).pipe(
      catchError(error => {
        console.error('Error uploading shapefile:', error);
        return of({ success: false, message: 'Error uploading shapefile' } as ApiResponse);
      })
    );
  }
  
  // Utilisé dans operation.component.ts
  async getLocalisations(subroute: string): Promise<Localisation[]> {
    const data = await fetch(this.activeUrl + subroute);
    return await data.json() ?? [];
  }

  deleteLocalisation(loc_id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.activeUrl}delete/opegerer.localisations/loc_id=${loc_id}`).pipe(
      catchError(error => {
        console.error('Erreur lors de la suppression de la localisation:', error);
        return of({ success: false, message: 'Erreur lors de la suppression de la localisation' } as ApiResponse);
      })
    );
  }

  deleteItem(type: DeleteItemTypeEnum, operation?: void | Operation, localisation?: void | Localisation, projet?: void | Projet, objectif?: void | Objectif): Observable<boolean> {
    if (type === 'localisation' && localisation) {
      const localisationId = localisation.loc_id;
      return new Observable<boolean>(observer => {
        this.deleteLocalisation(localisationId).subscribe(
          (response: ApiResponse) => {
            if (response.success) {
              this.snackbarService.delete(type);
              observer.next(true);
            } else {
              const message = response.message || 'Erreur lors de la suppression de la localisation';
              this.snackbarService.error(message);
              console.error(message);
              observer.next(false);
            }
            observer.complete();
          },
          error => {
            this.snackbarService.error('Erreur lors de la suppression de la localisation');
            observer.next(false);
            observer.complete();
          }
        );
      });
    } else if (type === 'operation' && operation) {
      const operationId = operation.uuid_ope;
      return new Observable<boolean>(observer => {
        this.deleteOperation(operationId).subscribe(
          (response: ApiResponse) => {
            if (response.success) {
              console.log('Opération supprimée avec succès');
              this.snackbarService.delete(type);
              observer.next(true);
            } else {
              const message = response.message || 'Erreur lors de la suppression de l\'opération';
              this.snackbarService.error(message);
              console.error(message);
              observer.next(false);
            }
            observer.complete();
          },
          error => {
            this.snackbarService.error('Erreur lors de la suppression de l\'opération');
            observer.next(false);
            observer.complete();
          }
        );
      });
    } else if (type === 'projet' && projet) {
      const projetId = projet.uuid_proj;
      return new Observable<boolean>(observer => {
        this.deleteProjet(projetId).subscribe(
          (response: ApiResponse) => {
            if (response.success) {
              console.log('Opération supprimée avec succès');
              this.snackbarService.delete(type);
              observer.next(true);
            } else {
              const message = response.message || 'Erreur lors de la suppression du projet';
              this.snackbarService.error(message);
              console.error(message);
              observer.next(false);
            }
            observer.complete();
          },
          error => {
            this.snackbarService.error('Erreur lors de la suppression du projet');
            observer.next(false);
            observer.complete();
          }
        );
      });
    } else {
      console.error(`Aucun ${type} à supprimer`);
      this.snackbarService.info(`Aucun element "${type}" à supprimer`);
      return of(false); // Aucune action effectuée
    }
  }

  getLibelleByCdType(
      cdType: string | number | null,
      liste1: SelectValue[],
      liste2?: SelectValue[],
      liste3?: SelectValue[],
      liste4?: SelectValue[],
      liste5?: SelectValue[]
    ): string | undefined {
      if (!liste1) {
        console.warn('getLibelleFromCd appelé avec une liste undefined');
        return '';
      }
      const listes = [liste1, liste2, liste3, liste4, liste5].filter(Boolean) as SelectValue[][];
      for (const liste of listes) {
        const type = liste.find(t => t.cd_type === cdType);
        if (type?.libelle) {
          return type.libelle;
        }
      }
      return undefined;
    }
}