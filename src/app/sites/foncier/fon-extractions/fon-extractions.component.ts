import { Component, ChangeDetectorRef, OnInit, OnDestroy, signal, ViewChild } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

import { MatDialog } from '@angular/material/dialog';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Importer MatSnackBar
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input'; 
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FormService } from '../../../services/form.service';
import { FoncierService } from '../foncier.service';
import { ApiResponse } from '../../../shared/interfaces/api';
import { FormButtonsComponent } from '../../../shared/form-buttons/form-buttons.component';

import { DetailExtractionComponent } from './detail-extraction/detail-extraction.component';

import { Extraction } from '../foncier';

@Component({
  selector: 'app-fon-demandes',
  standalone: true,
  imports: [
    CommonModule,
    FormButtonsComponent,
    DetailExtractionComponent,
    MatSnackBarModule,
    MatTable,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    AsyncPipe  // Ajouté pour le spinner
  ],
  templateUrl: './fon-extractions.component.html',
  styleUrl: './fon-extractions.component.scss'
})
export class FonExtractionComponent implements OnInit, OnDestroy {
  // Déclarer les variables
  public extractions!: Extraction[];
  public isEditExtraction: boolean = false;
  public isAddExtraction: boolean = false;
  public displayedColumns: string[] = [
      'ext_id', 'nom_complet', 'ext_code_site', 'ext_description', 'date'];
  public dataSourceExtractions!: MatTableDataSource<Extraction>;

  // spinner
  isLoading: boolean = false;
  loadingDelay: number = 50;

  // préparation des formulaires. Soit on crée un nouveau formulaire, soit on récupère un formulaire existant
  extractionForm: FormGroup;
  initialFormValues!: FormGroup; // Propriété pour stocker les valeurs initiales du formulaire principal
  isFormValid: boolean = false;
  extraction!: Extraction | void; // Pour les détails d'une extraction
  private formOpeSubscription: Subscription | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private foncierService: FoncierService,
    private formService: FormService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.extractionForm = fb.group({}); // Formulaire principal vide, sera rempi avec makeExtractionForm()
  }

  async ngOnInit() {
    // Remplir this.form soit vide soit avec les données passées en entrée
    // Attendre un certain temps avant de continuer
    // S'abonner aux changements du statut du formulaire principal (projetForm)
    
    console.log("Le composant des extractions foncières s'initialise..........");
    
    try {
      await this.fetchExtractions();
      
    } catch (error) {
      console.error('Erreur lors de la récupération des données du projet', error);
      this.isLoading = false;  // Même en cas d'erreur, arrêter le spinner
      this.cdr.detectChanges();
    }
  }

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
    this.formOpeSubscription = this.extractionForm.statusChanges.subscribe(status => {
      this.isFormValid = this.extractionForm ? this.extractionForm.valid : false;  // Mettre à jour isFormValid en temps réel
      console.log('Statut du formulaire principal :', status);
      console.log("this.isFormValid = this.projetForm.valid :");
      console.log(this.isFormValid + " = " + this.extractionForm.valid);
      console.log("Etat de isFormValid passé à l'enfant:", this.isFormValid);
      this.cdr.detectChanges();  // Forcer la détection des changements dans le parent
    });
  }

  toggleEditExtraction(mode: String): void {
    console.log("----------!!!!!!!!!!!!--------toggleEditOperation('" + mode +"') dans le composant extraction");
    if (mode === 'edit') {
      this.isEditExtraction = this.formService.simpleToggle(this.isEditExtraction); // Changer le mode du booleen
      this.formService.toggleFormState(this.extractionForm, this.isEditExtraction, this.initialFormValues); // Changer l'état du formulaire
      
      console.log("isEditExtraction apres toggleEditOperation('" + mode +"') :", this.isEditExtraction);
    } else if (mode === 'add') {
      console.log('Appel de makeOperationForm() pour créer un nouveau formulaire vide');
      
      if (!this.isAddExtraction) { // Création du formulaire on est pas en mode ajout
        this.makeExtractionForm({ empty: true });
      }

      this.isAddExtraction = this.formService.simpleToggle(this.isAddExtraction); // Changer le mode du booleen
      this.formService.toggleFormState(this.extractionForm, this.isAddExtraction, this.initialFormValues); // Changer l'état du formulaire
            
      console.log("isAddOperation apres toggleEditOperation('" + mode +"') :", this.isAddExtraction);
      
    } else {
      this.extractionForm = this.initialFormValues; // Réinitialiser le formulaire aux valeurs initiales
      this.isEditExtraction = false; // Sortir du mode édition
      this.isAddExtraction = false; // Sortir du mode ajout
      console.log("On vient de sortir du mode édition / ajout d'opération.");
    }
    this.cdr.detectChanges(); // Forcer la détection des changements
  }

  getInvalidFields(): string[] {
    // Pour le stepper et le bouton MAJ
    if (this.extractionForm !== undefined) {
      return this.formService.getInvalidFields(this.extractionForm);
    } else {
      return [];
    }
  }

  async fetchExtractions(cd_salarie?: String): Promise<Extraction | void> {
    console.log("----------!!!!!!!!!!!!--------fetchExtractions() dans le composant extractions");
    let subroute: string;
    
    if (cd_salarie == undefined) {
      subroute = `extraction=null`;      
    } else if (cd_salarie !== undefined) {
      subroute = `extraction=${cd_salarie}`; 
    } else {
      console.error('Aucun identifiant de projet ou d\'opération n\'a été trouvé.');
      return;
    }

    try {
      this.foncierService.getExtractions(subroute).subscribe(
        (extractions: Extraction[]) => {
          console.log('Extractions récupérées avec succès :');
          console.log(extractions);
          this.extractions = extractions;
          this.dataSourceExtractions = new MatTableDataSource(this.extractions);
          this.isLoading = false; // Arrêter le spinner
          this.cdr.detectChanges(); // Forcer la détection des changements
        },
        (error) => {
          console.error('Erreur lors de la récupération des extractions', error);
          this.isLoading = false; // Arrêter le spinner
          this.cdr.detectChanges(); // Forcer la détection des changements
        }
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des extractions', error);
    }
  }

  async makeExtractionForm({ extraction, empty }: { extraction?: Extraction, empty?: boolean } = { extraction: undefined, empty: false }): Promise<void> {
    // Deux grands modes :
    // 1. Créer un nouveau formulaire vide si ne donne PAS une operation
    // 2. Créer un formulaire avec les données d'une opération

    this.unsubForm(); // Se désabonner des changements du formulaire

    if (empty) {
      // Création d'un formulaire vide
      try {
        this.extractionForm = this.formService.newExtractionForm(undefined) as FormGroup;
        this.subscribeToForm() // S'abonner aux changements du formulaire créé juste avant
      } catch (error) {
        console.error('Erreur lors de la création du formulaire', error);
        return;
      }
    
    } else if ( extraction !== undefined ) {
      // On ouvre une opération existante
      // Chargement d'un formulaire avec une demande d'extraction
      
      console.log("OperationLite passée en paramètre dans makeOperationForm :");
      console.log(extraction);
      try {
        // Création du formulaire avec les données de l'opération
        if (extraction !== undefined) {
          this.extractionForm = this.formService.newExtractionForm(extraction); // Remplir this.form avec notre this.operation
          this.subscribeToForm(); // S'abonner aux changements du formulaire créé juste avant
          this.initialFormValues = this.extractionForm.value; // Stocker les valeurs initiales du formulaire
        }


        
        console.log("this.form après la création du formulaire :");
        console.log(this.extractionForm);
      } catch (error) {
      console.error('Erreur lors de la création du formulaire', error);
      }
    } else {
      console.error('Paramètres extraction et empty non definis.');
      return;
    }
  }

  openDetailDialog(extraction: Extraction): void {
    this.dialog.open(DetailExtractionComponent, {
        data: { extraction }
    });
}
  
  onSubmit(mode?: String): void {
    // Logique de soumission du formulaire du projet
    if (this.extractionForm !== undefined) {

      // Déja, si le formulaire est valide
      if (this.extractionForm.valid) {
        console.log("----------!!!!!!!!!!!!--------onSubmit('" + mode + "') dans le composant operation");
        console.log(this.extractionForm.value);

        // Nouvelle opération
        if (this.isAddExtraction === true){
          this.foncierService.insertExtraction(this.extractionForm.value).subscribe(
            (response: ApiResponse) => {
              console.log("Enregistrement de l'opération avec succès :", response);
              this.unsubForm(); // Se désabonner des changements du formulaire
              
              
              // Afficher le message dans le Snackbar
              const message = "Opération enregistrée"; // Message par défaut
              
              this.snackBar.open(message, 'Fermer', {
                duration: 3000,
                panelClass: ['snackbar-success']
              });
              this.fetchExtractions();
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
          this.isAddExtraction = false; // Changer le mode du booleen

        // Modification d'une opération
        } else if (this.isEditExtraction === true) {
          console.log('Enregistrement de l\'extraction en cours suite à demande de validation...');
          
          console.log('Formulaire juste avant le onUpdate :', this.extractionForm.value);
          const updateObservable = this.formService.onUpdate('extraction', this.extractionForm.value.ext_id, this.extractionForm, this.initialFormValues, this.isEditExtraction, this.snackBar);
          // S'abonner à l'observable. onUpdate 

          if (updateObservable) {
            updateObservable.subscribe(
              (result) => {
                this.isEditExtraction = result.isEditMode;
                
                console.log('Formulaire mis à jour avec succès:', result.formValue);
                
                // Accéder à la liste des opérations et remplir le tableau Material des operationLite
                this.extraction = undefined; // Réinitialiser l'opération
                this.fetchExtractions();
              },
              (error) => {
                console.error('Erreur lors de la mise à jour du formulaire', error);
              }
            );
          }

        } else if (mode === 'delete') {
          console.log(this.extractionForm.value);
        }
        
        
      } else {
        console.error('Le formulaire est invalide, veuillez le corriger.');
      }
    } else {
      console.error('Le formulaire est introuvable, veuillez le créer.');
    }
  }


}
