// Petit composant pour la gestion d'un formulaire des opérations d'un projet
// Reçoit l'id du projet pour obtenir la liste des opérations en bdd

// Les données du formulaire sont passées en entrée via @Input pour modifier
// Et Si on ne passe pas de données, on crée un nouveau formulaire vide 

import { Component, OnInit, ChangeDetectorRef, inject, signal, Input, Output, EventEmitter, OnDestroy, AfterViewInit, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FormButtonsComponent } from '../../../../../shared/form-buttons/form-buttons.component';

import { OperationLite, Operation } from './operations';
import { SelectValue } from '../../../../../shared/interfaces/formValues';
import { ProjetService } from '../../projets.service';
import { FormService } from '../../../../../services/form.service';
import { ApiResponse } from '../../../../../shared/interfaces/api';
import { Localisation } from '../../../../../shared/interfaces/localisation';

import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Importer MatSnackBar

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatIconModule } from '@angular/material/icon';
import { TooltipPosition, MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule, StepperOrientation } from '@angular/material/stepper';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';

import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { MatInputModule } from '@angular/material/input'; 
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatDatepickerIntl, MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import 'moment/locale/fr';

import { AsyncPipe } from '@angular/common';
import { catchError, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';

import { MapComponent } from '../../../../../map/map.component';

import { Subscription } from 'rxjs';
import { MatButton } from '@angular/material/button';

// Configuration des formats de date
export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-operation',
  standalone: true,
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'fr-FR'},

    // Moment can be provided globally to your app by adding `provideMomentDateAdapter`
    // to your app config. We provide it at the component level here, due to limitations
    // of our example generation script.
    provideMomentDateAdapter(),

    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: {displayDefaultIndicatorType: false},
    },
  ],
  imports: [
    CommonModule,
    FormButtonsComponent,
    MapComponent,
    MatSnackBarModule,
    MatSelectModule,
    MatIconModule,
    MatStepperModule,
    MatButton,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatSlideToggleModule,
    AsyncPipe  // Ajouté pour le spinner
  ],
  templateUrl: './operation.component.html',
  styleUrls: ['./operation.component.scss']
})
export class OperationComponent implements OnInit, OnDestroy {
  @Input() rattachementOperation?: string;
  @Input() geojson_site?: string;

  // @ViewChild('addEditOperation', { static: false }) addEditOperationTemplate: any;
  // @ViewChild('listOperations', { static: false }) listOperationsTemplate: any;
  @ViewChild('matTable') table!: MatTable<OperationLite>;
  @ViewChild('fileInput') fileInput!: ElementRef;

  private readonly _adapter = inject<DateAdapter<unknown, unknown>>(DateAdapter);
  private readonly _intl = inject(MatDatepickerIntl);
  private readonly _locale = signal(inject<unknown>(MAT_DATE_LOCALE));
  readonly dateFormatString = this._locale() === 'fr';

  isLoading: boolean = false;
  loadingDelay: number = 50;

  operations!: OperationLite[]; // Pour la liste des opérations : tableau material
  dataSourceOperations!: MatTableDataSource<Operation>;
  // Pour la liste des opérations : le tableau Material
  displayedColumnsOperations: string[] = ['code', 'titre', 'description', 'surf', 'date_debut'];
  operation!: Operation | void; // Pour les détails d'une opération

  // Listes de choix du formulaire
  typeObjectifOpe!: SelectValue[];
  selectedtypeObjectifOpe: string = '';
  
  // Listes de choix des types d'opération
  operationTypesFamilles!: SelectValue[];

  // Getter et setter
  private _selectedOperationFamille: string = '';
  get selectedOperationFamille(): string {
    return this._selectedOperationFamille;
  }
  set selectedOperationFamille(value: string) {
    this._selectedOperationFamille = value;
    this.selectedOperationType = ''; // Réinitialiser selectedOperationType

    // Vérifier si this.form est une instance de FormGroup et si le champ action_2 existe avant de le réinitialiser
    if (this.form instanceof FormGroup && this.form.get('action_2')) {
      this.form.get('action_2')!.reset('', { emitEvent: false }); // Réinitialiser sans émettre d'événement
    }
  }
  
  operationTypesMeca!: SelectValue[];
  operationTypesPat!: SelectValue[];
  operationTypesAme!: SelectValue[];
  operationTypesHydro!: SelectValue[];
  operationTypesDech!: SelectValue[];
  operationTypesSol!: SelectValue[];
  selectedOperationType: string = '';
  
  maitreOeuvreTypes!: SelectValue[];
  selectedMaitreOeuvreType: string = '';
  
  programmeTypes!: SelectValue[];
  selectedProgrammeType: string = '';

  onProgrammeChange(value: string): void {
    this.selectedProgrammeType = value;
    // console.log('Programme sélectionné :', this.selectedProgrammeType);
  }
  
  // Booleens d'états pour le mode d'affichage
  @Input() typeParent?: string; // Pour savoir si le parent est un projet ou un objectif
  @Input() isEditOperation: boolean = false;
  @Input() isAddOperation:boolean = false;
  @Output() isEditFromOperation = new EventEmitter<boolean>(); // Pour envoyer l'état de l'édition au parent
  @Output() isAddFromOperation = new EventEmitter<boolean>(); // Pour envoyer l'état de l'édition au parent
  @Input() projetEditMode: boolean = false; // Savoir si le projet est en edition pour masquer les boutons  
  linearMode: boolean = true;
  selectedOperation: String | undefined;
  
  // préparation des formulaires. Soit on crée un nouveau formulaire, soit on récupère un formulaire existant
  form: FormGroup;

  shapeForm?: FormGroup;

  @Input() ref_uuid_proj!: String; // ID du projet parent 
  @Input() ref_uuid_objectif!: String; // ID de l'objectif parent 
  initialFormValues!: FormGroup; // Propriété pour stocker les valeurs initiales du formulaire principal
  isFormValid: boolean = false;
  private formOpeSubscription: Subscription | null = null;

  stepperOrientation: Observable<StepperOrientation>;
  shapefileId: any; // Pour le formulaire de shapefile
  localisations?: Localisation[]; // Pour le formulaire de shapefile
  
  constructor(
    private cdr: ChangeDetectorRef,
    private formService: FormService,
    private fb: FormBuilder,
    private projetService: ProjetService,
    private snackBar: MatSnackBar, // Injecter MatSnackBar
    ) {
      // Sert pour le stepper
      const breakpointObserver = inject(BreakpointObserver);
      this.stepperOrientation = breakpointObserver.observe('(min-width: 800px)').pipe(map(({matches}) => (matches ? 'horizontal' : 'vertical')));
      
      // console.log("this.ref_uuid_proj venant du input :", this.ref_uuid_proj);
      this.form = fb.group({});

    }
  
  async ngOnInit() {
    // Remplir this.form soit vide soit avec les données passées en entrée
    // Attendre un certain temps avant de continuer
    // S'abonner aux changements du statut du formulaire principal (projetForm)
    
    console.log("Le composant operation s'initialise..........");  
    
    // Récuperer les listes de choix
    const subrouteTypeOpe = `sites/selectvalues=${'opegerer.typ_objectifope'}`;
    this.formService.getSelectValues$(subrouteTypeOpe).subscribe(
      (selectValues: SelectValue[] | undefined) => {
        console.log('Liste de choix typ_objectifope récupérée avec succès :');
        console.log(selectValues);
        this.typeObjectifOpe = selectValues || [];
      },
      (error) => {
        console.error('Erreur lors de la récupération de la liste de choix', error);
      }
    );
    const subrouteTypesOperationsFamilles = `sites/selectvalues=${'ope.actions'}/1`; // Appellé dans l'interface type d'opération mais puise dans la table 'ope.actions'
    this.formService.getSelectValues$(subrouteTypesOperationsFamilles).subscribe(
      (selectValues: SelectValue[] | undefined) => {
        console.log('Liste de choix types d\'opération 1 (ope.action) récupérée avec succès :');
        console.log(selectValues);
        this.operationTypesFamilles = selectValues || [];
      },
      (error) => {
        console.error('Erreur lors de la récupération de la liste de choix', error);
      }
    );

    const operationTypesMap: Record<string, keyof OperationComponent> = {
      meca: 'operationTypesMeca',
      pat: 'operationTypesPat',
      ame: 'operationTypesAme',
      hydro: 'operationTypesHydro',
      dech: 'operationTypesDech',
      //sol: 'operationTypesSol'
    };

    for (const [key, value] of Object.entries(operationTypesMap)) {
      const subrouteTypesOperations = `sites/selectvalues=${'ope.actions'}/${key}`;
      this.formService.getSelectValues$(subrouteTypesOperations).subscribe(
        (selectValues: SelectValue[] | undefined) => {
          console.log(`Liste de choix types d'opération (${key} dans la variable this.${value}) récupérée avec succès :`);
          console.log(selectValues);
          if (key == 'meca') {
          this.operationTypesMeca = selectValues || [];
          } else if (key == 'pat') {
          this.operationTypesPat = selectValues || [];
          } else if (key == 'ame') {
          this.operationTypesAme = selectValues || [];
          } else if (key == 'hydro') {
          this.operationTypesHydro = selectValues || [];
          } else if (key == 'dech') {
          this.operationTypesDech = selectValues || [];
          } else if (key == 'sol') {
          this.operationTypesSol = selectValues || [];
          }
        },
        (error) => {
          console.error(`Erreur lors de la récupération de la liste de choix (${key})`, error);
        }
      );
    }

    const subrouteProgramme = `sites/selectvalues=${'ope.listprogrammes'}`;
    this.formService.getSelectValues$(subrouteProgramme).subscribe(
      (selectValues: SelectValue[] | undefined) => {
        console.log('Liste de choix des codes programme récupérée avec succès :');
        console.log(selectValues);
        this.programmeTypes = selectValues || [];
      },
      (error) => {
        console.error('Erreur lors de la récupération de la liste de choix', error);
      }
    );

    const subrouteInterventions = `sites/selectvalues=${'ope.typ_interventions'}`;
    this.formService.getSelectValues$(subrouteInterventions).subscribe(
      (selectValues: SelectValue[] | undefined) => {
        console.log('Liste de choix actions récupérée avec succès :');
        console.log(selectValues);
        this.maitreOeuvreTypes = selectValues || [];
      },
      (error) => {
        console.error('Erreur lors de la récupération de la liste de choix', error);
      }
    );

    try {
      if (this.ref_uuid_proj !== undefined || this.ref_uuid_objectif !== undefined) {
        // Si on a bien une uuid de projet ou d'objectif pour recuperer les opérations lite
        
        setTimeout(async () => {
          // Accéder à la liste des opérations et remplir le tableau Material des operationLite
          this.fetch();
        }, this.loadingDelay);// Fin du bloc timeout
        this.isLoading = false;  // Le chargement est terminé
      } else {
        console.error('Le composant operation n\'a rien a faire au demarrage.');
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération des données du projet', error);
      this.isLoading = false;  // Même en cas d'erreur, arrêter le spinner
      this.cdr.detectChanges();
    }
  }

  // ngAfterViewInit() {
  //   // Forcer la détection des changements après l'initialisation de la vue
  //   this.cdr.detectChanges();
    
  //   console.log('ngAfterViewInit: table =', this.table);
  // }

  // ngAfterViewChecked() {
  //   // Fait déclencher cet evenement a chaque fois qu'il y a un changement dans la vue
  //   // Vérifier l'initialisation de la table après chaque changement de vue
  //   if (this.table) {
  //     console.log('ngAfterViewChecked: table =', this.table);
  //   } else {
  //     console.error('La table n\'a pas été trouvée.');
  //   }
  // }
  
  ngOnDestroy(): void {
    console.log('Destruction du composant operation');
    this.unsubForm();
  }

  // Désabonnement lors de la destruction du composant
  unsubForm(): void {
    if (this.formOpeSubscription) {
      this.formOpeSubscription.unsubscribe();
      console.log('On se désabonne.');
    }
    
  }

  subscribeToForm(): void {
    // Souscrire aux changements du statut du formulaire
    this.formOpeSubscription = this.form.statusChanges.subscribe(status => {
      this.isFormValid = this.form ? this.form.valid : false;  // Mettre à jour isFormValid en temps réel
      console.log('Statut du formulaire principal :', status);
      console.log("this.isFormValid = this.projetForm.valid :");
      console.log(this.isFormValid + " = " + this.form.valid);
      console.log("Etat de isFormValid passé à l'enfant:", this.isFormValid);
      
      // Afficher la liste des champs invalides
      console.log('Champs invalides :', this.getInvalidFields());

      this.cdr.detectChanges();  // Forcer la détection des changements dans le parent
    });
  }

  toggleEditOperation(mode: String): void {
    console.log("----------!!!!!!!!!!!!--------toggleEditOperation('" + mode +"') dans le composant operation");
    if (mode === 'edit') {
      this.isEditOperation = this.formService.simpleToggle(this.isEditOperation); // Changer le mode du booleen
      this.formService.toggleFormState(this.form, this.isEditOperation, this.initialFormValues); // Changer l'état du formulaire
      this.isEditFromOperation.emit(this.isEditOperation); // Envoyer l'état de l'édition de l'operation au parent
      
      console.log("isEditOperation apres toggleEditOperation('" + mode +"') :", this.isEditOperation);
    } else if (mode === 'add') {
      console.log('Appel de makeOperationForm() pour créer un nouveau formulaire vide');
      
      if (!this.isAddOperation) { // Création du formulaire on est pas en mode ajout
        this.makeForm({ empty: true });
      }

      this.isAddOperation = this.formService.simpleToggle(this.isAddOperation); // Changer le mode du booleen
      this.formService.toggleFormState(this.form, this.isAddOperation, this.initialFormValues); // Changer l'état du formulaire
      
      this.isAddFromOperation.emit(this.isAddOperation); // Envoyer l'état de l'édition de l'operation au parent
      
      console.log("isAddOperation apres toggleEditOperation('" + mode +"') :", this.isAddOperation);
      
    } else {
      this.form = this.initialFormValues; // Réinitialiser le formulaire aux valeurs initiales
      this.isEditOperation = false; // Sortir du mode édition
      this.isAddOperation = false; // Sortir du mode ajout
      this.isEditFromOperation.emit(this.isEditOperation); // Envoyer l'état de l'édition de l'operation au parent
      this.isAddFromOperation.emit(this.isAddOperation); // Envoyer l'état de l'édition de l'operation au parent
      console.log("On vient de sortir du mode édition / ajout d'opération.");
    }
    this.cdr.detectChanges(); // Forcer la détection des changements
    
  }

  getInvalidFields(): string[] {
    // Pour le stepper et le bouton MAJ
    if (this.form !== undefined) {
      return this.formService.getInvalidFields(this.form);
    } else {
      return [];
    }
  }

  // isStepCompleted(stepIndex: number): boolean {
  //   // Pour utiliser cette méthode dans le stepper
  //   // il faut que le stepper soit en mode linear
  //   // Fonctionn comme ceci dans le html :
  //   // <mat-step [stepControl]="form" [completed]="isStepCompleted(2)">
  //   switch (stepIndex) {
  //     case 1:
  //       return this.form.get('titre')?.valid || false;
  //     case 2:
  //       // return true || false;
  //       return true;
  //     case 3:
  //       return true;
  //     case 4:
  //       return this.form.get('typ_intervention')?.valid || false;

  //     default:
  //       return false;
  //   }
  // }

  async getLocalisation(uuid_ope: String): Promise<Localisation[]> {
    const subrouteLocalisation = `localisations/uuid=${uuid_ope}/operation`;
    try {
      return await this.projetService.getLocalisations(subrouteLocalisation);
    } catch (error) {
      console.error("Erreur lors de la récupération de la localisation de l'opération : ", error);
      return [];
    }
  }

  async fetch(uuid_ope?: String): Promise<Operation | void> {
    if (this.ref_uuid_proj !== undefined && uuid_ope == undefined) {
      // Si on a un uuid de projet passé en paramètre pour recuperer les opérations lite.
      console.log("----------!!!!!!!!!!!!--------fetch() dans le composant operation");
      const uuid = this.ref_uuid_proj;
      const subroute = `operations/uuid=${uuid}/lite`;
      this.projetService.getOperations(subroute).then(
        (operations) => {
          this.operations = operations;
          if (Array.isArray(this.operations) && this.operations.length > 0) {
            this.dataSourceOperations = new MatTableDataSource(this.operations);
            this.cdr.detectChanges();
            console.log('Liste des opérations bien mises à jour.');
          }
        }
      ).catch(
        (error) => {
          console.error('Erreur lors de la récupération des opérations', error);
        }
      );
    } else if (uuid_ope !== undefined) {
      // Si on un uuid d'opératon passé en paramètre pour en avoir les détails complets
      console.log("----------!!!!!!!!!!!!--------fetch(" + uuid_ope + ") dans le composant operation");
      const subroute = `operations/uuid=${uuid_ope}/full`;

      try {
        const operation = await this.projetService.getOperation(subroute);
        console.log('Opération avant le return de fetch() :', operation);

        // Pré remplir le sous formulaire d'envoi du shapefile
        this.shapeForm = this.formService.newShapeForm(operation.uuid_ope, 'polygon');

        // Récupérer les localisations de l'opération
        this.localisations = await this.getLocalisation(uuid_ope);

        // Attention il s'agit d'une liste de localisations !
        console.log('Localisation de l\'opération :');
        console.log(this.localisations);

        return operation;
      } catch (error) {
        console.error("Erreur lors de la récupération de l'opération : ", error);
      }
    } else {
      console.error("Aucun identifiant de projet ou d'opération n\'a été trouvé.");
    }
  }

  async makeForm({ operation, empty = false }: { operation?: OperationLite, empty?: boolean } = {}): Promise<void> {
    // Deux grands modes :
    // 1. Créer un nouveau formulaire vide si ne donne PAS une operation
    // 2. Créer un formulaire avec les données d'une opération

    if (this.projetEditMode){
      this.snackBar.open("Veuillez terminer l'édition du projet avant d''ouvrir une opération", 'Fermer', { 
        duration: 3000,});
        return;
    } else {
      this.snackBar.open("Nous rentrons dans la methode makeForm().", 'Fermer', { 
      duration: 3000,});
    }

    this.unsubForm(); // Se désabonner des changements du formulaire

    if (empty) {
      // Création d'un formulaire vide - Si empty est vrai
      try {
        this.form = this.formService.newOperationForm(undefined, this.ref_uuid_proj) as FormGroup;
        this.selectedtypeObjectifOpe = '';
        this.selectedOperationFamille = '';
        this.selectedOperationType = '';
        this.selectedOperation = '';
        this.selectedMaitreOeuvreType = '';
        this.subscribeToForm() // S'abonner aux changements du formulaire créé juste avant
      } catch (error) {
        console.error('Erreur lors de la création du formulaire', error);
        return;
      }
    
    } else if ( operation !== undefined ) {
      // On ouvre une opération existante
      // Chargement d'un formulaire avec une opération
      this.linearMode = false; // Passer en mode non linéaire du stepper
      
      console.log("OperationLite passée en paramètre dans makeForm :");
      console.log(operation);
      try {
        // Transformation d'une OperationLite en Operation
        await this.fetch(operation.uuid_ope).then((operation) => {
          if (operation) {
            this.operation = operation;
            this.selectedtypeObjectifOpe = operation.obj_ope || '';
            this.selectedOperationFamille = operation.action || '';
            this.selectedOperationType = operation.action_2 || '';
            this.selectedOperation = operation.action_2 || '';
            this.selectedMaitreOeuvreType = operation.typ_intervention || '';
          }
        });

        console.log("this.operation après fetch(operation.uuid_ope) :");
        console.log(this.operation);

        // Création du formulaire avec les données de l'opération
        if (this.operation !== undefined) {
          this.form = this.formService.newOperationForm(this.operation); // Remplir this.form avec notre this.operation
          console.log("Formulaire d'une operation existante initialisé :", this.form.value);

          this.subscribeToForm(); // S'abonner aux changements du formulaire créé juste avant
          this.initialFormValues = this.form.value; // Stocker les valeurs initiales du formulaire
        }

        this.toggleEditOperation("edit")
        
        console.log("this.form après la création du formulaire :");
        console.log(this.form);
      } catch (error) {
      console.error('Erreur lors de la création du formulaire', error);
      }
      } else {
        console.error('Paramètres operation et empty non definis.');
        return;
    }
  }

  // Méthode pour soumettre le formulaire
  onSubmit(mode?: String): void {
    // Logique de soumission du formulaire du projet
    if (this.form !== undefined) {

      // Déja, si le formulaire est valide
      if (this.form.valid) {
        console.log("----------!!!!!!!!!!!!--------onSubmit('" + mode + "') dans le composant operation");
        console.log(this.form.value);

        // Nouvelle opération
        if (this.isAddOperation === true){
          this.projetService.insertOperation(this.form.value).subscribe(
            (response: ApiResponse) => {
              console.log("Enregistrement de l'opération avec succès :", response);
              this.unsubForm(); // Se désabonner des changements du formulaire
              
              
              // Afficher le message dans le Snackbar
              const message = "Opération bien enregistrée"; // Message par défaut
              
              this.snackBar.open(message, 'Fermer', {
                duration: 3000,
                panelClass: ['snackbar-success']
              });

              // Mise a jout de la liste des opérations
              // Nécessaire puisque l'opération affichée est fermée alors le tableau doit être mis à jour
              this.fetch();
            },
            (error) => {
              console.error('Erreur lors de l\'enregistrement de l\'opération', error);
              this.snackBar.open('Erreur lors de l\'enregistrement de l\'opération', 'Fermer', {
                duration: 3000,
                panelClass: ['snackbar-error']
              });
            }
          );

          // Changer l'état dans ce composant et celui du parent
          this.isAddOperation = false; // Changer le mode du booleen
          this.isAddFromOperation.emit(this.isAddOperation);

        // Modification d'une opération
        } else if (this.isEditOperation === true) {
          console.log('Enregistrement de l\'opération en cours suite à demande de validation...');
          
          console.log('Formulaire juste avant le onUpdate :', this.form.value);
          const updateObservable = this.formService.putBdd('update', 'operations', this.form, this.isEditOperation, this.snackBar, this.form.value.uuid_ope, this.initialFormValues);
          // S'abonner à l'observable. onUpdate 

          if (updateObservable) {
            updateObservable.subscribe(
              (result) => {
                this.isEditOperation = result.isEditMode;
                this.isEditFromOperation.emit(this.isEditOperation);
                
                console.log('Formulaire mis à jour avec succès:', result.formValue);
                
                // Accéder à la liste des opérations et remplir le tableau Material des operationLite
                this.operation = undefined; // Réinitialiser l'opération

                // Mise a jout de la liste des opérations
                // Nécessaire puisque l'opération affichée est fermée alors le tableau doit être mis à jour
                this.fetch();
              },
              (error) => {
                console.error('Erreur lors de la mise à jour du formulaire', error);
              }
            );
          }

        } else if (mode === 'delete') {
          console.log(this.form.value);
        }
        
        
      } else {
        console.error('Le formulaire est invalide, veuillez le corriger.');
      }
    } else {
      console.error('Le formulaire est introuvable, veuillez le créer.');
    }
  }

  // Méthode pour gérer le téléchargement du fichier shapefile modèle
  onFileSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      this.shapeForm!.patchValue({
        shapefile: file
      });
    }
  }

  // Soumettre le shapefile au backend
  submitShapefile(): Observable<ApiResponse> {
    if (!this.shapeForm) {
      console.error('Formulaire de shapefile introuvable.');
      return of({ success: false, message: 'Formulaire de shapefile introuvable.' } as ApiResponse);
    }
  
    const formData = new FormData();
    const file: File = this.shapeForm.get('shapefile')?.value; // Changement de 'file' à 'shapefile'
    const typeGeometry: string = this.shapeForm.get('type_geometry')?.value;
    const uuid_ope: string = this.shapeForm.get('uuid_ope')?.value;
  
    // Debug logs
    console.log('Fichier sélectionné:', file);
    console.log('Type géométrie:', typeGeometry);
  
    // Vérification des données avant envoi
    if (!file || !typeGeometry) {
      return of({ 
        success: false, 
        message: 'Formulaire invalide. Fichier ou type de géométrie manquant.' 
      } as ApiResponse);
    }

    // Construction du FormData
    formData.append('file', file);
    formData.append('type_geometry', typeGeometry);
    formData.append('uuid_ope', uuid_ope);

    // Log du FormData
    formData.forEach((value, key) => {
      console.log(key + ': ' + value);
    });
  
    return this.projetService.uploadShapefile(formData).pipe(
      catchError(error => {
        console.error('Erreur lors de l\'envoi du shapefile:', error);
        return of({ 
          success: false, 
          message: 'Erreur lors de l\'envoi du shapefile' 
        } as ApiResponse);
      })
    );
  }

  // Méthode pour gérer la soumission du formulaire de shape
  handleShapefileSubmission(): void {

    if (!this.shapeForm?.get('type_geometry')?.value) {
      this.snackBar.open('Type de géométrie manquant', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (!this.shapeForm?.get('uuid_ope')?.value) {
      this.snackBar.open('uuid_ope manquant', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (!this.shapeForm?.get('shapefile')?.value) {
      this.snackBar.open('Fichier shapefile manquant', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.submitShapefile().subscribe({
      next: async (response: ApiResponse) => {
        if (response.success) {
          // Réinitialiser uniquement le champ shapefile
          this.shapeForm!.patchValue({
            shapefile: null
          });
        
          // Nettoyer l'input file
          if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
          }

          // Rafraîchir la liste des localisations
          this.localisations = await this.getLocalisation(this.shapeForm?.get('uuid_ope')?.value);

          // Message de succès
          this.snackBar.open('Shapefile importé avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        } else {
          this.snackBar.open(response.message || 'Erreur lors de l\'import', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        this.snackBar.open('Erreur lors de l\'import du shapefile', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // Méthode pour télécharger le fichier shapefile d'exemple
  downloadShapefileExample(): void {
    const link = document.createElement('a');
    link.href = 'assets/shapefile_polygone_modele.zip';
    link.download = 'shapefile_polygone_modele.zip';
    link.click();
  }

  // Pour supprimer une localisation ou une opération
  deleteItem(type: 'localisation' | 'operation'): void {
    if (type === 'localisation' && this.localisations && this.localisations.length > 0) {
      const localisationId = this.localisations[0].loc_id;
      this.projetService.deleteLocalisation(localisationId).subscribe(
        (response: ApiResponse) => {
          if (response.success) {
            this.localisations = undefined; // Réinitialiser les localisations après suppression
            this.callSnackDelete("normal", 'localisation', response);
          }
        },
        (error) => {
          this.callSnackDelete('error', 'localisation');
        }
      );
    } else if (type === 'operation' && this.operation) {
      const operationId = this.operation.uuid_ope;
      this.projetService.deleteOperation(operationId).subscribe(
        (response: ApiResponse) => {
          if (response.success) {
            console.log('Opération supprimée avec succès');
            this.operation = undefined; // Réinitialiser l'opération après suppression
            this.isEditOperation = false; // Sortir du mode édition
            this.snackBar.open('Opération supprimée avec succès', 'Fermer', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.fetch(); // Rafraîchir la liste des opérations
          } else {
            console.error('Erreur lors de la suppression de l\'opération', response.message);
            this.snackBar.open(response.message || 'Erreur lors de la suppression de l\'opération', 'Fermer', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        },
        (error) => {
          console.error('Erreur lors de la suppression de l\'opération', error);
          this.snackBar.open('Erreur lors de la suppression de l\'opération', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      );
    } else {
      console.error(`Aucun ${type} à supprimer`);
      this.snackBar.open(`Aucun ${type} à supprimer`, 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  // Utilisée à l'interieur de this.deleteItem() pour afficher un message de suppression
  callSnackDelete(mode: string, table: string, response?: ApiResponse): void {
    if(mode === 'normal' && response !== undefined) {
      if (response.success) {
        console.log(`${table.charAt(0).toUpperCase() + table.slice(1)} supprimée avec succès`);
        this.snackBar.open(`${table.charAt(0).toUpperCase() + table.slice(1)} supprimé avec succès`, 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      } else {
        console.error(`Erreur lors de la suppression. Type : ${table}`, response.message);
        this.snackBar.open(response.message || `Erreur lors de la suppression. Type : ${table}`, 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    } else if (mode === 'error') {
      console.error(`Erreur lors de la suppression. Type : ${table}`);
      this.snackBar.open(`Erreur lors de la suppression. Type : ${table}`, 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });

    }
  }
}