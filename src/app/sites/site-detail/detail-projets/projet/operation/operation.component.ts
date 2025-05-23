// Petit composant pour la gestion d'un formulaire des opérations d'un projet
// Reçoit l'id du projet pour obtenir la liste des opérations en bdd

// Les données du formulaire sont passées en entrée via @Input pour modifier
// Et Si on ne passe pas de données, on crée un nouveau formulaire vide 

import { Component, OnInit, ChangeDetectorRef, inject, signal, Input, Output, EventEmitter, OnDestroy, AfterViewInit, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, FormArray } from '@angular/forms';

import { FormButtonsComponent } from '../../../../../shared/form-buttons/form-buttons.component';

import { OperationLite, Operation, OperationCheckbox } from './operations';
import { SelectValue } from '../../../../../shared/interfaces/formValues';

import { ProjetService } from '../../projets.service';
import { FormService } from '../../../../../services/form.service';
import { ConfirmationService } from '../../../../../services/confirmation.service';

import { ApiResponse } from '../../../../../shared/interfaces/api';
import { Localisation } from '../../../../../shared/interfaces/localisation';

import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Importer MatSnackBar

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TooltipPosition, MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule, StepperOrientation } from '@angular/material/stepper';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';

import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { MatInputModule } from '@angular/material/input'; 
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatDatepickerIntl, MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';

import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import 'moment/locale/fr';

// import { AsyncPipe } from '@angular/common';
import { catchError, map } from 'rxjs/operators';
import { Observable, of, zip } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';

import { MapComponent } from '../../../../../map/map.component';

import { v4 as uuidv4 } from 'uuid';

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
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },

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
    ReactiveFormsModule,
    FormButtonsComponent,
    MapComponent,
    MatSnackBarModule,
    MatSelectModule,
    MatIconModule,
    MatCheckboxModule,
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

  // Pour le formulaire d'édition d'une opération
  // Stoque l'ancienne valeur de l'action 1 et 2
  previousActionValue: string | null = null;
  previousAction2Value: string | null = null;

  // Listes de choix du formulaire
  typeObjectifOpe!: SelectValue[];
  selectedtypeObjectifOpe: string = '';
  
  // Listes de choix des types d'opération
  operationTypesFamilles!: SelectValue[];

  // Getter et setter pour selectedOperationFamille
  private _selectedOperationFamille: string = '';
  get selectedOperationFamille(): string {
    return this._selectedOperationFamille;
  }
  set selectedOperationFamille(value: string) {
    // Ne rien faire si la valeur n'a pas changé
    if (this._selectedOperationFamille === value || this.isLoading) {
      return;
    }

    // Mettre à jour la valeur interne
    this._selectedOperationFamille = value;

    // Réinitialiser selectedOperationType
    this.selectedOperationType = '';

    // Réinitialiser le champ action_2 du formulaire si nécessaire
    if (this.step1Form && this.step1Form.get('action_2')) {
      this.step1Form.get('action_2')!.reset('', { emitEvent: false });
      console.log('Le champ action_2 du formulaire a été réinitialisé.');
    } else {
      console.warn('Le champ action_2 est introuvable ou le formulaire n\'est pas initialisé.');
    }
  }
  
  operationTypesMeca!: SelectValue[];
  operationTypesPat!: SelectValue[];
  operationTypesAme!: SelectValue[];
  operationTypesHydro!: SelectValue[];
  operationTypesDech!: SelectValue[];
  // operationTypesSol!: SelectValue[];
  selectedOperationType: string = '';
  
  maitreOeuvreTypes!: SelectValue[];
  selectedMaitreOeuvreType: string = '';
  
  programmeTypes!: SelectValue[];
  selectedProgrammeType: string = '';
  
  cadreInterventionTypes!: SelectValue[];
  // selectedCadreInterventionType: string = '';
  // Getter et setter pour selectedOperationFamille
  selectedCadreInterventionType!: number;
  
  chantierNatureTypes!: SelectValue[];
  unitesTypes!: SelectValue[];

  // Pour les cases à cocher (multiple choix) dans le step Information de l'opération du formulaire d'édition d'une opération
  liste_ope_programmes!: OperationCheckbox[];
  liste_ope_animaux_paturage!: OperationCheckbox[];

  // Encore utilisé?
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

  get step1Form(): FormGroup {
  return this.form.get('step1') as FormGroup;
  }

  get step2Form(): FormGroup {
  return this.form.get('step2') as FormGroup;
  }

  get step3Form(): FormGroup {
  return this.form.get('step3') as FormGroup;
  }

  get step4Form(): FormGroup {
  return this.form.get('step4') as FormGroup;
  }

  get step5Form(): FormGroup {
  return this.form.get('step5') as FormGroup;
  }

  shapeForm?: FormGroup;

  @Input() ref_uuid_proj!: String; // ID du projet parent 
  @Input() ref_uuid_objectif!: String; // ID de l'objectif parent 
  initialFormValues!: FormGroup; // Propriété pour stocker les valeurs initiales du formulaire principal
  isFormValid: boolean = false;
  private formOpeSubscription: Subscription | null = null;

  stepperOrientation: Observable<StepperOrientation>;
  shapefileId: any; // Pour le formulaire de shapefile
  localisations?: Localisation[]; // Pour le formulaire de shapefile
  isComponentInitialized: boolean = false; // Indicateur pour savoir si le composant est complètement initialisé
  
  constructor(
    private cdr: ChangeDetectorRef,
    private formService: FormService,
    private confirmationService: ConfirmationService,
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

  public getFamilleLibelle(cd_type: string, liste: SelectValue[]): string {
    // Récupérer le libellé de la famille d'opération à partir de cd_type
    const selectValue = this.projetService.getLibelleByCdType(cd_type, liste);
    return selectValue ? selectValue : '';
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
          } 
          // else if (key == 'sol') {
          // this.operationTypesSol = selectValues || [];
          // }
        },
        (error) => {
          console.error(`Erreur lors de la récupération de la liste de choix (${key})`, error);
        }
      );
    }

    const subrouteMaitreOeuvre = `sites/selectvalues=${'ope.typ_interventions'}`;
    this.formService.getSelectValues$(subrouteMaitreOeuvre).subscribe(
      (selectValues: SelectValue[] | undefined) => {
        console.log('Liste de choix actions récupérée avec succès :');
        console.log(selectValues);
        this.maitreOeuvreTypes = selectValues || [];
      },
      (error) => {
        console.error('Erreur lors de la récupération de la liste de choix', error);
      }
    );

    const subrouteCadreInterventions = `sites/selectvalues=${'opegerer.libelles'}/cadre_intervention`;
    this.formService.getSelectValues$(subrouteCadreInterventions).subscribe(
      (selectValues: SelectValue[] | undefined) => {
        console.log("Liste de choix des cadres d'intervention récupérée avec succès :");
        console.log(selectValues);
        this.cadreInterventionTypes = selectValues || [];
      },
      (error) => {
        console.error('Erreur lors de la récupération de la liste de choix', error);
      }
    );

    const subrouteChantierNature = `sites/selectvalues=${'opegerer.libelles'}/chantier_nature`;
    this.formService.getSelectValues$(subrouteChantierNature).subscribe(
      (selectValues: SelectValue[] | undefined) => {
        console.log("Liste de choix des chantiers nature récupérée avec succès :");
        console.log(selectValues);
        this.chantierNatureTypes = selectValues || [];
      },
      (error) => {
        console.error('Erreur lors de la récupération de la liste de choix', error);
      }
    );

    const subrouteUnites = `sites/selectvalues=${'opegerer.libelles'}/unites`;
    this.formService.getSelectValues$(subrouteUnites).subscribe(
      (selectValues: SelectValue[] | undefined) => {
        console.log("Liste de choix des unités récupérée avec succès :");
        console.log(selectValues);
        this.unitesTypes = selectValues || [];
      },
      (error) => {
        console.error('Erreur lors de la récupération de la liste de choix', error);
      }
    );

    // On récupère les listes pour les toutes cases à cocher (programmes et animaux) possibles d'un thème
    // Ces variables sont utilisées dans this.fetch()
    const subrouteOperationProgrammeListe = `ope-programmes/uuid=`;
    this.liste_ope_programmes = await this.projetService.getOperationProgrammes(subrouteOperationProgrammeListe);
    const subrouteOperationAnimauxListe = `ope-animaux/uuid=`; // Pas de UUID donc on recuperer tous les animaux
    this.liste_ope_animaux_paturage = await this.projetService.getOperationAnimaux(subrouteOperationAnimauxListe);
    console.log('Liste des programmes possibles :', this.liste_ope_programmes);
    console.log('Liste des animaux possibles :', this.liste_ope_animaux_paturage);


    try {
      if (this.ref_uuid_proj !== undefined || this.ref_uuid_objectif !== undefined) {
        // Si on a bien une uuid de projet ou d'objectif pour recuperer les opérations lite
        
        setTimeout(async () => {
          // Accéder à la liste des opérations lite et remplir le tableau Material des operationLite
          this.fetch();
          
          console.log('Le composant est maintenant complètement initialisé.');

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

  /**
   * Méthode pour récupérer les opérations d'un projet
   * @param uuid_ope - OPTIONNEL - UUID de l'opération à récupérer
   * @returns L'opération complète ou une liste d'opérations lite
   */
  async fetch(uuid_ope?: String): Promise<Operation | void> {
    if (this.ref_uuid_proj !== undefined && uuid_ope == undefined) {
      // Si on a un uuid de projet passé en paramètre pour recuperer les opérations lite.
      console.log("----------!!!!!!!!!!!!--------fetch() dans le composant operation");
      const uuid = this.ref_uuid_proj;
      const subroute = `operations/uuid=${uuid}/lite`;
      this.projetService.getOperations(subroute).then(
        (operations) => {

          this.operations = operations; // Les operations lite sont de type OperationLite[]

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
      
      const subrouteOperationProgramme = `ope-programmes/uuid=${uuid_ope}`;
      const subrouteOperationAnimaux = `ope-animaux/uuid=${uuid_ope}`;

      try {
        let operation = await this.projetService.getOperation(subroute);
        // console.log('Opération avant le return de fetch() :', operation);

        // CASES A COCHER (MULTIPLE CHOIX) POUR LES PROGRAMMES
        // On récupère les eventuels programmes associés à l'opération
        const ope_programmes = await this.projetService.getOperationProgrammes(subrouteOperationProgramme);
        // console.log('Programmes associés à l\'opération :', ope_programmes);

        // CASES A COCHER (MULTIPLE CHOIX) POUR LES ANIMAUX
        // On récupère les eventuels animaux associés à l'opération depuis la base de données
        const ope_animal_paturage = await this.projetService.getOperationAnimaux(subrouteOperationAnimaux);
        // console.log('Programmes associés à l\'opération :', ope_animal_paturage);

        // Ajouter les programmes et les animaux à l'objet operation
        operation = {
          ...operation,
          ope_programmes: ope_programmes,
          liste_ope_programmes: this.liste_ope_programmes,
        };
        operation = {
          ...operation,
          ope_animal_paturage: ope_animal_paturage,
          liste_ope_animaux_paturage: this.liste_ope_animaux_paturage,
        };

        if (operation.liste_ope_programmes && operation.ope_programmes) {
          // console.log('Avant mise à jour des cases :', operation.liste_ope_programmes);
        
          operation.liste_ope_programmes = operation.liste_ope_programmes.map(programme => ({
            ...programme,
            checked: operation.ope_programmes?.some(ope => ope.lib_id === programme.lib_id) || false,
          }));
        
          // console.log('Après mise à jour des cases :', operation.liste_ope_programmes);
        }

        if (operation.liste_ope_animaux_paturage && operation.ope_animal_paturage) {
          // console.log('Avant mise à jour des cases :', operation.liste_ope_animaux_paturage);
        
          operation.liste_ope_animaux_paturage = operation.liste_ope_animaux_paturage.map(animal => ({
            ...animal,
            checked: operation.ope_animal_paturage?.some(ope => ope.lib_id === animal.lib_id) || false,
          }));
        
          // console.log('Après mise à jour des cases :', operation.liste_ope_animaux_paturage);
        }

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
    // C'est a dire que l'on va surveiller les changements du formulaire
    // A chaque fois qu'il y a un changement, ces lignes de code seront exécutées
    this.formOpeSubscription = this.form.statusChanges.subscribe(status => {
      this.isFormValid = this.form ? this.form.valid : false;  // Mettre à jour isFormValid en temps réel
      //console.log('Statut du formulaire principal :', status);
      //console.log("this.isFormValid = this.projetForm.valid :");
      //console.log(this.isFormValid + " = " + this.form.valid);
      //console.log("Etat de isFormValid passé à l'enfant:", this.isFormValid);
      // Afficher la liste des champs invalides
      // console.log('Champs invalides :', this.getInvalidFields());

      console.log('Ancienne valeur de action :', this.previousActionValue);
      // console.log('Ancienne valeur de action :', this.getLibelleByCdType(this.previousActionValue, this.operationTypesFamilles));
      console.log('Ancienne valeur de action2 :', this.previousAction2Value);
      // console.log('Ancienne valeur de action2 :', this.getLibelleByCdType(this.previousAction2Value, this.operationTypesMeca, this.operationTypesPat, this.operationTypesAme, this.operationTypesHydro, this.operationTypesDech));
      console.log('Données du formulaire principal :', this.form.value);

      this.cdr.detectChanges();  // Forcer la détection des changements dans le parent
    });
  }

  getInvalidFields(): string[] {
    // Pour le stepper et le bouton MAJ
    if (this.form !== undefined) {
      return this.formService.getInvalidFields(this.form);
    } else {
      return [];
    }
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
      if (this.initialFormValues && this.form) {
        this.form.reset(this.initialFormValues);
      }
      this.isEditOperation = false;
      this.isAddOperation = false;
      this.isEditFromOperation.emit(this.isEditOperation);
      this.isAddFromOperation.emit(this.isAddOperation);
      console.log("On vient de sortir du mode édition / ajout d'opération.");
    }
    this.cdr.detectChanges(); // Forcer la détection des changements
    
  }

  /**
   * Méthode pour récupérer la localisations d'une opération
   * @param uuid_ope - UUID de l'opération
   * @returns Un tableau de localisations associées à l'opération à donner au composant de carte
   */
  async getLocalisation(uuid_ope: String): Promise<Localisation[]> {
    const subrouteLocalisation = `localisations/uuid=${uuid_ope}/operation`;
    try {
      return await this.projetService.getLocalisations(subrouteLocalisation);
    } catch (error) {
      console.error("Erreur lors de la récupération de la localisation de l'opération : ", error);
      return [];
    }
  }

  /**
   * Est appelée pour créer un formulaire d'opération
   * C'est a dire dans la methode toggleEditOperation()
   * @param operation - L'opération à ouvrir (si elle existe) (optionnel)
   * @param empty - Si true, crée un formulaire vide (optionnel)
   * @returns Un formulaire d'opération
   */
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
        // Création d'un objet Operation "neuf" avec les listes fixes
        const newOperation: Operation = {
          uuid_ope: uuidv4(), // remplir avec un UUID aléatoire car cette propriété est obligatoire dans la definition de l'objet Operation
          ref_uuid_proj: this.ref_uuid_proj as string,
          liste_ope_programmes: this.liste_ope_programmes,
          liste_ope_animaux_paturage: this.liste_ope_animaux_paturage,
          // Ajoutez ici les autres propriétés requises de Operation avec des valeurs par défaut si besoin
        } as Operation;
        this.form = this.formService.newOperationForm(newOperation, this.ref_uuid_proj) as FormGroup;
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
          this.previousActionValue = this.step1Form.get('action')?.value || '';
          console.log('Valeur initiale de action :', this.previousActionValue);
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

    if (this.form !== undefined) {
      // Si le formulaire a été créé avec succès
      this.step1Form.get('action')?.valueChanges.subscribe((newValue) => {
        this.onFieldChange(newValue, 'action', this.previousActionValue);
        this.previousActionValue = newValue; // Met à jour l'ancienne valeur
        console.log('Vient de changer la nouvelle valeur devient l ancienne :', newValue, "donc this.previousActionValue = ", this.previousActionValue);
      });
      this.step1Form.get('action_2')?.valueChanges.subscribe((newValue) => {
        this.onFieldChange(newValue, 'action_2', this.previousAction2Value);
        this.previousAction2Value = newValue; // Met à jour l'ancienne valeur
        console.log('Action_2 vient de changer la nouvelle valeur devient l ancienne;:', newValue, "donc this.previousAction2Value = ", this.previousAction2Value);
      });

      // Test si this.step1Form existe et est rempli
      if (this.step1Form) {
        console.log('Formulaire d\'opération créé avec succès :', this.step1Form.value);
        this.isComponentInitialized = true; // Indiquer que le composant est complètement initialisé
      } else {
        console.error('Le formulaire d\'opération n\'a pas été créé correctement.');
      }
    }
  }

  /**
   * Gère la soumission du formulaire pour une opération.
   *
   * @param mode - (Optionnel) Mode de soumission, peut être utilisé pour spécifier une action particulière comme 'delete'.
   *
   * Logique :
   * - Vérifie si le formulaire existe et est valide.
   * - Si le formulaire est valide :
   *   - Formate les dates avant l'envoi au backend si elles ont été modifiées.
   *   - Si une nouvelle opération est ajoutée :
   *     - Enregistre l'opération via le service `projetService`.
   *     - Affiche un message de succès ou d'erreur dans un Snackbar.
   *     - Met à jour la liste des opérations.
   *   - Si une opération existante est modifiée :
   *     - Met à jour l'opération via le service `formService`.
   *     - Synchronise les programmes associés.
   *     - Met à jour la liste des opérations.
   *   - Si le mode est 'delete', affiche les valeurs du formulaire dans la console.
   * - Si le formulaire est invalide ou introuvable, affiche un message d'erreur dans la console.
   */
  onSubmit(mode?: String): void {
    // Logique de soumission du formulaire du projet
    if (this.form !== undefined) {

      // Déja, si le formulaire est valide
      if (this.form.valid) {
        console.log("----------!!!!!!!!!!!!--------onSubmit('" + mode + "') dans le composant operation");
        console.log(this.form.value);

        // Formater les dates avant l'envoi au backend        
        if (
          this.formService.isDateModified(this.step4Form, 'date_debut', this.operation?.date_debut) ||
          this.formService.isDateModified(this.step4Form, 'date_fin', this.operation?.date_fin)
        ) {
          console.log("Une des 3 dates à été modifiée par l'utilisateur.");
          this.step4Form.patchValue({
            date_debut: this.formService.formatDateToPostgres(this.step4Form.get('date_debut')?.value),
            date_fin: this.formService.formatDateToPostgres(this.step4Form.get('date_fin')?.value),
          });
          console.log("Formulaire patché avec les bonnes dates: ", this.form.value);
        }
        

        // Nouvelle opération
        if (this.isAddOperation === true){
          console.log('Ajout de l\'opération en cours...');
          console.log('Formulaire juste avant le insert :', this.form.value);
          const updateObservable = this.formService.putBdd('insert', 'operations', this.form, this.isEditOperation, this.snackBar);
          
          // S'abonner à l'observable updateObservable 
          if (updateObservable) {
            updateObservable.subscribe(
              (result) => {
                this.isEditOperation = result.isEditMode;
                this.isEditFromOperation.emit(this.isEditOperation);
                
                console.log('Opération ajoutés avec succès:', result.formValue);

                // Synchroniser les cases à cocher après l'ajout
                this.syncCheckboxs();
                
                // Accéder à la liste des opérations et remplir le tableau Material des operationLite
                this.operation = undefined; // Réinitialiser l'opération

                // Mise a jout de la liste des opérations (liste liste - tableau "material table")
                // Nécessaire puisque l'opération affichée est fermée alors le tableau doit être mis à jour
                this.fetch();
              },
              (error) => {
                console.error('Erreur lors de l\'enregistrement du formulaire', error);
              }
            );
          }

          // Changer l'état dans ce composant et celui du parent
          this.isAddOperation = false; // Changer le mode du booleen
          this.isAddFromOperation.emit(this.isAddOperation);

        // Modification d'une opération
        } else if (this.isEditOperation === true) {
          console.log('Enregistrement de l\'opération en cours...');
          console.log('Formulaire juste avant le update :', this.form.value);
          const updateObservable = this.formService.putBdd('update', 'operations', this.form, this.isEditOperation, this.snackBar, this.form.value.uuid_ope, this.initialFormValues);
          
          // S'abonner à l'observable updateObservable 
          if (updateObservable) {
            updateObservable.subscribe(
              (result) => {
                this.isEditOperation = result.isEditMode;
                this.isEditFromOperation.emit(this.isEditOperation);
                
                console.log('Formulaire mis à jour avec succès:', result.formValue);

                // Synchroniser les cases à cocher après la mise à jour
                this.syncCheckboxs();
                
                // Accéder à la liste des opérations et remplir le tableau Material des operationLite
                this.operation = undefined; // Réinitialiser l'opération

                // Mise a jout de la liste des opérations (liste liste - tableau "material table")
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
  /**
   * Lance le téléchargement d'un exemple de fichier shapefile en créant un élément
   * d'ancrage temporaire, en définissant son `href` sur le chemin du shapefile,
   * et en déclenchant un événement de clic.
   * Le fichier téléchargé sera nommé `shapefile_polygone_modele.zip`.
   *
   * @remarks
   * Cette méthode utilise l'API `document.createElement` pour créer dynamiquement
   * un élément d'ancrage et déclencher un téléchargement programmatique. Assurez-vous
   * que le chemin du fichier `'assets/shapefile_polygone_modele.zip'` est correct
   * et accessible dans votre projet.
  */
 downloadShapefileExample(): void {
   const link = document.createElement('a');
   link.href = 'assets/shapefile_polygone_modele.zip';
   link.download = 'shapefile_polygone_modele.zip';
   link.click();
  }

/**
 * Configuration de la boîte de dialogue de confirmation pour la suppression
 * d'une opération ou d'une localisation.
 */
dialogConfig = {
  // minWidth: '20vw',
  // maxWidth: '95vw',
  width: '580px',
  height: '220px',
  // maxHeight: '90vh',
  hasBackdrop: true, // Activer le fond
  backdropClass: 'custom-backdrop-delete', // Classe personnalisé
  enterAnimationDuration: '300ms',
  exitAnimationDuration: '300ms'
};

/**
 * Affiche une boîte de dialogue de confirmation pour la suppression d'une opération ou d'une localisation.
 * Récupère le libellé de l'opération à partir du formulaire, puis ouvre une boîte de dialogue
 * demandant à l'utilisateur de confirmer la suppression. Si l'utilisateur confirme,
 * la méthode `deleteItem` contenue dans projetService.ts est appelée pour supprimer l'élément.
 *
 * @remarks
 * Cette action est irréversible. La boîte de dialogue utilise un fond personnalisé
 * et des animations d'entrée/sortie.
 */
  deleteItemConfirm(type: 'localisation' | 'operation'): void {
    const ope2delete = this.operation;
    const loca2delete = this.localisations?.[0];
    
    // Fabriquer le libellé de l'opération
    let libelle = '';
    if (type == 'operation') {
      if (this.step1Form.get('action_2') !== undefined) {
        const value = this.step1Form.get('action_2')?.value;
        libelle = "opération de type " + this.projetService.getLibelleByCdType(
          value,
          this.operationTypesMeca,
          this.operationTypesPat,
          this.operationTypesAme,
          this.operationTypesHydro,
          this.operationTypesDech
        ) || "";
      }
    } else if (type == 'localisation') {
      if (this.localisations && this.localisations.length > 0) {
        libelle = type;
      }
    }

    const message = `Voulez-vous vraiment supprimer cette ${libelle}?\n<strong>Cette action est irréversible.</strong>`
    
    // Appel de la boîte de dialogue de confirmation
    this.confirmationService.confirm('Confirmation de suppression', message, this.dialogConfig).subscribe(result => {
    if (result) {
      // L'utilisateur a confirmé la suppression
      // Utiliser le service projetService pour supprimer l'élément
      this.projetService.deleteItem(type, ope2delete, loca2delete).subscribe(success => {
        if (success) {
          // success === true ici si la suppression a réussi
          if (type == 'operation') {
            this.operation = undefined; // Réinitialiser l'opération après suppression
            this.isEditOperation = false; // Sortir du mode édition
            this.fetch(); // Rafraîchir la liste des opérations
          }
          if (type == 'localisation') {
            this.localisations = undefined; // Réinitialiser les localisations après suppression
          }
        } else {
          // success === false ici si la suppression a échoué
          // On ne fait rien le service a déjà géré l'erreur en affichant un message snackbar d'erreur
        }
      });;
    }
  });

  }



  /**
   * Détecte le changement de la valeur du champ `action_2` (Type opération 2)
   * et de `cadre_intervention_detail` dans le formulaire.
   * 
   * @param newValue - La nouvelle valeur sélectionnée pour le cadre d'intervention.
   * 
   * Par exemple lorsque le champ `cadre_intervention` change, la méthode réinitialise la valeur du champ
   * `cadre_intervention_detail` à `null` sans émettre d'événement, afin de garantir
   * la cohérence des données du formulaire.
   */
  onFieldChange(newValue: number, field: string, previousValue?: string | number | null): void {
    let newValueText = undefined;
    let previousValueText = undefined;
    console.log(`Changement de ${field} détecté, nouvelle valeur brute : ${newValue}.`);
    if (field === 'action') {
      newValueText = this.projetService.getLibelleByCdType(newValue, this.operationTypesFamilles);
      if (previousValue) {
        previousValueText = this.projetService.getLibelleByCdType(previousValue, this.operationTypesFamilles);
      }
      console.log(`Changement de ${field} détecté, nouvelle valeur : ${newValueText}.`);
      // Mettre à null la valeur de cadre_intervention_detail
    } else if (field === 'action_2') {
      newValueText = this.projetService.getLibelleByCdType(newValue, this.operationTypesMeca, this.operationTypesPat, this.operationTypesAme, this.operationTypesHydro, this.operationTypesDech);
      if (previousValue) {
        previousValueText = this.projetService.getLibelleByCdType(previousValue, this.operationTypesMeca, this.operationTypesPat, this.operationTypesAme, this.operationTypesHydro, this.operationTypesDech);
      }
      console.log(`Changement de ${field} détecté, nouvelle valeur : ${newValueText}.`);
    }
    

    // Si on détecte que l'on a passé d'une valeur à une autre
    if (previousValue === undefined || previousValue != null) {
      console.log(`Changement de ${field} détecté, ancienne et nouvelle valeur : ${previousValueText} / ${newValueText}.`);

      if (field === 'action_2') {
        // Mettre à null les valeur d'information d'opération de paturage
        if (previousValueText == 'Pâturage' && newValueText != 'Pâturage') {
          // Cases à cocher des animaux du formulaire
          if(this.form?.get('liste_ope_animaux_paturage')) {
            (this.form.get('liste_ope_animaux_paturage') as FormArray).controls.forEach(element => {
              element.get('checked')!.setValue(false, { emitEvent: false });
            });
          }
          
          // Champs de nombres et listes déroulantes du formulaire
          if (this.step4Form.get('effectif_paturage')) {
            this.step4Form.get('effectif_paturage')!.setValue(null, { emitEvent: false });
          }
          if (this.step4Form.get('nb_jours_paturage')) {
            this.step4Form.get('nb_jours_paturage')!.setValue(null, { emitEvent: false });
          }
          if (this.step4Form.get('chargement_paturage')) {
            this.step4Form.get('chargement_paturage')!.setValue(null, { emitEvent: false });
          }
          if (this.step4Form.get('abroutissement_paturage')) {
            this.step4Form.get('abroutissement_paturage')!.setValue(null, { emitEvent: false });
          }
          if (this.step4Form.get('recouvrement_ligneux_paturage')) {
            this.step4Form.get('recouvrement_ligneux_paturage')!.setValue(null, { emitEvent: false });
          }

          // Supprimer tous les animaux possibles de l'opération en base de données
          this.liste_ope_animaux_paturage.forEach((animal) => {
            if (animal.lib_id) {
              this.projetService.deleteCheckbox('uuid_ope', this.operation!.uuid_ope, animal.lib_id, 'operation_animaux').subscribe({
                next: () => {
                  console.log(`Programme supprimé : ${animal.lib_libelle}`);
                },
                error: (error) => {
                  console.error(`Erreur lors de la suppression du programme : ${animal.lib_libelle}`, error);
                }
              });
            }
          });
        } else if (previousValueText == 'Fauche' && newValueText != 'Fauche') {
          // Champs de nombres et listes déroulantes du formulaire
          if (this.step4Form.get('exportation_fauche')) {
            this.step4Form.get('exportation_fauche')!.setValue(null, { emitEvent: false });
          }
          if (this.step4Form.get('total_exporte_fauche')) {
            this.step4Form.get('total_exporte_fauche')!.setValue(null, { emitEvent: false });
          }
          if (this.step4Form.get('productivite_fauche')) {
            this.step4Form.get('productivite_fauche')!.setValue(null, { emitEvent: false });
          }
        } else if (previousValueText == 'Intervention sur clôtures' && newValueText != 'Intervention sur clôtures') {
          // Champs de nombres et listes déroulantes du formulaire
          if (this.step4Form.get('interv_cloture')) {
            this.step4Form.get('interv_cloture')!.setValue(null, { emitEvent: false });
          }
        } else if (
          (previousValueText == 'Creusement' || previousValueText == 'Intervention sur les berges' || previousValueText == "Aménagement de plans d'eau") &&
          (newValueText != 'Creusement' && newValueText != "Intervention sur les berges" && newValueText != "Aménagement de plans d'eau")
        ) {
          // Champs de nombres et listes déroulantes du formulaire
          if (this.step4Form.get('type_intervention_hydro')) {
            this.step4Form.get('type_intervention_hydro')!.setValue(null, { emitEvent: false });
          }
        }
      }
    } else {
      // console.log(`Changement de ${field} détecté, nouvelle valeur : ${newValue}.`);
      // console.log(`Changement de ${field} détecté, nouvelle valeur : ${newValueText}.`);
      
      // Cas du chantier nature
      if (field === 'cadre_intervention') {
        // Mettre à null la valeur de cadre_intervention_detail
        if (this.step4Form.get('cadre_intervention_detail')) {
          this.step4Form.get('cadre_intervention_detail')!.setValue(null, { emitEvent: false });
          console.log('Le champ cadre_intervention_detail a été réinitialisé à null.');
        }
      }
    }
  }

  /**
   * Getter pour accéder à la liste des differents programmes d'opération disponibles
   * @returns {FormArray} La liste des programmes d'opération
   */
  get listeOpeProgrammes(): FormArray {
    return this.step3Form.get('liste_ope_programmes') as FormArray;
  }

  /**
   * Getter pour accéder à la liste des differents animaux d'une opération disponibles
   * @returns {FormArray} La liste des animaux d'une opération
   */
  get listeOpeAnimaux(): FormArray {
    return this.step4Form.get('liste_ope_animaux_paturage') as FormArray;
  }

  /**
  * Méthode pour mettre à jour this.operation en fonction des programmes sélectionnés par l'utilisateur
  */
  getSelectedProgrammes(): { lib_id: number; lib_libelle: string }[] {
    return this.listeOpeProgrammes.controls
      .filter(control => control.get('checked')?.value)
      .map(control => ({
        lib_id: control.get('lib_id')?.value,
        lib_libelle: control.get('lib_libelle')?.value,
      }));
  }

  /**
   * Méthode pour mettre à jour this.operation en fonction des animaux sélectionnés par l'utilisateur
   */
  getSelectedAnimaux(): { lib_id: number; lib_libelle: string }[] {
    return this.listeOpeAnimaux.controls
      .filter(control => control.get('checked')?.value)
      .map(control => ({
        lib_id: control.get('lib_id')?.value,
        lib_libelle: control.get('lib_libelle')?.value,
      }));
  }

  /**
   * Ajoute les checkbox sélectionnés dans la base de données avec les choix effectués par l'utilisateur.
   */
  insertCheckbox(insertList: OperationCheckbox[], table: string): void {
    insertList.forEach(item => {
      // Créer un objet OperationProgramme à partir du programme sélectionné
      const itemToInsert: OperationCheckbox = {
        uuid_ope: this.operation!.uuid_ope,
        checkbox_id: item.lib_id, // Remplir l'identifiant du programme
      };

      this.projetService.insertCheckbox(item, table).subscribe({
        next: () => {
          console.log(`Programme ajouté : ${item.lib_libelle}`);
        },
        error: (error) => {
          console.error(`Erreur lors de l'ajout du programme : ${item.lib_libelle}`, error);
        }
      });

    });
  }

  /**
   * Synchronise les cases à cocher sélectionnées (programmes ou animaux...) avec la base de données.
   * @param type 'programmes' ou 'animaux'
   */
  private syncOperationCheckboxes(type: 'programmes' | 'animaux'): void {
    let selected: { lib_id: number; lib_libelle: string }[] = [];
    let existing: OperationCheckbox[] = [];
    let liste: OperationCheckbox[] | undefined;
    let ope: OperationCheckbox[] | undefined;
    let table = '';
  
    if (!this.operation) {
      console.error('Impossible de synchroniser : données manquantes.');
      return;
    }
  
    if (type === 'programmes') {
      selected = this.getSelectedProgrammes();
      liste = this.operation.liste_ope_programmes;
      ope = this.operation.ope_programmes;
      table = 'operation_programmes';
    } else {
      selected = this.getSelectedAnimaux();
      liste = this.operation.liste_ope_animaux_paturage;
      ope = this.operation.ope_animal_paturage;
      table = 'operation_animaux';
    }
  
    if (!liste) {
      console.error(`Impossible de synchroniser les ${type} : données manquantes.`);
      return;
    }
  
    existing = ope || [];
  
    // À ajouter
    const toAdd = selected.filter(
      sel => !existing.some(ex => ex.lib_id === sel.lib_id)
    );
    // À supprimer
    const toRemove = existing.filter(
      ex => !selected.some(sel => sel.lib_id === ex.lib_id)
    );
  
    console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} à ajouter :`, toAdd);
    console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} à supprimer :`, toRemove);
  
    // Ajout
    toAdd.forEach(item => {
      const checkbox: OperationCheckbox = {
        uuid_ope: this.operation!.uuid_ope,
        checkbox_id: item.lib_id,
      };
      this.projetService.insertCheckbox(checkbox, table).subscribe({
        next: () => {
          console.log(`${type} ajouté : ${item.lib_libelle}`);
        },
        error: (error) => {
          console.error(`Erreur lors de l'ajout du ${type} : ${item.lib_libelle}`, error);
        }
      });
    });
  
    // Suppression
    toRemove.forEach(item => {
      this.projetService.deleteCheckbox('uuid_ope', this.operation!.uuid_ope, item.lib_id, table).subscribe({
        next: () => {
          console.log(`${type} supprimé : ${item.lib_libelle}`);
        },
        error: (error) => {
          console.error(`Erreur lors de la suppression du ${type} : ${item.lib_libelle}`, error);
        }
      });
    });
  }

  syncCheckboxs(): void {
    // Faire tout d'un coup
    this.syncOperationCheckboxes('programmes');
    this.syncOperationCheckboxes('animaux');
  }
}