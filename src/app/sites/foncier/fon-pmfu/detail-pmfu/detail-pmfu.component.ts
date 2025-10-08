import {
  Component,
  Inject,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '../../../../../../node_modules/@angular/common';

import {
  MatDialogRef,
  MatDialog,
  MatDialogModule,
  MatDialogTitle,
  MatDialogContent,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';

import { ProjetMfu, ProjetsMfu } from '../../foncier';
import { FoncierService } from '../../foncier.service';
import { ImagePmfuComponent } from './image-pmfu/image-pmfu.component';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';

import { SelectValue } from '../../../../shared/interfaces/formValues';
import { FormService } from '../../../../shared/services/form.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { FormButtonsComponent } from '../../../../shared/form-buttons/form-buttons.component';
import { FileExploratorComponent } from '../../../../shared/file-explorator/file-explorator.component';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { LoginService } from '../../../../login/login.service';
import { Subscription, lastValueFrom } from 'rxjs';

import {
  MatStepperModule,
  StepperOrientation,
} from '@angular/material/stepper';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import {
  MatDatepickerIntl,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import {
  MatNativeDateModule,
  MAT_DATE_LOCALE,
  DateAdapter,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';

import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import 'moment/locale/fr';

import { MatSnackBar } from '@angular/material/snack-bar'; // Importer MatSnackBar

import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs/operators';
import { Observable, BehaviorSubject } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';

import { DocfileService } from '../../../../shared/services/docfile.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { renderAsync } from 'docx-preview';

import { ApiResponse } from '../../../../shared/interfaces/api';
import { User } from '../../../../login/user.model';
export interface Section {
  cd_type: number;
  name: string;
  numberElements?: number;
}
@Component({
  selector: 'app-detail-pmfu',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatDialogContent,
    MatIconModule,
    FormButtonsComponent,
    FileExploratorComponent,
    ReactiveFormsModule,
    MatStepperModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    AsyncPipe,
    MatButtonModule,
    MatListModule,
  ],
  templateUrl: './detail-pmfu.component.html',
  styleUrl: './detail-pmfu.component.scss',
})
export class DetailPmfuComponent {
  pmfu!: ProjetMfu;
  projetLite!: ProjetsMfu;
  isLoading: boolean = true;
  loadingDelay: number = 400;
  doc_types!: {
    cd_type: number;
    libelle: string;
    path: string;
    field: string;
  }[];
  selectedFolder?: number;
  isDragging: boolean = false;
  isAddPmfu: boolean = false;
  isEditPmfu: boolean = false;
  newPmfu: boolean = false;
  pmfuTitle: String = '';
  pmfuForm!: FormGroup;
  initialFormValues!: ProjetMfu;
  docForm!: FormGroup;
  isFormValid: boolean = false;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('docxContainer', { static: false })
  docxContainer!: ElementRef<HTMLDivElement>;
  galerie?: string[];
  private formStatusSubscription: Subscription | null = null;
  folders: Section[] = [];
  filePathList: string[] = [];
  previewUrl?: SafeResourceUrl;
  isDocxView = false;
  pdfUrl?: string;
  imageUrl?: string;
  imagePathList?: string[];
  filesNames: string[][] = [];
  fileErrors: Record<string, string[]> = {};
  responsables: SelectValue[] = [];
  private foldersSubject = new BehaviorSubject<Section[]>([]);
  allowedTypes: Record<string, string[]> = {};
  folders$ = this.foldersSubject.asObservable();
  @ViewChild(FileExploratorComponent) fileExplorator!: FileExploratorComponent;
  constructor(
    public docfileService: DocfileService,
    private confirmationService: ConfirmationService,
    private formService: FormService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private foncierService: FoncierService,
    private loginService: LoginService, // Inject LoginService
    private dialogRef: MatDialogRef<DetailPmfuComponent>,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private overlay: Overlay,
    @Inject(MAT_DIALOG_DATA) public data: ProjetsMfu | number // Inject MAT_DIALOG_DATA to access the passed data
  ) {
    // Données en entrée provenant de la liste simple des projets tous confondus
    console.log('Données reçues dans le composant projet :', data);
    if (typeof data === 'object') {
      this.projetLite = data as ProjetsMfu;
      console.log(
        'ProjetLite reçu dans le composant projet :',
        this.projetLite
      );
    }
  }
  toggleEditPmfu(): void {
    this.isEditPmfu = this.formService.simpleToggle(this.isEditPmfu); // Changer le mode du booleen
    if (this.isEditPmfu) {
      this.formStatusSubscription = this.pmfuForm.statusChanges.subscribe(
        (status) => {
          this.isFormValid = this.pmfuForm.valid; // Mettre à jour isFormValid en temps réel
          this.cdr.detectChanges(); // Forcer la détection des changements dans le parent
        }
      );
    }
    this.formService.toggleFormState(
      this.pmfuForm,
      this.isEditPmfu,
      this.initialFormValues
    ); // Changer l'état du formulaire
    this.cdr.detectChanges(); // Forcer la détection des changements
  }
  onSubmit(): void {
    // Mettre à jour le formulaire
    this.selectedFolder = undefined;
    this.galerie = undefined;
    this.filePathList = [];
    this.filesNames = [];
    if (!this.newPmfu) {
      this.isLoading = true;
      setTimeout(async () => {
        console.log(
          "Modification d'un projet MFU existant",
          this.pmfuForm.value
        );

        let pmfu_id!: number;
        if (this.projetLite.pmfu_id !== undefined) {
          pmfu_id = this.projetLite.pmfu_id;
        } else if (this.pmfuForm.get('pmfu_id') !== null) {
          pmfu_id = this.pmfu.pmfu_id;
        }
        console.log('pmfu_id dans onSubmit() : ' + pmfu_id);
        const submitObservable = this.formService.putBdd(
          'update',
          'projets_mfu',
          this.pmfuForm,
          this.isEditPmfu,
          this.snackBar,
          pmfu_id.toString(),
          this.initialFormValues
        );
        // S'abonner à l'observable
        if (submitObservable) {
          submitObservable.subscribe(
            async (result) => {
              this.hasFiles();
              if (!this.docfileService.hasFiles && result.isEdited) {
                setTimeout(() => {
                  this.snackBar.open('Aucun fichier sélectionné', 'Fermer', {
                    duration: 3000,
                    panelClass: ['error-snackbar'],
                  });
                }, 1000);
              }
              this.pmfu = result.formValue;
              this.isEditPmfu = result.isEditMode;
              this.initialFormValues = result.formValue;
              try {
                // on déclenche les uploads et on attend qu'ils soient terminés (ou échouent)
                await this.docfileService.handleDocfileSubmission(
                  this.docForm!,
                  this.fileInput,
                  this.pmfu.pmfu_id
                );
                if (this.fileExplorator) {
                  this.fileExplorator.updateFolderCounts();
                }
              } catch (err) {
                console.warn('Upload des fichiers échoué ou interrompu :', err);
                // gérer l'erreur si besoin (snackbar, etc.)
              }
              await this.setupPmfuForm();
              this.cdr.detectChanges();
              this.isFormValid = true;
              console.log('Projet mis à jour avec succès:', result.formValue);
            },
            (error) => {
              console.error(
                'Erreur lors de la mise à jour du formulaire',
                error
              );
            }
          );
        }
        this.isLoading = false;
      }, this.loadingDelay);
    } else if (this.newPmfu) {
      console.log(
        "Création d'un nouveau projet dans la BDD. this.newProjet = " +
          this.newPmfu
      );
      this.pmfuForm.value.pmfu_id = 0;

      console.log('pmfuForm avant envoi :');
      console.log(this.pmfuForm.value);
      const submitObservable = this.formService.putBdd(
        'insert',
        'projets_mfu',
        this.pmfuForm,
        this.isEditPmfu,
        this.snackBar
      );
      this.dialogRef.close(); // Fermer la fenêtre de dialogue immédiatement après la soumission

      // S'abonner à l'observable
      if (submitObservable) {
        submitObservable.subscribe(
          (result) => {
            this.isEditPmfu = result.isEditMode;
            this.initialFormValues = result.formValue;
            this.newPmfu = false; // On n'est plus en mode création, donc maintenant le formulaire s'affiche normalement
            // Les steps du stepper sont affichés et apparaissent comme en mode consultation (edition)
            this.pmfu = result.formValue;
            this.cdr.detectChanges();
            // La liste des projets dans le composant parent sera mise à jour au moment de fermer la fenêtre de dialogue
            console.log(
              'Nouveau projet enregistré avec succès:',
              result.formValue
            );
            this.hasFiles();
            this.docfileService.handleDocfileSubmission(
              this.docForm!,
              this.fileInput,
              this.pmfu.pmfu_id
            );
          },
          (error) => {
            console.error('Erreur lors de la mise à jour du formulaire', error);
          }
        );
      }
    }
  }
  updatePmfuTitle() {
    this.pmfuTitle = this.pmfu.pmfu_nom;
  }
  async fetch(pmfu_id: Number): Promise<ProjetMfu | undefined> {
    // Récupérer les données d'un projet à partir de son ID
    // @param : gestion ou autre pour que le back sache quelle table interroger
    // !! Le backend ne fera pas la meme requete SQL si on est en gestion ou autre
    // Il s'agira de deux schémas different où les données sont stockées

    const subroute = `pmfu/id=${pmfu_id}/full`; // Full puisque UN SEUL projet
    console.log('subroute dans fetch : ' + subroute);
    console.log(
      "Récupération des données du projet avec l'ID du projet :" + pmfu_id
    );
    const pmfu = await this.foncierService.getProjetMfu(subroute);
    return pmfu as ProjetMfu; // Retourner l'objet Projet complet
  }

  async ngOnInit() {
    await this.docfileService.loadDocTypes(1);
    this.doc_types = this.docfileService.doc_types;
    this.initializeAllowedTypes();
    // Initialiser les valeurs du formulaire principal quand le composant a fini de s'initialiser
    const cd_salarie = this.loginService.user()?.cd_salarie || null; // Code salarié de l'utilisateur connecté

    // Récupérer les données d'un projet ou créer un nouveau projet
    // this.projetLite est assigné dans le constructeur et vient de data (fenetre de dialogue)
    if (this.projetLite?.pmfu_id) {
      // Quand un ID est passé en paramètre
      try {
        // Simuler un délai artificiel
        setTimeout(async () => {
          this.formService
            .getSelectValues$('sites/selectvalues=admin.salaries/')
            .subscribe((selectValues: SelectValue[] | undefined) => {
              this.responsables = selectValues || [];
              console.log('this.responsables : ');
              console.log(this.responsables);
            });
          // Accéder aux données du projet (va prendre dans le schema opegerer ou opeautre)

          // Accéder données du projet
          // Assigner l'objet projet directement et forcer le type Projet
          if (this.projetLite) {
            await this.setupPmfuForm();
          } else {
            // Défini un formulaire vide pour le projet MFU
            this.pmfuForm = this.formService.newPmfuForm();
            this.initialFormValues = this.pmfuForm.value; // Garder une copie des valeurs initiales du formulaire
            this.docForm = this.formService.newDocForm();
            console.log(this.docForm);
            this.cdr.detectChanges();
          }
          // Souscrire aux changements du statut du formulaire principal (projetForm)
          this.formStatusSubscription = this.pmfuForm.statusChanges.subscribe(
            (status) => {
              this.isFormValid = this.pmfuForm.valid; // Mettre à jour isFormValid en temps réel
              this.cdr.detectChanges(); // Forcer la détection des changements dans le parent
            }
          );

          this.isLoading = false; // Le chargement est terminé
        }, this.loadingDelay);
      } catch (error) {
        console.error(
          'Erreur lors de la récupération des données du projet',
          error
        );
        this.isLoading = false; // Même en cas d'erreur, arrêter le spinner
        this.cdr.detectChanges();
      }
    } else {
      // Projet neuf à créer
      console.log(
        'Nous avons visiblement un projet neuf à créer. Pas de pmfu_id dans this.projetLite.'
      );
      console.log(this.projetLite);
      try {
        this.newPmfu = true;
        // Passer directement en mode edition
        this.isEditPmfu = true; // On est en mode édition

        // Créer un formulaire vide
        // Le form_group correspondant aux projet neuf à créer
        this.pmfuForm = this.formService.newPmfuForm(undefined, 0);

        // Le form_group correspondant aux documents
        this.docForm = this.formService.newDocForm();
        // Définir les valeurs par défaut pour créateur et responsable
        this.formService
          .getSelectValues$('sites/selectvalues=admin.salaries/')
          .subscribe((selectValues: SelectValue[] | undefined) => {
            this.responsables = selectValues || [];
            this.pmfuForm.patchValue({
              pmfu_responsable: cd_salarie ? cd_salarie : '',
              pmfu_createur: cd_salarie,
            });
          });
        console.log(
          'Formulaire de projet créé avec succès :',
          this.pmfuForm.value
        );

        // Souscrire aux changements du statut du formulaire principal (projetForm)
        this.formStatusSubscription = this.pmfuForm.statusChanges.subscribe(
          (status) => {
            this.isFormValid = this.pmfuForm.valid; // Mettre à jour isFormValid en temps réel
            // console.log('Statut du formulaire principal :', status);
            // console.log("this.isFormValid = this.projetForm.valid :");
            // console.log(this.isFormValid + " = " + this.projetForm.valid);
            // console.log("isFormValid passé à l'enfant:", this.isFormValid);
            this.cdr.detectChanges(); // Forcer la détection des changements dans le parent
          }
        );

        this.isLoading = false; // Le chargement est terminé
      } catch (error) {
        console.error(
          'Erreur lors de la création du formulaire du nouveau projet.',
          error
        );
        this.isLoading = false; // Même en cas d'erreur, arrêter le spinner
        this.cdr.detectChanges();
      }
    }
  }
  private defaultExtensions: Record<string, string[]> = {
    doc: ['.pdf', '.doc', '.docx'],
    image: ['.jpg', '.jpeg', '.png'],
  };
  initializeAllowedTypes(): void {
    this.allowedTypes = this.doc_types.reduce((acc, type) => {
      const name = type.field;
      const isImage =
        name.toLowerCase().includes('photo') ||
        name.toLowerCase().includes('image');
      acc[name] = isImage
        ? this.defaultExtensions['image']
        : this.defaultExtensions['doc'];
      return acc;
    }, {} as Record<string, string[]>);

    console.log('allowedTypes généré :', this.allowedTypes);
  }
  private isFileTypeAllowed(file: File, field: string): boolean {
    const exts = this.allowedTypes[field];
    // Vérifie si le type de fichier existe dans allowedTypes
    if (!exts) {
      console.warn(
        `Aucune règle trouvée pour ${field}. allowedTypes =`,
        this.allowedTypes
      );
      this.fileErrors[field] = this.fileErrors[field] || [];
      this.fileErrors[field].push('Type de fichier non reconnu.');
      return false;
    }

    const fileName = file.name.toLowerCase();
    const valid = exts.some((ext) => fileName.endsWith(ext));
    // Ajouter un message d'erreur si le fichier n'est pas autorisé
    if (!valid) {
      this.fileErrors[field] = this.fileErrors[field] || [];
      this.fileErrors[field].push("Le fichier n'est pas autorisé");
      setTimeout(() => {
        this.fileErrors[field] = [];
      }, 3000);
      console.log(this.fileErrors[field]);
    }

    return valid;
  }

  onFileSelected(event: any, controlName: string) {
    const files: File[] = Array.from(event.target.files);

    files.forEach((file) => {
      if (!this.isFileTypeAllowed(file, controlName)) {
        console.warn(`Fichier refusé (${file.name}) pour ${controlName}`);
        return;
      }

      this.docfileService.onFileSelected(
        { target: { files: [file] } } as any,
        controlName,
        this.docForm!
      );

      this.filesNames.push([file.name, controlName]);
    });

    console.log(this.filesNames);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onFileDropped(event: DragEvent, field: string) {
    event.preventDefault();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const files = Array.from(event.dataTransfer.files);

      files.forEach((file) => {
        if (!this.isFileTypeAllowed(file, field)) {
          console.warn(`Fichier refusé (${file.name}) pour ${field}`);
          return;
        }

        this.onFileSelected({ target: { files: [file] } } as any, field);
      });

      event.dataTransfer.clearData();
    }
  }
  removeDroppedFile(fileToRemove: [string, string]) {
    const controlName = fileToRemove[1];
    const fileName = fileToRemove[0];

    // Retirer le fichier de filesNames
    this.filesNames = this.filesNames.filter(
      (file) => !(file[0] === fileName && file[1] === controlName)
    );

    // Retirer le fichier du FormGroup
    const control = this.docForm.get(controlName);
    if (control && control.value) {
      const remainingFiles = (control.value as File[]).filter(
        (file: File) => file.name !== fileName
      );
      control.setValue(remainingFiles);
      control.updateValueAndValidity();
    }

    console.log('Fichier supprimé :', fileName);
  }

  submitDocfile(): Observable<ApiResponse> {
    return this.docfileService.submitDocfiles(
      this.docForm!,
      this.projetLite?.pmfu_id
    );
  }

  hasFiles(): void {
    console.log('docForm.value =', this.docForm.value);
    const v = this.docForm.value || {};
    const types = this.docfileService.getTypeFields();

    const hasFiles = types.some((name) => {
      const val = v[name];
      return val !== undefined && val !== null && val.length > 0;
    });

    this.docfileService.hasFiles = hasFiles;
    console.log('this.docfileService.hasFiles =', hasFiles);
  }

  dialogConfig = {
    // minWidth: '20vw',
    // maxWidth: '95vw',
    width: '580px',
    height: '220px',
    // maxHeight: '90vh',
    hasBackdrop: true, // Activer le fond
    backdropClass: 'custom-backdrop-delete', // Classe personnalisé
    enterAnimationDuration: '3000ms',
    exitAnimationDuration: '300ms',
  };

  deletePmfuConfirm(): void {
    const message = `Voulez-vous vraiment supprimer ce projet MFU?\n<strong>Cette action est irréversible.</strong>`;

    // Appel de la boîte de dialogue de confirmation
    this.confirmationService
      .confirm('Confirmation de suppression', message)
      .subscribe((result) => {
        if (result) {
          // L'utilisateur a confirmé la suppression
          // Utiliser le service projetService pour supprimer l'élément
          this.foncierService
            .deletePmfu(this.pmfu.pmfu_id as number)
            .subscribe((success) => {
              if (success) {
                // success === true ici si la suppression a réussi on ferme la fenetre de dialogue
                this.isEditPmfu = false;
                this.dialogRef.close(); // Ferme la boîte de dialogue
              } else {
                // success === false ici si la suppression a échoué
                // On ne fait rien le service a déjà géré l'erreur en affichant un message snackbar d'erreur
              }
            });
        }
      });
  }
  onFolderClick(folder: Section): void {
    this.selectedFolder = folder.cd_type;
    // Ajouter la classe CSS 'selected' à l'élément cliqué
    this.previewUrl = undefined;
    this.isDocxView = false;
    this.galerie = undefined;
    console.log('Dossier cliqué :', folder);
    try {
      this.docfileService
        .getDocfilesList(this.pmfu.pmfu_id as number, folder.cd_type)
        .then(() => {
          this.filePathList = this.docfileService.filePathList;
          console.log('this.filePathList:', this.filePathList);
          if (this.selectedFolder === 1) {
            this.getGalerie(this.filePathList);
          }
        });
    } catch (error) {
      console.error('Erreur lors du chargement des documents.', error);
    }
  }
  deleteDocfile(doc_path: string, cd_type: number): void {
    this.docfileService.docfiles.forEach((docfile: any) => {
      if (docfile.doc_path.split('\\').pop() === doc_path) {
        console.log('docfile:', docfile.doc_path);
        this.docfileService.deleteDocfile(docfile.doc_path).subscribe({
          next: (res) => {
            console.log('Suppression OK', res);
            this.setupPmfuForm().then(() => {
              this.updateFolderCountsFromPmfu(this.pmfu);
              this.docfileService
                .getDocfilesList(this.pmfu.pmfu_id as number, cd_type)
                .then(() => {
                  this.filePathList = this.docfileService.filePathList;
                });
            });
          },
          error: (err) => console.error('Erreur suppression', err),
        });
      }
    });
  }
  getFileUrl(filename: string): string {
    return `http://localhost:8887/${filename}`;
  }

  openFile(filename: string): void {
    const ext = filename.split('.').pop()?.toLowerCase();
    const url = this.getFileUrl(filename);
    this.isDocxView = false;
    this.previewUrl = undefined;
    this.pdfUrl = undefined;
    this.imageUrl = undefined;

    switch (ext) {
      case 'pdf':
        this.pdfUrl = url; // string pour vérification
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        break;

      case 'doc':
      case 'docx':
        this.isDocxView = true;
        this.renderDocx(url);
        break;

      default:
        window.open(url, '_blank');
    }
  }

  private async renderDocx(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();

      const container = this.docxContainer.nativeElement;
      if (!container) return;

      container.innerHTML = ''; // reset avant nouveau rendu

      await renderAsync(arrayBuffer, container, undefined, {
        className: 'docx',
        inWrapper: true,
        breakPages: true,
      });

      console.log('DOCX affiché');
    } catch (err) {
      console.error('Erreur affichage DOCX :', err);
    }
  }
  async setupPmfuForm() {
    try {
      // Récupération des données du projet
      this.pmfu = (await this.fetch(this.projetLite.pmfu_id)) as ProjetMfu;

      // Réaffecter le titre, formulaire, etc.
      this.updatePmfuTitle();
      this.pmfuForm = this.formService.newPmfuForm(this.pmfu);
      this.initialFormValues = this.pmfuForm.value;
      this.docForm = this.formService.newDocForm(this.pmfu);
      const typeToField: Record<string, number | undefined> = {
        '1': this.pmfu.photos_site_nb,
        '2': this.pmfu.projet_acte_nb,
        '3': this.pmfu.decision_bureau_nb,
        '4': this.pmfu.note_bureau_nb,
      };

      const newFolders: Section[] = (this.doc_types || []).map((docType) => ({
        cd_type: Number(docType.cd_type),
        name: docType.libelle,
        numberElements: typeToField[String(docType.cd_type)] ?? 0,
      }));

      // sauvegarde locale utile pour debug + émission
      this.folders = newFolders;
      this.foldersSubject.next(newFolders);

      // forcer la détection (surtout si tu as des zones OnPush)
      setTimeout(() => this.cdr.detectChanges(), 0);

      console.log('setupPmfuForm terminé :', this.folders);
    } catch (error) {
      console.error('Erreur setupPmfuForm', error);
    }
  }

  trackByFolder(index: number, folder: any) {
    return folder.cd_type; // id de type unique
  }
  updateFolderCountsFromPmfu(pmfu: ProjetMfu) {
    const typeToField: Record<string, number | undefined> = {
      '1': pmfu.photos_site_nb,
      '2': pmfu.projet_acte_nb,
      '3': pmfu.decision_bureau_nb,
      '4': pmfu.note_bureau_nb,
    };

    // Récupérer les doc_type existants (this.doc_type doit être déjà initialisé)
    const newFolders: Section[] = (this.doc_types || []).map((docType) => ({
      cd_type: Number(docType.cd_type),
      name: docType.libelle,
      numberElements: typeToField[String(docType.cd_type)] ?? 0,
    }));

    // Mettre à jour la propriété locale (pratique pour debug) et émettre
    this.folders = newFolders;
    this.foldersSubject.next(newFolders);

    // forcer la vue si nécessaire
    this.cdr.detectChanges();
  }
  getGalerie(filePathList: string[]) {
    filePathList.forEach((path) => {
      filePathList.push(
        `http://localhost:3000/img?file=` + path + `&width=200`
      );
    });
    this.galerie = filePathList.slice(filePathList.length / 2, undefined);
    this.imagePathList = filePathList;
    console.log('imagePathList:', this.imagePathList);
  }
  openImage(imagePath: string) {
    const url = 'http://localhost:8887/' + imagePath;
    const dialogRef = this.dialog.open(ImagePmfuComponent, {
      data: {
        images: this.imagePathList?.slice(0, this.imagePathList.length / 2),
        selected: imagePath,
      }, // <---------------- données injectée au composant
      minWidth: '70vw',
      maxWidth: '95vw',
      height: '95vh',
      maxHeight: '95vh',
      hasBackdrop: true, // Avec fond
      backdropClass: 'custom-backdrop-gerer', // Personnalisation du fond
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });
  }
  deleteImage(imagePath: string) {
    console.log('imagePath:', imagePath.split('=')[1].split('&')[0]);
    this.docfileService.docfiles.forEach((docfile: any) => {
      if (
        docfile.doc_path.split('\\').pop() ===
        imagePath.split('=')[1].split('&')[0]
      ) {
        console.log('docfile:', docfile.doc_path);
        this.docfileService.deleteDocfile(docfile.doc_path).subscribe({
          next: (res) => {
            console.log('Suppression OK', res);
            this.setupPmfuForm().then(() => {
              this.updateFolderCountsFromPmfu(this.pmfu);
              this.docfileService
                .getDocfilesList(this.pmfu.pmfu_id as number, 1)
                .then(() => {
                  this.filePathList = this.docfileService.filePathList;
                  this.getGalerie(this.filePathList);
                });
            });
          },
          error: (err) => console.error('Erreur suppression', err),
        });
      }
    });
  }
  colors = [
    '#f5fff7',
    '#e0de12',
    '#c1d112',
    '#4b6426', // verts
    '#fec700',
    '#b44917',
    '#63340d', // oranges
    '#8cd2f5',
    '#089cd9',
    '#495fa9', // bleus
    '#f8f4ba',
    '#f4ee92',
    '#ebe01f', // jaunes
    '#d0a9cf',
    '#bb7bb3',
    '#430035', // violets
    '#f8baba',
    '#f4a2a2', // rouges
  ];

  // fonction hash simple pour générer un index stable
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit int
    }
    return Math.abs(hash);
  }
  getColorForImage(image: string): string {
    const index = this.hashString(image) % this.colors.length;
    return this.colors[index];
  }

  getTextColor(bg: string): string {
    const c = bg.substring(1); // enlève le "#"
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 150 ? '#000' : '#fff';
  }
}
