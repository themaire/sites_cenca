import {Component, inject, ChangeDetectorRef} from '@angular/core';
import {CommonModule} from '@angular/common';

import { ProjetV } from '../projets';
import { ProjetService } from '../projets.service';

import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatStepperModule} from '@angular/material/stepper';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
} from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-operation',
  standalone: true,
  imports: [
            CommonModule,
            MatDialogTitle,
            MatDialogContent,
            MatStepperModule,
            FormsModule,
            ReactiveFormsModule,
            MatFormFieldModule,
            MatInputModule,
            MatButtonModule,],
  templateUrl: './projetV.component.html',
  styleUrl: './projetV.component.scss'
})
export class ProjetVComponent {
  ope = inject(MAT_DIALOG_DATA);
  projetV!: ProjetV;
  editMode: boolean = false;

  research: ProjetService = inject(ProjetService);

  constructor(private cdr: ChangeDetectorRef){
    console.log("this.ope dans le dialog :");
    console.log(this.ope);
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    this.cdr.detectChanges();
  }

  async ngOnChanges(){
    // Recuperer les opérations du site selectionné dans un tableau mat-table
    // Ce component est chargé en meme temps que sitesDetail.
    let subroute: string = "";
    
    if (this.ope !== undefined) {  // Si le site selectionné n'est pas vide
      subroute = `projetslite/uuid=${this.ope.uuid_proj}`;
      console.log("Ouais on est dans le OnChanges 'onglet OPERATIONS' . UUID:" + this.ope.uuid_proj);
      
      // ChatGPT 19/07/2024
      try {
        this.projetV = await this.research.getProjet(subroute);

        // console.log('Données de this.Mfus après assignation :', this.actes);
        this.cdr.detectChanges(); // Forcer la détection des changements
      } catch (error) {
        console.error('Error fetching documents', error);
      }
    }
  }

  private _formBuilder = inject(FormBuilder);

  descriptionFormGroup: FormGroup = this._formBuilder.group({descriptionCtrl: ['']});
  ENPFormGroup: FormGroup = this._formBuilder.group({ENPCtrl: ['']});
  UGFormGroup: FormGroup = this._formBuilder.group({UGCtrl: ['']});
  indicateursFormGroup: FormGroup = this._formBuilder.group({indicateursCtrl: ['']});
  financementFormGroup: FormGroup = this._formBuilder.group({financementCtrl: ['']});
  operationsFormGroup: FormGroup = this._formBuilder.group({operationsCtrl: ['']});
}