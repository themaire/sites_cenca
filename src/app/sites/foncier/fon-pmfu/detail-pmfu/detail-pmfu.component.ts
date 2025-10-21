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

import { ProjetMfu, ProjetsMfu, ParcellesSelected } from '../../foncier';
import { FoncierService } from '../../foncier.service';
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
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';

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


import { map } from 'rxjs/operators';
import { Observable, BehaviorSubject } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';

import { DocfileService } from '../../../../shared/services/docfile.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MapComponent } from '../../../../map/map.component';
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
    FormsModule,
    MatStepperModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatListModule,
    MapComponent,
  ],
  templateUrl: './detail-pmfu.component.html',
  styleUrl: './detail-pmfu.component.scss',
})
export class DetailPmfuComponent {
  /**
   * Zoom sur la parcelle sélectionnée en utilisant sa bbox
   */
  zoomToParcelle(parcelle: ParcellesSelected) {
    if (parcelle.bbox && this.mapComponent && typeof this.mapComponent.zoomToBbox === 'function') {
      this.mapComponent.zoomToBbox(parcelle.bbox);
    } else {
      this.snackBar.open('Impossible de zoomer : bbox non disponible.', 'Fermer', { duration: 2500 });
    }
  }

  ngAfterViewInit() {
    // Abonnement à l'EventEmitter de suppression de parcelle côté carte
    if (this.mapComponent && this.mapComponent.parcelleRemoved) {
      this.mapComponent.parcelleRemoved.subscribe((idu: string) => this.onParcelleRemoved(idu));
    }
  }
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
  salaries: SelectValue[] = [];
  private foldersSubject = new BehaviorSubject<Section[]>([]);
  allowedTypes: Record<string, string[]> = {};
  folders$ = this.foldersSubject.asObservable();
  @ViewChild(FileExploratorComponent) fileExplorator!: FileExploratorComponent;
  @ViewChild(MapComponent) mapComponent!: MapComponent;

  // Propriétés pour les sites CENCA
  afficherSitesCenca: boolean = false;
  afficherSitesCencaSites: boolean = false;

  // Parcelles selectionnées dans la carte
  // A chaque fois qu'une parcelle est selectionnée, cette liste est mise à jour en utilisant un emmeteur vers cette propriété ci-dessous
  parcellesSelected: ParcellesSelected[] = [];

  // Poubelle des parcelles supprimées
  trashParcelle: ParcellesSelected[] = [];
  // Historique pour undo/redo
  parcellesHistory: ParcellesSelected[][] = [];
  trashHistory: ParcellesSelected[][] = [];
  historyIndex: number = -1;

  onParcellesSelected(parcelles: ParcellesSelected[]) {
    // Tri par idu
    const sorted = [...parcelles].sort((a, b) => a.idu.localeCompare(b.idu));
    // Vérifier si la sélection a changé
    if (JSON.stringify(this.parcellesSelected) === JSON.stringify(sorted)) {
      return; // Ne rien faire si la sélection est identique
    }
    this.parcellesSelected = sorted;
    // Initialisation de l'historique uniquement à la première action
    if (this.historyIndex === -1) {
      this.parcellesHistory = [ [...this.parcellesSelected] ];
      this.trashHistory = [ [...this.trashParcelle] ];
      this.historyIndex = 0;
    } else {
      this.historyIndex++;
      this.parcellesHistory = this.parcellesHistory.slice(0, this.historyIndex);
      this.trashHistory = this.trashHistory.slice(0, this.historyIndex);
      this.parcellesHistory.push([...this.parcellesSelected]);
      this.trashHistory.push([...this.trashParcelle]);
    }
    // Synchroniser avec le formulaire si besoin :
    if (this.pmfuForm) {
      this.pmfuForm.patchValue({ pmfu_parc_list: this.parcellesSelected.map(p => p.idu) });
    }
    // Synchroniser la sélection sur la carte uniquement si elle a changé
    if (this.mapComponent && typeof this.mapComponent.setParcellesSelection === 'function') {
      this.mapComponent.setParcellesSelection(this.parcellesSelected);
    }

    // console.log('Parcelles sélectionnées mises à jour :', this.parcellesSelected);
    // console.log('Historique des parcelles :', this.parcellesHistory);
    // console.log('Index historique :', this.historyIndex);
    // console.log('Poubelle des parcelles :', this.trashParcelle);
    // console.log('Historique des suppressions :', this.trashHistory);
  }

// Supprimer une parcelle et l'ajouter à la poubelle
removeParcelle(parcelle: ParcellesSelected) {
  this.parcellesSelected = this.parcellesSelected.filter(p => p.idu !== parcelle.idu);
  this.trashParcelle = [...this.trashParcelle, parcelle];
  this.historyIndex++;
  this.parcellesHistory = this.parcellesHistory.slice(0, this.historyIndex);
  this.trashHistory = this.trashHistory.slice(0, this.historyIndex);
  this.parcellesHistory.push([...this.parcellesSelected]);
  this.trashHistory.push([...this.trashParcelle]);
  // Synchroniser avec le formulaire
  if (this.pmfuForm) {
    this.pmfuForm.patchValue({ pmfu_parc_list: this.parcellesSelected.map(p => p.idu) });
  }
  // Synchroniser la sélection sur la carte
  if (this.mapComponent && typeof this.mapComponent.setParcellesSelection === 'function') {
    this.mapComponent.setParcellesSelection(this.parcellesSelected);
  }
}

// Undo : restaurer la dernière parcelle supprimée
undoRemoveParcelle() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.parcellesSelected = [...this.parcellesHistory[this.historyIndex]];
      this.trashParcelle = [...this.trashHistory[this.historyIndex]];
      if (this.pmfuForm) {
        this.pmfuForm.patchValue({ pmfu_parc_list: this.parcellesSelected.map(p => p.idu) });
      }
      // Synchroniser la sélection sur la carte
      if (this.mapComponent && typeof this.mapComponent.setParcellesSelection === 'function') {
        this.mapComponent.setParcellesSelection(this.parcellesSelected);
      }
    }
  }

  // Redo : retirer à nouveau la dernière restaurée
  redoRemoveParcelle() {
    if (this.historyIndex < this.parcellesHistory.length - 1) {
      this.historyIndex++;
      this.parcellesSelected = [...this.parcellesHistory[this.historyIndex]];
      this.trashParcelle = [...this.trashHistory[this.historyIndex]];
      if (this.pmfuForm) {
        this.pmfuForm.patchValue({ pmfu_parc_list: this.parcellesSelected.map(p => p.idu) });
      }
      // Synchroniser la sélection sur la carte
      if (this.mapComponent && typeof this.mapComponent.setParcellesSelection === 'function') {
        this.mapComponent.setParcellesSelection(this.parcellesSelected);
      }
    }
  }

    // Synchronise la suppression d'une parcelle depuis la carte
  onParcelleRemoved(idu: string) {
    const removed = this.parcellesSelected.find(p => p.idu === idu);
    if (removed) {
      this.parcellesSelected = this.parcellesSelected.filter(p => p.idu !== idu);
      this.trashParcelle = [...this.trashParcelle, removed];
      this.historyIndex++;
      this.parcellesHistory = this.parcellesHistory.slice(0, this.historyIndex);
      this.trashHistory = this.trashHistory.slice(0, this.historyIndex);
      this.parcellesHistory.push([...this.parcellesSelected]);
      this.trashHistory.push([...this.trashParcelle]);
      // Synchroniser le formulaire
      if (this.pmfuForm) {
        this.pmfuForm.patchValue({ pmfu_parc_list: this.parcellesSelected.map(p => p.idu) });
      }
      // Synchroniser la carte
      if (this.mapComponent && typeof this.mapComponent.setParcellesSelection === 'function') {
        this.mapComponent.setParcellesSelection(this.parcellesSelected);
      }
    }
  }

  constructor(
    public docfileService: DocfileService,
    private confirmationService: ConfirmationService,
    public formService: FormService,
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

  async ngOnInit() {
    await this.docfileService.loadDocTypes(1);
    this.doc_types = this.docfileService.doc_types;
    this.initializeAllowedTypes();
    // Initialiser les valeurs du formulaire principal quand le composant a fini de s'initialiser
    const cd_salarie = this.loginService.user()?.cd_salarie || null; // Code salarié de l'utilisateur connecté

    // Récupérer les valeurs pour les selects
    // Récupérer les salariés pour créateur et responsable
    this.formService
      .getSelectValues$('sites/selectvalues=admin.salaries/')
      .subscribe((selectValues: SelectValue[] | undefined) => {
        this.salaries = selectValues || [];
        console.log('this.salaries : ');
        console.log(this.salaries);
      });

      
    // Récupérer les données d'un projet ou créer un nouveau projet
    // this.projetLite est assigné dans le constructeur et vient de data (fenetre de dialogue)
    if (this.projetLite?.pmfu_id) {
      // Quand un ID est passé en paramètre
      try {
        // Simuler un délai artificiel
        setTimeout(async () => {
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
            this.salaries = selectValues || [];
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

  /**
   * Gère la soumission du formulaire PMFU
   * Met à jour le formulaire, réinitialise les sélections de dossiers et de galerie
   * En mode édition, envoie une requête PUT pour mettre à jour un projet existant
   */
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

  private defaultExtensions: Record<string, string[]> = {
    doc: ['.pdf', '.doc', '.docx'],
    image: ['.jpg', '.jpeg', '.png'],
  };

  /** 
   * Initialise allowedTypes en fonction des doc_types
   * Par défaut, les types contenant "photo" ou "image" sont considérés comme des images
   * Les autres types sont considérés comme des documents
   * Utilise defaultExtensions pour définir les extensions autorisées
   * Résultat stocké dans allowedTypes
  */
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

  /**
   * Vérifie si le type de fichier est autorisé pour un champ donné
   * @param file Le fichier à vérifier
   * @param field Le nom du champ de formulaire
   * @return true si le type de fichier est autorisé, false sinon
   * Ajoute un message d'erreur dans fileErrors si le type n'est pas autorisé
   * Utilise allowedTypes pour déterminer les extensions autorisées
   */
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

  /**
   * Gère le dépôt de fichiers via le glisser-déposer
   * @param event L'événement de glisser-déposer
   * @param field Le nom du champ de formulaire associé au dépôt
   * Permet de déposer plusieurs fichiers à la fois
   * Vérifie le type de chaque fichier avant de l'ajouter au formulaire
   */
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

  /**
   * Supprime un fichier déposé du formulaire et de la liste des fichiers
   * @param fileToRemove Un tableau contenant le nom du fichier et le nom du contrôle associé
   * Exemple : ['nom_du_fichier.ext', 'nom_du_controle']
   */
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

  /**
   * Vérifie si au moins un fichier est présent dans le formulaire des documents
   * Met à jour la propriété hasFiles du service DocfileService
   * Affiche dans la console les valeurs actuelles du formulaire et le résultat de la vérification
   */
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

  /**
   * Confirme et supprime un projet MFU
   * Utilise le service ConfirmationService pour afficher une boîte de dialogue de confirmation
   * Si l'utilisateur confirme, appelle le service FoncierService pour supprimer le projet MFU
   * Ferme la boîte de dialogue actuelle si la suppression réussit
   */
  deletePmfuConfirm(): void {
    const message = `Voulez-vous vraiment supprimer ce projet MFU?\n<strong>Cette action est irréversible.</strong>`;

    // Appel de la boîte de dialogue de confirmation
    this.confirmationService
      .confirm('Confirmation de suppression', message, 'delete')
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

  /**
   * Configure le formulaire PMFU en récupérant les données du projet et en initialisant les formulaires
   * Met à jour le titre, le formulaire principal et le formulaire des documents
   * Initialise les dossiers de documents basés sur les types de documents disponibles
   * Utilise la détection des changements pour mettre à jour l'affichage
   * Gère les erreurs potentielles lors de la récupération des données
   */
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

  /**
   * Active/désactive l'affichage des sites CENCA dynamiques
   */
  toggleSitesCenca(): void {
    console.log(`🌿 Sites CENCA dynamiques: ${this.afficherSitesCenca ? 'ACTIVÉS' : 'DÉSACTIVÉS'}`);
    
    // Communiquer avec la carte pour activer/désactiver le chargement dynamique
    if (this.mapComponent) {
      // Synchroniser avec le layer control
      this.mapComponent.synchronizeSitesCencaLayer(this.afficherSitesCenca);
      
      if (this.afficherSitesCenca) {
        console.log('✅ Les sites CENCA vont se charger automatiquement quand vous bougez la carte !');
        // Forcer un premier chargement
        setTimeout(() => {
          this.mapComponent.reloadSitesInCurrentView();
        }, 500);
      } else {
        console.log('❌ Chargement dynamique des sites CENCA désactivé');
      }
    } else {
      console.warn('⚠️ Composant carte non trouvé');
    }
  }

  /**
   * Active/désactive l'affichage des sites CENCA Sites (couche verte)
   */
  toggleSitesCencaSites(): void {
    console.log(`🟢 Sites CENCA Sites: ${this.afficherSitesCencaSites ? 'ACTIVÉS' : 'DÉSACTIVÉS'}`);
    
    // Communiquer avec la carte pour activer/désactiver le chargement dynamique
    if (this.mapComponent) {
      // Synchroniser avec le layer control
      this.mapComponent.synchronizeSitesCencaSitesLayer(this.afficherSitesCencaSites);
      
      if (this.afficherSitesCencaSites) {
        console.log('✅ Les sites CENCA Sites vont se charger automatiquement (couche verte) !');
        // Forcer un premier chargement
        setTimeout(() => {
          this.mapComponent.reloadSitesSitesInCurrentView();
        }, 500);
      } else {
        console.log('❌ Chargement dynamique des sites CENCA Sites désactivé');
      }
    } else {
      console.warn('⚠️ Composant carte non trouvé');
    }
  }

  /**
   * Gestionnaire pour la synchronisation des Sites CENCA depuis le layer control
   */
  onSitesCencaToggled(active: boolean): void {
    console.log(`🔄 Synchronisation des Sites CENCA depuis layer control: ${active}`);
    this.afficherSitesCenca = active;
  }

  /**
   * Gestionnaire pour la synchronisation des Sites CENCA Sites depuis le layer control
   */
  onSitesCencaSitesToggled(active: boolean): void {
    console.log(`🔄 Synchronisation des Sites CENCA Sites depuis layer control: ${active}`);
    this.afficherSitesCencaSites = active;
  }

  /**
   * Gestionnaire pour la synchronisation des Parcelles depuis le layer control
   */
  onParcellesToggled(active: boolean): void {
    console.log(`🗺️ Synchronisation des Parcelles Cadastrales depuis layer control: ${active}`);
    // Note: Les parcelles sont activées par défaut avec [chargerParcellesDynamiquement]="true"
    // Cette méthode permet de détecter les changements depuis le layer control
  }
}
