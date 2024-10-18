import { Component, OnInit, ChangeDetectorRef, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

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

import { MapComponent } from '../../../../../map/map.component';

import { OperationLite, Operation } from './operations';
import { ProjetService } from '../../projets.service';
import { FormService } from '../../../../../services/form.service';

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
    AsyncPipe  // Ajouté pour le spinner
  ],
  templateUrl: './operation.component.html',
  styleUrls: ['./operation.component.scss']
})
export class OperationComponent implements OnInit {
  private isEditMode: boolean = false;
  public projetLite: OperationLite;

  // préparation des formulaires
  operationForm: any;
  initialFormValues!: FormGroup; // Propriété pour stocker les valeurs initiales du formulaire principal
  
  // Pour le stepper et le bouton MAJ
  getInvalidFields(): string[] {
    return this.formService.getInvalidFields(this.operationForm);
  }

  stepperOrientation: Observable<StepperOrientation>;

  onSubmit(): void {
    // Logique de soumission du formulaire global
    if (this.operationForm.valid) {
      console.log(this.operationForm.value);
    }
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private formService: FormService,
    private research: ProjetService,
    @Inject(MAT_DIALOG_DATA) public data: OperationLite, // Inject MAT_DIALOG_DATA to access the passed data
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
    this.isEditMode = this.formService.toggleEditMode(this.operationForm, this.isEditMode, this.initialFormValues);
  }

  ngOnInit(): void {}
}
