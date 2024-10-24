// Petit composant pour la gestion d'un formulaire des opérations d'un projet
// Reçoit l'id du projet pour obtenir la liste des opérations en bdd

// Les données du formulaire sont passées en entrée via @Input pour modifier
// Et Si on ne passe pas de données, on crée un nouveau formulaire vide 

import { Component, OnInit, ChangeDetectorRef, inject, signal, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

import { FormButtonsComponent } from '../../../../../shared/form-buttons/form-buttons.component';

import { OperationLite, Operation } from './operations';
import { ProjetService } from '../../projets.service';
import { FormService } from '../../../../../services/form.service';


import { MatDialog, MatDialogModule, MatDialogTitle, MatDialogContent, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Importer MatSnackBar

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule, StepperOrientation } from '@angular/material/stepper';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';

import { MatSlideToggleModule } from '@angular/material/slide-toggle';

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

import { MapComponent } from '../../../../../map/map.component';

import { Subscription } from 'rxjs';


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
    MatSlideToggleModule,
    AsyncPipe  // Ajouté pour le spinner
  ],
  templateUrl: './operation.component.html',
  styleUrls: ['./operation.component.scss']
})
export class OperationComponent implements OnInit, OnDestroy {
  private readonly _adapter = inject<DateAdapter<unknown, unknown>>(DateAdapter);
  private readonly _intl = inject(MatDatepickerIntl);
  private readonly _locale = signal(inject<unknown>(MAT_DATE_LOCALE));
  readonly dateFormatString = this._locale() === 'fr';

  isLoading: boolean = false;
  loadingDelay: number = 300;

  operations!: OperationLite[];
  dataSourceOperations!: MatTableDataSource<Operation>;
  // Pour la liste des opérations : le tableau Material
  displayedColumnsOperations: string[] = ['code', 'titre', 'description', 'surf', 'date_debut'];
  operation!: Operation;

  // Booleens d'états pour le mode d'affichage
  isEditOperation: boolean = false;
  @Output() isEditFromOperation = new EventEmitter<boolean>(); // Savoir si le projet est en edition pour masquer les boutons
  @Input() projetEditMode: boolean = false;

  linearMode: boolean = true;
  selectedOperation: String | undefined;
  
  // préparation des formulaires. Soit on crée un nouveau formulaire, soit on récupère un formulaire existant
  form: FormGroup | undefined;
  @Input() ref_uuid_proj!: String; // liste d'opératons venant du parent (boite de dialogue projet) 
  initialFormValues!: FormGroup; // Propriété pour stocker les valeurs initiales du formulaire principal
  isFormValid: boolean = false;
  private formStatusSubscription: Subscription | null = null;

  stepperOrientation: Observable<StepperOrientation>;
  
  constructor(
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private formService: FormService,
    private research: ProjetService,
    private snackBar: MatSnackBar, // Injecter MatSnackBar
    ) {
      // Sert pour le stepper
      const breakpointObserver = inject(BreakpointObserver);
      this.stepperOrientation = breakpointObserver.observe('(min-width: 800px)').pipe(map(({matches}) => (matches ? 'horizontal' : 'vertical')));
      
      console.log("this.ref_uuid_proj venant du input :", this.ref_uuid_proj);
      
      // Initialisation du formulaire vide
      this.form = this.fb.group({});
    }
    
  async ngOnInit() {
    // Remplir this.form soit vide soit avec les données passées en entrée
    // Attendre un certain temps avant de continuer
    // S'abonner aux changements du statut du formulaire principal (projetForm)
    try {
      if (this.ref_uuid_proj !== undefined) {
        // Accéder à la liste des opérations
        const subroute = `operations/uuid=${this.ref_uuid_proj}/lite`; // Lite puisque PLUSIEURS opérations
      
        setTimeout(async () => {
          console.log("Récupération des opérations avec l'UUID du projet :" + this.ref_uuid_proj);
          this.operations = await this.research.getOperations(subroute);
          console.log("Operations : ");
          console.log(this.operations);
          
          if (Array.isArray(this.operations) && this.operations.length > 0) {
            this.dataSourceOperations = new MatTableDataSource(this.operations);
            // console.log('Opérations après extraction :', this.operations);
            
            this.cdr.detectChanges(); // Forcer la mise à jour de la vue
          }

          // if (this.form === undefined && this.inputForm === undefined) {
          //   //  Cas d'un nouveau formulaire
          //   this.form = this.formService.newOperationForm();
          //   this.initialFormValues = this.formService.newOperationForm();
          // } else if (this.inputForm !== undefined && this.form === undefined) {
          //   // Cas d'intégration d'un formulaire existant
          //   this.form = this.inputForm;
          //   this.initialFormValues = this.inputForm
          // }

          // if (this.form !== undefined) {
          //   // Souscrire aux changements du statut du formulaire principal (projetForm)
          //   this.formStatusSubscription = this.form.statusChanges.subscribe(status => {
          //     this.isFormValid = this.form ? this.form.valid : false;  // Mettre à jour isFormValid en temps réel
          //     // console.log('Statut du formulaire principal :', status);
          //     // console.log("this.isFormValid = this.projetForm.valid :");
          //     // console.log(this.isFormValid + " = " + this.projetForm.valid);
          //     // console.log("isFormValid passé à l'enfant:", this.isFormValid);
          //     this.cdr.detectChanges();  // Forcer la détection des changements dans le parent
          //   });
          //   this.isLoading = false;  // Le chargement est terminé
          // }  
        }, this.loadingDelay);
        this.isLoading = false;  // Le chargement est terminé
      } // Fin du bloc timeout
      
    } catch (error) {
      console.error('Erreur lors de la récupération des données du projet', error);
      this.isLoading = false;  // Même en cas d'erreur, arrêter le spinner
      this.cdr.detectChanges();
    }

    // Ini s'en sert pas au bon moment
    // this.makeOperationForm({ empty: true });
  }
  
  ngOnDestroy(): void {
    this.unsubForm();
  }

  // Désabonnement lors de la destruction du composant
  unsubForm(): void {
    if (this.formStatusSubscription) {
      this.formStatusSubscription.unsubscribe();
    }
    console.log('Destruction du composant, on se désabonne.');
  }

  onSubmit(mode: String): void {
    // Logique de soumission du formulaire du projet
    if (this.form !== undefined) {
      if (this.form.valid) {
        if (mode === 'add'){
          console.log(this.form.value);
        } else if (mode === 'edit') {
          console.log(this.form.value);
        } else if (mode === 'delete') {
          console.log(this.form.value);
        }
      } else {
        console.error('Le formulaire est invalide, veuillez le corriger.');
      }
    } else {
      console.error('Le formulaire est introuvable, veuillez le créer.');
  }
  
  onToggleEditMode(): void {
    if (this.form !== undefined) {
      this.isEditOperation = this.formService.toggleEditMode(this.form, this.isEditOperation, this.initialFormValues);
      this.isEditFromOperation.emit(this.isEditOperation);
      this.cdr.detectChanges(); // Forcer la détection des changements
    }
  }
  
  getInvalidFields(): string[] {
    // Pour le stepper et le bouton MAJ
    if (this.form !== undefined) {
      return this.formService.getInvalidFields(this.form);
    } else {
      return [];
    }
  }

  async makeOperationForm({ operation, empty = false }: { operation?: OperationLite, empty?: boolean } = {}): Promise<void> {
    
    if (this.projetEditMode){
      this.snackBar.open("Veuillez terminer l'édition du projet avant d''ouvrir une  opérations", 'Fermer', { 
        duration: 3000,});
      return;
    }

    this.snackBar.open("Nous rentrons ", 'Fermer', { 
      duration: 3000,});
    
    console.log("operation passé en paramètre :");
    console.log(operation);

    console.log("empty passé en paramètre :");
    console.log(empty);

    console.log("this.form avant la création du formulaire :");
    console.log(this.form);

    try {
      if (empty) {
        this.form = this.formService.newOperationForm();
      } else if (operation === undefined && this.form?.validator === null) {
        //  Cas d'un nouveau formulaire
        this.form = this.formService.newOperationForm(operation);
      } else if (operation !== undefined && this.form === undefined) {
        // Cas d'intégration d'un formulaire existant
        // Sélectionner UNE SEULE opération pour l'afficher dans un dans le formulaire
        const subroute = `operations/uuid=${operation!.uuid_ope}/full`; // Lite puisque PLUSIEURS opérations
        console.log("subroute : " + subroute);
        this.operation = await this.research.getOperation(subroute);
        console.log("Operation selectionnée : ");
        console.log(this.operation);
        
        this.form = this.formService.newOperationForm(this.operation);
        console.log("this.form après la création du formulaire :");
        console.log(this.form);
      }
      
      if (this.form!.validator !== null) {
        // Souscrire aux changements du statut du formulaire principal (projetForm)
        this.formStatusSubscription = this.form!.statusChanges.subscribe(status => {
          this.isFormValid = this.form ? this.form.valid : false;  // Mettre à jour isFormValid en temps réel
          // console.log('Statut du formulaire principal :', status);
          // console.log("this.isFormValid = this.projetForm.valid :");
          // console.log(this.isFormValid + " = " + this.projetForm.valid);
          // console.log("isFormValid passé à l'enfant:", this.isFormValid);
          this.cdr.detectChanges();  // Forcer la détection des changements dans le parent
        });
      } else {
        this.unsubForm();
      }

      this.initialFormValues = this.formService.newOperationForm();
      this.isEditOperation = true;

    } catch (error) {
      console.error('Erreur lors de la création du formulaire', error);
    }
  }
}
function onToggleEditMode() {
  throw new Error('Function not implemented.');
}

