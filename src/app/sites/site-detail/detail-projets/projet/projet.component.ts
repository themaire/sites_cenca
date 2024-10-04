import { Component, ChangeDetectorRef, OnInit, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, FormsModule, FormGroup, ReactiveFormsModule} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule} from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule, StepperOrientation } from '@angular/material/stepper';
import { MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule, MatDialogTitle, MatDialogContent, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';

import { OperationComponent } from './operation/operation.component';
import { MapComponent } from '../../../../map/map.component';

import { ProjetLite, Projet } from '../projets';
import { Operation } from './operation/operations';
import { ProjetService } from '../projets.service';

@Component({
  selector: 'app-dialog-operation',
  standalone: true,
  imports: [
    CommonModule,
    MapComponent,
    MatDialogModule,
    MatDialogTitle,
    MatDialogContent,
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    AsyncPipe  // Ajouté pour le spinner
  ],
  templateUrl: './projet.component.html',
  styleUrls: ['./projet.component.scss'], // Correct 'styleUrl' to 'styleUrls'
})
export class ProjetComponent implements OnInit { // Implements OnInit to use the lifecycle method
  operations!: Operation[];
  public dataSource!: MatTableDataSource<Operation>;
  // Pour la liste des opérations : le tableau Material
  public displayedColumns: string[] = ['code', 'titre', 'description', 'surf', 'date_debut'];

  private _formBuilder = inject(FormBuilder);
  
  projetLite: ProjetLite;
  projet!: Projet;
  isLoading: boolean = true;  // Initialisation à 'true' pour activer le spinner
  loadingDelay: number = 300;
  editMode: boolean = false;

  // Tous en mode ! puisque initialisé dans le constructor
  descriptionFormGroup!: FormGroup;
  ENPFormGroup!: FormGroup;
  UGFormGroup!: FormGroup;
  indicateursFormGroup!: FormGroup;
  financementFormGroup!: FormGroup;
  operationsFormGroup!: FormGroup;
  
  stepperOrientation: Observable<StepperOrientation>;

  constructor(
    private cdr: ChangeDetectorRef,
    private research: ProjetService, // Inject service via constructor
    @Inject(MAT_DIALOG_DATA) public data: ProjetLite, // Inject MAT_DIALOG_DATA to access the passed data

    

    ) {
      // Données en entrée provenant de la liste simple des projets tous confondus
      this.projetLite = data;
      console.log("data : " + data);

      // Sert pour le stepper
      const breakpointObserver = inject(BreakpointObserver);
      this.stepperOrientation = breakpointObserver.observe('(min-width: 800px)').pipe(map(({matches}) => (matches ? 'horizontal' : 'vertical')));

      // Les form_groups correspondant aux steps
      // Sert a defini les valeurs par defaut et si obligatoire
      this.descriptionFormGroup = this._formBuilder.group({
        Type: ['', Validators.required],
        Titre: ['', Validators.required],
        }
      );
      this.ENPFormGroup = this._formBuilder.group({
        secondCtrl: ['', Validators.required],
      });
      this.UGFormGroup = this._formBuilder.group({
        thirdCtrl: ['', Validators.required],
      });
      this.indicateursFormGroup = this._formBuilder.group({
        firstCtrl: ['', Validators.required],
      });
      this.financementFormGroup = this._formBuilder.group({
        secondCtrl: ['', Validators.required],
      });
      this.operationsFormGroup = this._formBuilder.group({
        thirdCtrl: ['', Validators.required],
      });
      
      console.log("this.projetLite dans le dialog :", this.projetLite);

  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    this.cdr.detectChanges();
  }

  async ngOnInit() {
    let subroute: string = "";
    
    if (this.projetLite !== undefined) {
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
            
            this.isLoading = false;  // Le chargement est terminé

            subroute = `projets/uuid=${this.projet.uuid_proj}`;
            console.log("Récupération des opérations avec l'UUID du projet :" + this.projet.uuid_proj);
            
            const operationArray = await this.research.getOperations(subroute);

            // Accéder à la liste des opérations
            if (Array.isArray(operationArray) && operationArray.length > 0) {
                this.operations = operationArray; // Assigner l'objet projet directement
                this.dataSource = new MatTableDataSource(this.operations);

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
}
