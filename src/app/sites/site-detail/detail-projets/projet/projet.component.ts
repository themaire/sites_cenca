import { Component, ChangeDetectorRef, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialogTitle, MatDialogContent, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ProjetLite, Projet } from '../projets';
import { ProjetService } from '../projets.service';

@Component({
  selector: 'app-dialog-operation',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatDialogTitle,
    MatDialogContent,
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule  // Ajouté pour le spinner
  ],
  templateUrl: './projet.component.html',
  styleUrls: ['./projet.component.scss'], // Correct 'styleUrl' to 'styleUrls'
})
export class ProjetComponent implements OnInit { // Implements OnInit to use the lifecycle method
  projetLite: any;
  projet!: Projet;
  isLoading: boolean = true;  // Initialisation à 'true' pour activer le spinner
  editMode: boolean = false;

  descriptionFormGroup: FormGroup;
  ENPFormGroup: FormGroup;
  UGFormGroup: FormGroup;
  indicateursFormGroup: FormGroup;
  financementFormGroup: FormGroup;
  operationsFormGroup: FormGroup;

  constructor(
    private cdr: ChangeDetectorRef,
    private research: ProjetService, // Inject service via constructor
    @Inject(MAT_DIALOG_DATA) public data: ProjetLite, // Inject MAT_DIALOG_DATA to access the passed data
    private _formBuilder: FormBuilder) {
    this.projetLite = data;
    
    // Initialize form groups
    this.descriptionFormGroup = this._formBuilder.group({ descriptionCtrl: [''] });
    this.ENPFormGroup = this._formBuilder.group({ ENPCtrl: [''] });
    this.UGFormGroup = this._formBuilder.group({ UGCtrl: [''] });
    this.indicateursFormGroup = this._formBuilder.group({ indicateursCtrl: [''] });
    this.financementFormGroup = this._formBuilder.group({ financementCtrl: [''] });
    this.operationsFormGroup = this._formBuilder.group({ operationsCtrl: [''] });
    
    console.log("this.projetLite dans le dialog :", this.projetLite);
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    this.cdr.detectChanges();
  }

  async ngOnInit() {
    let subroute: string = "";
    
    if (this.projetLite !== undefined) {
      subroute = `projets/uuid=${this.projetLite.uuid_proj}`;
      console.log("Récupération des données du projet avec UUID:" + this.projetLite.uuid_proj);
      
      try {
        // Simuler un délai artificiel de 2 secondes
        setTimeout(async () => {
          const projetArray = await this.research.getProjet(subroute);

          // Accéder au premier élément du tableau projet
          if (Array.isArray(projetArray) && projetArray.length > 0) {
            this.projet = projetArray[0]; // Assigner l'objet projet directement
            console.log('Projet après extraction :', this.projet);
            
            this.isLoading = false;  // Le chargement est terminé
            this.cdr.detectChanges(); // Forcer la mise à jour de la vue
          }
        }, 2000); // Délai de 2 secondes
      } catch (error) {
        console.error('Erreur lors de la récupération des données du projet', error);
        this.isLoading = false;  // Même en cas d'erreur, arrêter le spinner
        this.cdr.detectChanges();
      }
    }
  }
  
}
