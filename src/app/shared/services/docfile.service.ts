import { environment } from '../../../environments/environment';

import { Injectable, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ApiResponse } from '../interfaces/api';
import { ProjetService } from '../../sites/site-detail/detail-projets/projets.service';
import { SitesService } from '../../sites/sites.service';
import { Localisation } from '../../shared/interfaces/localisation';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';

import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, map } from 'rxjs/operators';
import { FormGroup } from '@angular/forms';

import { DetailPmfuComponent } from '../../sites/foncier/fon-pmfu/detail-pmfu/detail-pmfu.component';
import { ContentObserver } from '@angular/cdk/observers';

export interface Docfile {
  doc_path?: string;
  doc_name?: string;
  cd_type?: number;
  doc_id?: number;
}
@Injectable({ providedIn: 'root' })
export class DocfileService {
  private activeUrl: string = environment.apiUrl + 'sites/'; // Bureau
  hasFiles!: boolean;
  filesNames: string[][] = [];
  @ViewChildren('fileInput') fileInputs!: QueryList<
    ElementRef<HTMLInputElement>
  >;
  docfiles: Docfile[] = [];
  doc_types: { cd_type: number; libelle: string; path: string; field: string }[] = [];
  constructor(
    private http: HttpClient,
    private projetService: ProjetService,
    private sitesService: SitesService,
    private snackBar: MatSnackBar
  ) {}
  filePathList: string[] = [];
  allFiles: number[] = [];
  loadDocTypes(section: number): Promise<void> {
    return this.http
      .get<{ cd_type: number; libelle: string; path: string; field: string }[]>(
        environment.apiUrl + `sites/selectvalues=files.libelles/${section}`
      )
      .toPromise()
      .then((data) => {
        // data peut être undefined -> on met une valeur par défaut
        this.doc_types = data ?? [];
        console.log('Types de documents chargés :', this.doc_types);
      })
      .catch((err) => {
        console.error('Erreur lors du chargement des doc types', err);
        this.doc_types = [];
      });
  }
  getTypes() {
    return this.doc_types;
  }

  getTypeNames() {
    return this.doc_types.map((t) => t.libelle);
  }
  getTypeFields() {
    return this.doc_types.map((t) => t.field);
  }

  getTypeId(name: string): number | undefined {
    return this.doc_types.find((t) => t.libelle === name)?.cd_type;
  }
  onFileSelected(event: any, controlName: string, docForm: FormGroup) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);

      const currentFiles: File[] = docForm.get(controlName)?.value || [];
      docForm.patchValue({ [controlName]: [...currentFiles, ...files] });
      docForm.get(controlName)?.updateValueAndValidity();
    }
  }

  /** Méthode pour gérer la soumission du formulaire de doc
   * Verifie et affiche un snackbar en cas d'erreur
   * @param docForm - Formulaire contenant les données du docfiles
   * @param fileInputs - Référence aux éléments input de type fichier
   */
  handleDocfileSubmission(
    docForm: FormGroup,
    fileInputs: ElementRef,
    pmfu_id: number
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.hasFiles) {
        resolve();
        return;
      }
      console.log('pmfu_id dans handleDocfileSubmission():', pmfu_id);
      this.submitDocfiles(docForm, pmfu_id).subscribe({
        next: (response: ApiResponse) => {
          if (response.success) {
            const resetValues: any = {};
            this.getTypeNames().forEach((type) => {
              resetValues[type] = null;
            });
            docForm.patchValue(resetValues);

            // Vide les <input type="file">
            if (fileInputs) {
              this.fileInputs.forEach((ref) => (ref.nativeElement.value = ''));
            }

            this.snackBar.open('Docfiles importés avec succès', 'Fermer', {
              duration: 3000,
              panelClass: ['success-snackbar'],
            });
          } else {
            this.snackBar.open(
              response.message || "Erreur lors de l'import",
              'Fermer',
              { duration: 3000, panelClass: ['error-snackbar'] }
            );
          }
          resolve();
        },
        error: (error) => {
          console.error('Erreur de docfiles:', error?.error?.message);
          this.snackBar.open(
            error?.error?.message || "Erreur lors de l'import du docfiles",
            'Fermer',
            { duration: 3000, panelClass: ['error-snackbar'] }
          );
          resolve();
        },
      });
    });
  }

  /** Soumettre le docfiles au backend */
  submitDocfiles(docForm: FormGroup, ref_id: number): Observable<ApiResponse> {
    if (!docForm) {
      return of({
        success: false,
        message: 'Formulaire introuvable.',
      } as ApiResponse);
    }
    console.log('Dans submitDocfiles() avec docForm:', docForm.value);

    const formData = new FormData();
    formData.append('ref_id', ref_id.toString());

    const types = this.getTypes();

    types.forEach(({ field }) => {
      const files: File[] = docForm.get(field)?.value;
      if (files?.length) {
        files.forEach((file) => formData.append(field, file));
      }
    });

    return this.projetService.uploadDocfile(formData);
  }
  getDocfilesList(pmfu_id: number, cd_type: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sitesService.getDocfiles(pmfu_id, cd_type).subscribe({
        next: (response: any) => {
          this.docfiles = response || [];
          this.hasFiles = this.docfiles.length > 0;
          this.filePathList = this.docfiles.map(
            (docfile: any) => docfile.doc_path.split('\\').pop() || ''
          );
          resolve();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des docfiles:', error);
          reject(error);
        },
      });
    });
  }

  //
  // Déplacer le split ?
  //

  getFilesList(cd_type: number, section: number, ref_id?: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sitesService.getFiles(cd_type, section, ref_id).subscribe({
        next: (response: any) => {
          this.docfiles = response || [];
          this.hasFiles = this.docfiles.length > 0;
          this.filePathList = this.docfiles.map((docfile: any) => {
            if (!docfile || !docfile.doc_path) {
              return '';
            }
            return docfile.doc_path.split('\\').slice(1).join('\\');
          });
          this.allFiles = this.docfiles.map(
            (docfile: any) => docfile.doc_type as number
          );
          console.log('this.allFiles:', this.allFiles);
          resolve();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des docfiles:', error);
          reject(error);
        },
      });
    });
  }
  deleteDocfile(doc_path: string): Observable<ApiResponse> {
    console.log(
      'lien de suppression :',
      `${this.activeUrl}delete/sitcenca.pmfu_docs?doc_path=${doc_path}`
    );
    console.log('doc_path envoyé :', doc_path);
    return this.http
      .delete<ApiResponse>(
        `${this.activeUrl}delete/sitcenca.pmfu_docs?doc_path=${doc_path}`
      )
      .pipe(
        map((response) => {
          console.log('Réponse complète:', response);
          return response; // ← Important : retourner la réponse
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Erreur HTTP:', error);
          return of({
            success: false,
            message: `Erreur ${error.status}: ${error.message}`,
            code: error.status || -1,
          } as ApiResponse);
        })
      );
  }
  deleteFile(doc_path: string): Observable<ApiResponse> {
    console.log(
      'lien de suppression :',
      `${this.activeUrl}delete/files.docs?doc_path=${doc_path}`
    );
    console.log('doc_path envoyé :', doc_path);
    return this.http
      .delete<ApiResponse>(
        `${this.activeUrl}delete/files.docs?doc_path=${doc_path}`
      )
      .pipe(
        map((response) => {
          console.log('Réponse complète:', response);
          return response; // ← Important : retourner la réponse
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Erreur HTTP:', error);
          return of({
            success: false,
            message: `Erreur ${error.status}: ${error.message}`,
            code: error.status || -1,
          } as ApiResponse);
        })
      );
  }
}
