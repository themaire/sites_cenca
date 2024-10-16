import { Component, OnInit, ChangeDetectorRef, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

import { DetailGestionComponent } from '../../detail-gestion/detail-gestion.component'; 

import { MatDialog, MatDialogModule, MatDialogTitle, MatDialogContent, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule, StepperOrientation } from '@angular/material/stepper';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';

import { MatInputModule } from '@angular/material/input'; 
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatDatepickerIntl, MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import 'moment/locale/fr';

import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';

import { OperationComponent } from './operation/operation.component';
import { MapComponent } from '../../../../map/map.component';

import { ProjetLite, Projet } from '../projets';
import { Operation } from './operation/operations';
import { ProjetService } from '../projets.service';
import { FormService } from '../../../../services/form.service';

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
  selector: 'app-dialog-operation',
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
    DetailGestionComponent,
    CommonModule,
    MapComponent,
    MatDialogModule,
    MatDialogTitle,
    MatDialogContent,
    MatIconModule,
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    AsyncPipe  // Ajouté pour le spinner
  ],
  templateUrl: './projet.component.html',
  styleUrls: ['./projet.component.scss'], // Correct 'styleUrl' to 'styleUrls'
})
export class ProjetComponent implements OnInit { // Implements OnInit to use the lifecycle method
  private readonly _adapter = inject<DateAdapter<unknown, unknown>>(DateAdapter);
  private readonly _intl = inject(MatDatepickerIntl);
  private readonly _locale = signal(inject<unknown>(MAT_DATE_LOCALE));
  readonly dateFormatString = this._locale() === 'fr';
  
  operations!: Operation[];
  
  public dataSourceOperations!: MatTableDataSource<Operation>;
  // Pour la liste des opérations : le tableau Material
  public displayedColumnsOperations: string[] = ['code', 'titre', 'description', 'surf', 'date_debut'];
  
  projetLite: ProjetLite;
  projet!: Projet;
  isLoading: boolean = true;  // Initialisation à 'true' pour activer le spinner
  loadingDelay: number = 300;
  isEditMode: boolean = false;
  isAddingOperation: boolean = false;

  projetForm!: FormGroup;
  initialFormValues!: FormGroup; // Propriété pour stocker les valeurs initiales du formulaire principal

  operationForm: any;
  
  stepperOrientation: Observable<StepperOrientation>;
  

  constructor(
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private formService: FormService,
    private research: ProjetService,
    @Inject(MAT_DIALOG_DATA) public data: ProjetLite, // Inject MAT_DIALOG_DATA to access the passed data
    ) {
      // Données en entrée provenant de la liste simple des projets tous confondus
      this.projetLite = data;
      console.log("data : ");
      console.log(data);

      // Sert pour le stepper
      const breakpointObserver = inject(BreakpointObserver);
      this.stepperOrientation = breakpointObserver.observe('(min-width: 800px)').pipe(map(({matches}) => (matches ? 'horizontal' : 'vertical')));

      console.log("this.projetLite dans le dialog :", this.projetLite);

      this.operationForm = this.formService.newOperationForm();
    }
    
  toggleEditMode(): void {
    this.isEditMode = this.formService.toggleEditMode(this.projetForm, this.isEditMode, this.initialFormValues);
  }

  toggleAddingOperation(): void {
    this.isAddingOperation = this.formService.toggleEditMode(this.projetForm, this.isAddingOperation, this.initialFormValues);
  }

  getInvalidFields(): string[] {
    return this.formService.getInvalidFields(this.projetForm);
  }

  async ngOnInit() {
    // Initialiser les valeurs du formulaire principal quand on le composant a fini de s'initialiser
    let subroute: string = "";
    
    if (this.projetLite?.uuid_proj) {
      try {
        // Simuler un délai artificiel
        setTimeout(async () => {
          subroute = `projets/uuid=${this.projetLite.uuid_proj}`;
          console.log("Récupération des données du projet avec l'UUID du projet :" + this.projetLite.uuid_proj);
          const projetArray = await this.research.getProjet(subroute);

          // Accéder données du projet
          if (Array.isArray(projetArray) && projetArray.length > 0) {
            this.projet = projetArray[0]; // Assigner l'objet projet directement
            console.log('Projet après extraction :', this.projet);

            // Les form_groups correspondant aux steps
            // Sert a defini les valeurs par defaut et si obligatoire
            this.projetForm = this.fb.group({
              type: [this.projet.typ_projet || '', Validators.required],
              nom: [this.projet.nom || '', Validators.required],
              code: [this.projet.code || '', Validators.required],
              responsable: [this.projet.code || '', Validators.required],
              pro_maitre_ouvrage: [this.projet.pro_maitre_ouvrage || '', Validators.required],
              pro_debut: [this.projet.pro_debut || '', Validators.required],
              pro_fin: [this.projet.pro_fin || '', Validators.required],
              statut: [this.projet.statut || '', Validators.required],
              pro_obj_projet: [this.projet.pro_obj_projet || '',],
              surface: [this.projet.pro_surf_totale || '', Validators.required],
              pro_enjeux_eco: [this.projet.pro_enjeux_eco || '', Validators.required],
              pro_nv_enjeux: [this.projet.pro_nv_enjeux || '', Validators.required],
              pro_pression_ciblee: [this.projet.pro_pression_ciblee || '', Validators.required],
              pro_results_attendus: [this.projet.pro_results_attendus || '', Validators.required]
            });
            
            this.isLoading = false;  // Le chargement est terminé

            subroute = `operations/uuid=${this.projet.uuid_proj}`;
            console.log("Récupération des opérations avec l'UUID du projet :" + this.projet.uuid_proj);
            
            this.operations = await this.research.getOperations(subroute);
            console.log("Operations : ");
            console.log(this.operations);

            // Accéder à la liste des opérations
            if (Array.isArray(this.operations) && this.operations.length > 0) {
                this.dataSourceOperations = new MatTableDataSource(this.operations);

                console.log('Projet après extraction :', this.projet);

                this.cdr.detectChanges(); // Forcer la mise à jour de la vue
              }
            this.cdr.detectChanges(); // Forcer la mise à jour de la vue
          }
        }, this.loadingDelay);
      } catch (error) {
        console.error('Erreur lors de la récupération des données du projet', error);
        this.isLoading = false;  // Même en cas d'erreur, arrêter le spinner
        this.cdr.detectChanges();
      }
    }
  }

  // Pour l'affichage de la fenetre de dialogue
  dialog = inject(MatDialog);

  onSelect(operation: Operation): void {
    // Sert à quand on clic sur une ligne du tableau pour rentrer dans le detail d'un projet.
    // L'OPERATION SELECTIONNE PAR L'UTILISATEUR dans la variable ope

    // Ca se passe dans la vue du component dialog-operation
    if(operation.uuid_ope !== undefined){
      // OUVRIR LA FENETRE DE DIALOGUE
      this.openDialog(operation);
    }else{
      console.log("Pas de d'opération sur ce projet : " + operation.titre);
    }
  }
  
  openDialog(operation: Operation): void {
    let dialogComponent: any = OperationComponent;

    this.dialog.open(dialogComponent, {
      data : operation
    });
  }

  onSubmit(): void {
    // Logique de soumission du formulaire global
    if (this.projetForm.valid) {
      console.log(this.projetForm.value);
    }
  }
}
