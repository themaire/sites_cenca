import { Component, OnInit, ChangeDetectorRef, inject, Inject, signal, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

// import { ApiResponse } from '../../../../shared/interfaces/api';
import { ProjetLite, Projet } from '../projets';
import { SelectValue } from '../../../../shared/interfaces/formValues';
import { ProjetService } from '../projets.service';
import { FormService } from '../../../../services/form.service';
import { ConfirmationService } from '../../../../services/confirmation.service';

import { DetailGestionComponent } from '../../detail-gestion/detail-gestion.component'; 
import { FormButtonsComponent } from '../../../../shared/form-buttons/form-buttons.component';

import { MatDialogRef, MatDialogModule, MatDialogTitle, MatDialogContent, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule, StepperOrientation } from '@angular/material/stepper';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';

import { MatInputModule } from '@angular/material/input'; 
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { MatDatepickerIntl, MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';

import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import 'moment/locale/fr';

import { MatSnackBar } from '@angular/material/snack-bar'; // Importer MatSnackBar

import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';

import { ObjectifComponent } from './objectif/objectif.component';
import { OperationComponent } from './operation/operation.component';
import { MapComponent } from '../../../../map/map.component';

// import { Projection } from 'leaflet';
// NE PAS oublier de décommenter la
import { Subscription } from 'rxjs';

import { LoginService } from '../../../../login/login.service';

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
    FormButtonsComponent,
    DetailGestionComponent,
    CommonModule,
    // MapComponent,
    MatSlideToggleModule,
    MatDialogModule,
    MatDialogTitle,
    MatDialogContent,
    MatIconModule,
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    AsyncPipe, // Ajouté pour le spinner
    ObjectifComponent,
    OperationComponent
],
  templateUrl: './projet.component.html',
  styleUrls: ['./projet.component.scss', '../../detail-infos/detail-infos.component.scss'], // Correct 'styleUrl' to 'styleUrls'
})
export class ProjetComponent implements OnInit, OnDestroy  { // Implements OnInit to use the lifecycle method
  private readonly _adapter = inject<DateAdapter<unknown, unknown>>(DateAdapter);
  private readonly _intl = inject(MatDatepickerIntl);
  private readonly _locale = signal(inject<unknown>(MAT_DATE_LOCALE));
  readonly dateFormatString = this._locale() === 'fr';

  projetLite: ProjetLite;
  projet!: Projet;
  isLoading: boolean = true;  // Initialisation à 'true' pour activer le spinner
  loadingDelay: number = 1000;

  objectifProjet: string = ''; // Objectif du projet provenant du composant objectif
  
  newProjet: boolean = false;
  isEditProjet: boolean = false;
  //
  isEditOperation: boolean = false; // Si on doit cacher le stepper pour voir le composant operation
  isAddOperation: boolean = false; // Si on doit cacher le stepper pour voir le composant operation
  //
  isEditObjectif: boolean = false; // Si on doit cacher le stepper pour voir le composant objectif
  isAddObjectif: boolean = false; // Si on doit cacher le stepper pour voir le composant objectif
  
  projetForm!: FormGroup;
  isFormValid: boolean = false;
  initialFormValues!: FormGroup; // Propriété pour stocker les valeurs initiales du formulaire principal
  private formStatusSubscription: Subscription | null = null;
  
  // Listes de choix du formulaire
  projectTypes!: SelectValue[];
  selectedProjetType: string = '';
  
  // projectTypes: SelectValue[] = [
  //   {value: 'TRV', viewValue: 'Travaux'},
  //   {value: 'ETU', viewValue: 'Etude scientifique'},
  //   {value: 'FON', viewValue: 'Foncier'},
  //   {value: 'PAR', viewValue: 'Partenariat et Ancrage territorial'},
  //   {value: 'SEN', viewValue: 'Sensibilisation et Communication'},
  // ];

  statusTypes: SelectValue[] = [
    {cd_type: 'En cours', libelle: 'En cours'},
    {cd_type: 'Terminé', libelle: 'Terminé'},
    {cd_type: 'Annulé', libelle: 'Annulé'},
  ];

  stepperOrientation: Observable<StepperOrientation>;
  
  constructor(
    private dialogRef: MatDialogRef<ProjetComponent>,
    private projetService: ProjetService,
    private formService: FormService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private loginService: LoginService, // Inject LoginService
    @Inject(MAT_DIALOG_DATA) public data: ProjetLite, // Inject MAT_DIALOG_DATA to access the passed data
    ) {
      // Données en entrée provenant de la liste simple des projets tous confondus
      this.projetLite = data;

      // Sert pour le stepper
      const breakpointObserver = inject(BreakpointObserver);
      this.stepperOrientation = breakpointObserver.observe('(min-width: 800px)').pipe(map(({matches}) => (matches ? 'horizontal' : 'vertical')));

      // console.log("this.projetLite dans le dialog :", this.projetLite);
    }
  
  getTypeInterv(generation: string): string {
    // Renvoie le type d'intervention en fonction de son code : "gestion" ou "autre"
    // @param : typ_interve : correspond au champ "generation" de la vue "ope.synthesesites"
    let type = '';
    if (generation === '1_TVX') {
      type = 'gestion';
    } else if (generation === '1_AUT') {
      type = 'autre';
    }
    return type;
  }

  async fetch(uuid_proj: String, type: String): Promise<Projet> {
    // Récupérer les données d'un projet à partir de son UUID
    // @param : gestion ou autre pour que le back sache quelle table interroger
    // !! Le backend ne fera pas la meme requete SQL si on est en gestion ou autre
    // Il s'agira de deux schémas different où les données sont stockées
    const subroute = `projets/uuid=${uuid_proj}/full/${type}`; // Full puisque UN SEUL projet
    console.log("Récupération des données du projet avec l'UUID du projet :" + uuid_proj);
    const projet = await this.projetService.getProjet(subroute);
    if (projet.typ_projet) this.selectedProjetType = projet.typ_projet; // Assigner le type de projet sélectionné à la variable
    return projet;
  }

  get step1Form(): FormGroup {
  return this.projetForm.get('step1') as FormGroup;
  }

  get step2Form(): FormGroup {
  return this.projetForm.get('step2') as FormGroup;
  }

  async ngOnInit() {
    // Initialiser les valeurs du formulaire principal quand le composant a fini de s'initialiser
    
    const cd_salarie = this.loginService.user()?.cd_salarie || null;

    // Récupérer les données d'un projet ou créer un nouveau projet
    // this.projetLite est assigné dans le constructeur et vient de data (fenetre de dialogue)
    if (this.projetLite?.uuid_proj) {
      // Quand un UUID est passé en paramètre
      try {
        // Simuler un délai artificiel
        setTimeout(async () => {
          // Accéder aux données du projet (va prendre dans le schema opegerer ou opeautre)
          const projetObject = await this.fetch(this.projetLite.uuid_proj, this.getTypeInterv(this.projetLite.generation));

          // Accéder données du projet
          if (projetObject.uuid_proj) {
            this.projet = projetObject; // Assigner l'objet projet directement

            console.log('Projet après extraction :', this.projet);

            // Défini un formulaire pour le projet
            this.projetForm = this.formService.newProjetForm(this.projet, undefined, this.projet.pro_webapp);

            // Souscrire aux changements du statut du formulaire principal (projetForm)
            this.formStatusSubscription = this.projetForm.statusChanges.subscribe(status => {
              this.isFormValid = this.projetForm.valid;  // Mettre à jour isFormValid en temps réel
              // console.log('Statut du formulaire principal :', status);
              // console.log("this.isFormValid = this.projetForm.valid :");
              // console.log(this.isFormValid + " = " + this.projetForm.valid);
              // console.log("isFormValid passé à l'enfant:", this.isFormValid);
              this.cdr.detectChanges();  // Forcer la détection des changements dans le parent
            });

            this.isLoading = false;  // Le chargement est terminé
            
          }
        }, this.loadingDelay);
      } catch (error) {
        console.error('Erreur lors de la récupération des données du projet', error);
        this.isLoading = false;  // Même en cas d'erreur, arrêter le spinner
        this.cdr.detectChanges();
      }
    } else {
      // Projet neuf à créer
      console.log("Nous avons visiblement un projet neuf à créer. Pas de uuid_proj dans this.projetLite.");
      console.log(this.projetLite);
      try {
        this.newProjet = true;
        // Passer directement en mode edition
        this.isEditProjet = true; // On est en mode édition
        
        // Créer un formulaire vide
        if (this.projetLite.uuid_site) {
          // Le form_group correspondant aux projet neuf à créer
          this.projetForm = this.formService.newProjetForm(undefined, this.projetLite.uuid_site, true);

          // Définir les valeurs par défaut pour créateur et responsable
          this.projetForm.patchValue({
            createur: cd_salarie,
            step1: {
              responsable: cd_salarie,
            }
          });

          console.log('Formulaire de projet créé avec succès :', this.projetForm.value);

          // Souscrire aux changements du statut du formulaire principal (projetForm)
          this.formStatusSubscription = this.projetForm.statusChanges.subscribe(status => {
            this.isFormValid = this.projetForm.valid;  // Mettre à jour isFormValid en temps réel
            // console.log('Statut du formulaire principal :', status);
            // console.log("this.isFormValid = this.projetForm.valid :");
            // console.log(this.isFormValid + " = " + this.projetForm.valid);
            // console.log("isFormValid passé à l'enfant:", this.isFormValid);
            this.cdr.detectChanges();  // Forcer la détection des changements dans le parent
          });

          this.isLoading = false;  // Le chargement est terminé
          
        }
      } catch (error) {
        console.error('Erreur lors de la création du formulaire du nouveau projet.', error);
        this.isLoading = false;  // Même en cas d'erreur, arrêter le spinner
        this.cdr.detectChanges();
      }
    }

    // Récuperer les listes de choix
    const subrouteTypes = `sites/selectvalues=${'ope.typ_projets'}`;
    this.formService.getSelectValues$(subrouteTypes).subscribe(
      (selectValues: SelectValue[] | undefined) => {
        console.log('Liste de choix type de projets récupérées avec succès :');
        
        this.projectTypes = selectValues || [];
        console.log("this.projectTypes : ");
        console.log(this.projectTypes);
      },
      (error) => {
        console.error('Erreur lors de la récupération de la liste de choix', error);
      }
    );
  }

  ngOnDestroy(): void {
    // Désabonnement lors de la destruction du composant
    if (this.formStatusSubscription) {
      this.formStatusSubscription.unsubscribe();
    }
    console.log('Destruction du composant, on se désabonne.');
  }

  // getLibelle(cd_type: string, list: SelectValue[]): string {
  //   const libelle = this.formService.getLibelleFromCd(cd_type, list);
  //   return libelle;
  // }

  public getLibelle(cd_type: string, list: SelectValue[] | undefined): string {
    if (!list) {
      console.warn('La liste est undefined ou null dans getLibelleFromCd.');
      return '';
    }
    const libelle = list.find(type => type.cd_type === cd_type);
    return libelle ? libelle.libelle : '';
  }


  // onSelect(operation: Operation): void {
  //   // Sert à quand on clic sur une ligne du tableau pour rentrer dans le detail d'un projet.
  //   // L'OPERATION SELECTIONNE PAR L'UTILISATEUR dans la variable ope

  //   // Ca se passe dans la vue du component dialog-operation
  //   if(operation.uuid_ope !== undefined){
  //     // OUVRIR LA FENETRE DE DIALOGUE
  //     this.openDialog(operation);
  //   }else{
  //     console.log("Pas de d'opération sur ce projet : " + operation.titre);
  //   }
  // }

  // // Pour l'affichage de la fenetre de dialogue
  // dialog = inject(MatDialog);
  // openDialog(operation: Operation): void {
  //   let dialogComponent: any = OperationComponent;

  //   this.dialog.open(dialogComponent, {
  //     data : operation
  //   });
  // }

  toggleEditProjet(): void {
    this.isEditProjet = this.formService.simpleToggle(this.isEditProjet); // Changer le mode du booleen
    this.formService.toggleFormState(this.projetForm, this.isEditProjet, this.initialFormValues); // Changer l'état du formulaire
    this.cdr.detectChanges(); // Forcer la détection des changements
  }

  // toggleEdit(bool: boolean, force: boolean = false): void {
  //   // Pour ajouter un projet dans le template

  //   // Logique de basculement du booleen 
  //   // Trop simple pour l'instant je garde au cas où
  //   if (!force) { // Si on force pas le changement
  //     // Inverser la valeur du booléen
  //     bool = this.formService.simpleToggle(bool);
  //   } else {
  //     // Sinon, forcer le changement de la valeur du booléen
  //     bool = force;
  //   }
  //   this.cdr.detectChanges(); // Forcer la détection des changements
  // }

  handleEditObjectifChange(isEdit: boolean): void {
    // console.log('État de l\'édition reçu du composant enfant:', isEdit);
    this.isEditOperation = isEdit;
  }

  handleAddObjectifChange(isAdd: boolean): void {
    // console.log('État de l\'ajout reçu du composant enfant:', isAdd);
    this.isAddOperation = isAdd;
  }

  handleEditOperationChange(isEdit: boolean): void {
    // console.log('État de l\'édition reçu du composant enfant:', isEdit);
    this.isEditOperation = isEdit;
  }

  handleAddOperationChange(isAdd: boolean): void {
    // console.log('État de l\'ajout reçu du composant enfant:', isAdd);
    this.isAddOperation = isAdd;
  }

  getInvalidFields(): string[] {
    return this.formService.getInvalidFields(this.projetForm);
  }


  // Désabonnement lors de la destruction du composant
  unsubForm(): void {
    if (this.formStatusSubscription) {
      this.formStatusSubscription.unsubscribe();
      console.log('On se désabonne.');
    }
    
  }

  onSubmit(): void {
    // Mettre à jour le formulaire
    console.log("Je me concentre sur ", this.projetForm.get('step1.pro_fin')?.value);

    // Formater les dates avant l'envoi au backend        
    // if (
    //   this.formService.isDateModified(this.projetForm, 'step1.pro_debut', this.projet?.pro_debut) ||
    //   this.formService.isDateModified(this.projetForm, 'step1.pro_fin', this.projet?.pro_fin)
    // ) {
    //   console.log("Une des 3 dates à été modifiée par l'utilisateur.");
    //   this.projetForm.patchValue({
    //     step1: {
    //       pro_debut: this.formService.formatDateToPostgres(this.projetForm.get('step1.pro_debut')?.value),
    //       pro_fin: this.formService.formatDateToPostgres(this.projetForm.get('step1.pro_fin')?.value),
    //     }
    //   });
    //   console.log("Formulaire patché avec les bonnes dates: ", this.projetForm.value);
    // }

    if(!this.newProjet){
      console.log("Modification d'un projet existant. this.newProjet = " + this.newProjet);
      
      let uuid_proj: string = '';
      if (this.projetLite.uuid_proj !== undefined) {
        uuid_proj = this.projetLite.uuid_proj;
      }else if (this.projetForm.get(uuid_proj) !== undefined) {
        uuid_proj = this.projet.uuid_proj;
      }

      const submitObservable = this.formService.putBdd('update', 'projets', this.projetForm, this.isEditProjet, this.snackBar, uuid_proj, this.initialFormValues);

      // S'abonner à l'observable
      if (submitObservable) {
        submitObservable.subscribe(
          (result) => {
            this.isEditProjet = result.isEditMode;
            this.initialFormValues = result.formValue;
            console.log('Projet mis à jour avec succès:', result.formValue);
          },
          (error) => {
            console.error('Erreur lors de la mise à jour du formulaire', error);
          }
        );
      }
    }else if (this.newProjet){
      console.log("Création d'un nouveau projet dans la BDD. this.newProjet = " + this.newProjet);

      const submitObservable = this.formService.putBdd('insert', 'projets', this.projetForm, this.isEditProjet, this.snackBar);
      
      // S'abonner à l'observable
      if (submitObservable) {
        submitObservable.subscribe(
          (result) => {
            this.isEditProjet = result.isEditMode;
            this.initialFormValues = result.formValue;
            this.newProjet = false; // On n'est plus en mode création, donc maintenant le formulaire s'affiche normalement
            this.projet = result.formValue;
            console.log('Nouveau projet enregistré avec succès:', result.formValue);
          },
          (error) => {
            console.error('Erreur lors de la mise à jour du formulaire', error);
          }
        );
      }
    }
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
  deleteItemConfirm(): void {
    // Fabriquer le libellé du projet
    // let libelle = '';
    // if (type == 'operation') {
    //   if (this.step1Form.get('action_2') !== undefined) {
    //     const value = this.step1Form.get('action_2')?.value;
    //     libelle = "opération de type " + this.getLibelleByCdType(
    //       value,
    //       this.operationTypesMeca,
    //       this.operationTypesPat,
    //       this.operationTypesAme,
    //       this.operationTypesHydro,
    //       this.operationTypesDech
    //     ) || "";
    //   }
    // } else if (type == 'localisation') {
    //   if (this.localisations && this.localisations.length > 0) {
    //     libelle = type;
    //   }
    // }

    // const message = `Voulez-vous vraiment supprimer cette ${libelle}?\n<strong>Cette action est irréversible.</strong>`
    const message = `Voulez-vous vraiment supprimer ce projet?\n<strong>Cette action est irréversible.</strong>`
    
    // Appel de la boîte de dialogue de confirmation
    this.confirmationService.confirm('Confirmation de suppression', message, this.dialogConfig).subscribe(result => {
      if (result) {
        // L'utilisateur a confirmé la suppression
        // Utiliser le service projetService pour supprimer l'élément
        this.projetService.deleteItem('projet', undefined, undefined, this.projet).subscribe(success => {
          if (success) {
            // success === true ici si la suppression a réussi on ferme la fenetre de dialogue
            this.isEditProjet = false;
            this.dialogRef.close(); // Ferme la boîte de dialogue
          } else {
            // success === false ici si la suppression a échoué
            // On ne fait rien le service a déjà géré l'erreur en affichant un message snackbar d'erreur
          }
        });;
      }
    });

  }

onObjectifProjetChange(obj_ope: string) {
  // Fais ce que tu veux avec le type d'objectif reçu
  this.objectifProjet = obj_ope;
  console.log('Objectif operationnel reçu du composant objectif :', obj_ope);
}

}
