// Petit composant pour la gestion d'un formulaire des opérations d'un projet
// Les données du formulaire sont passées en entrée via @Input pour modifier
// Et Si on ne passe pas de données, on crée un nouveau formulaire vide 

import { Component, OnInit, ChangeDetectorRef, inject, Inject, signal, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

import { FormButtonsComponent } from '../../../../../shared/form-buttons/form-buttons.component';

import { OperationLite, Operation } from './operations';
import { ProjetService } from '../../projets.service';
import { FormService } from '../../../../../services/form.service';


import { MatDialog, MatDialogModule, MatDialogTitle, MatDialogContent, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

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

  public isLoading: boolean = false;
  loadingDelay: number = 300;
  
  public linearMode: boolean = true;
  private isEditMode: boolean = false;
  public operationLite: OperationLite;
  
  // préparation des formulaires. Soit on crée un nouveau formulaire, soit on récupère un formulaire existant
  form: FormGroup;
  @Input() operations!: Operation[]; // liste d'opératons venant du parent (boite de dialogue projet)

  // A supprimer
  @Input() inputForm: FormGroup | undefined;

  initialFormValues!: FormGroup; // Propriété pour stocker les valeurs initiales du formulaire principal
  
  isFormValid: boolean = false;
  private formStatusSubscription: Subscription | null = null;

  stepperOrientation: Observable<StepperOrientation>;
  
  constructor(
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private formService: FormService,
    // private research: ProjetService,
    @Inject(MAT_DIALOG_DATA) public data: OperationLite, // Inject MAT_DIALOG_DATA to access the passed data
  ) {
      // Données en entrée provenant de la liste simple des projets tous confondus
      if (data.uuid_ope !== null) {
        this.linearMode = false;
      }
      this.operationLite = data;
      console.log("data : ");
      console.log(data);
      
      // Sert pour le stepper
      const breakpointObserver = inject(BreakpointObserver);
      this.stepperOrientation = breakpointObserver.observe('(min-width: 800px)').pipe(map(({matches}) => (matches ? 'horizontal' : 'vertical')));
      
      console.log("this.projetLite dans le dialog :", this.operationLite);
      
      // Initialisation du formulaire vide
      this.form = this.fb.group({});
    }
    
  async ngOnInit() {
    // Remplir this.form soit vide soit avec les données passées en entrée
    // Attendre un certain temps avant de continuer
    // S'abonner aux changements du statut du formulaire principal (projetForm)
    
    if (this.form === undefined && this.inputForm === undefined) {
      //  Cas d'un nouveau formulaire
      this.form = this.formService.newOperationForm();
      this.initialFormValues = this.formService.newOperationForm();
    } else if (this.inputForm !== undefined && this.form === undefined) {
      // Cas d'intégration d'un formulaire existant
      this.form = this.inputForm;
      this.initialFormValues = this.inputForm
    }

    setTimeout(async () => {
      if (this.form !== undefined) {
        // Souscrire aux changements du statut du formulaire principal (projetForm)
        this.formStatusSubscription = this.form.statusChanges.subscribe(status => {
          this.isFormValid = this.form ? this.form.valid : false;  // Mettre à jour isFormValid en temps réel
          // console.log('Statut du formulaire principal :', status);
          // console.log("this.isFormValid = this.projetForm.valid :");
          // console.log(this.isFormValid + " = " + this.projetForm.valid);
          // console.log("isFormValid passé à l'enfant:", this.isFormValid);
          this.cdr.detectChanges();  // Forcer la détection des changements dans le parent
        });
        this.isLoading = false;  // Le chargement est terminé
      }  
    }, this.loadingDelay);
  }

  ngOnDestroy(): void {
    // Désabonnement lors de la destruction du composant
    if (this.formStatusSubscription) {
      this.formStatusSubscription.unsubscribe();
    }
    console.log('Destruction du composant, on se désabonne.');
  }

  // Pour le stepper et le bouton MAJ
  getInvalidFields(): string[] {
    if (this.form !== undefined) {
      return this.formService.getInvalidFields(this.form);
    } else {
      return [];
    }
  }

  onSubmit(): void {
    // Logique de soumission du formulaire global
    if (this.form !== undefined) {
      if (this.form.valid) {
        console.log(this.form.value);
      }
    }
  }
    
  toggleEditMode(): void {
    if (this.form !== undefined) {
      this.isEditMode = this.formService.toggleEditMode(this.form, this.isEditMode, this.initialFormValues);
      this.cdr.detectChanges(); // Forcer la détection des changements
    }
  }

}
