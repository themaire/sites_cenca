import { Component, OnInit, ChangeDetectorRef, inject, signal, Input, Output, EventEmitter, OnDestroy, AfterViewInit, AfterViewChecked, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FormButtonsComponent } from '../../../../../shared/form-buttons/form-buttons.component';

import { Objectif } from './objectifs';
import { SelectValue } from '../../../../../shared/interfaces/formValues';
import { ProjetService } from '../../projets.service';
import { FormService } from '../../../../../services/form.service';
import { ApiResponse } from '../../../../../shared/interfaces/api';

import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Importer MatSnackBar

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatIconModule } from '@angular/material/icon';

import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { MatInputModule } from '@angular/material/input'; 
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatDatepickerIntl, MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';

// import { AsyncPipe } from '@angular/common';
// import { map } from 'rxjs/operators';
// import { Observable } from 'rxjs';
// import { BreakpointObserver } from '@angular/cdk/layout';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-objectif',
  standalone: true,
  imports: [
        CommonModule,
        FormButtonsComponent,
        FormsModule,
        ReactiveFormsModule,
        MatSnackBarModule,
        MatSelectModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatProgressSpinnerModule,
        MatTableModule,
        MatSlideToggleModule
        // ,AsyncPipe  // Ajouté pour le spinner
  ],
  templateUrl: './objectif.component.html',
  styleUrl: './objectif.component.scss'
})
export class ObjectifComponent {
  @Input() uuid_projet?: string; // L'identifiant du projet selectionné pour voir son/ses objectif(s)
  @Input() new_projet?: boolean; // Si projet nouvelle generation (avec webapp)
  
  // @ViewChild('addEditOperation', { static: false }) addEditOperationTemplate: any;
  // @ViewChild('listOperations', { static: false }) listOperationsTemplate: any;
  @ViewChild('matTable') table!: MatTable<Objectif>;

  private readonly _adapter = inject<DateAdapter<unknown, unknown>>(DateAdapter);
  private readonly _intl = inject(MatDatepickerIntl);
  private readonly _locale = signal(inject<unknown>(MAT_DATE_LOCALE));
  readonly dateFormatString = this._locale() === 'fr';

  isLoading: boolean = false;
  loadingDelay: number = 50;

  objectifs!: Objectif[]; // Pour la liste des objectifs : tableau material
  dataSource!: MatTableDataSource<Objectif>;
  // Pour la liste des opérations : le tableau Material
  displayedColumns: string[] = ['typ_objectif', 'attentes', 'surf_totale', 'surf_prevue'];
  objectif!: Objectif | void; // Pour les détails d'un objectif
  nbObjectifs: number = 0; // Pour le nombre d'objectifs

  // Listes de choix du formulaire
  NvEnjeux!: SelectValue[];
  selectedNvEnjeux: string = '';
  typeObjectifOpe!: SelectValue[];
  selectedtypeObjectifOpe: string = '';
  typeObjectif!: SelectValue[];
  selectedtypeObjectif: string = '';

  // Booleens d'états pour le mode d'affichage
  @Input() isEditObjectif: boolean = false;
  @Input() isAddObjectif:boolean = false;
  @Output() isEditFromObjectif = new EventEmitter<boolean>(); // Pour envoyer l'état de l'édition au parent
  @Output() isAddFromObjectif = new EventEmitter<boolean>(); // Pour envoyer l'état de l'édition au parent
  @Input() projetEditMode: boolean = false; // Savoir si le projet est en edition pour masquer les boutons  
  linearMode: boolean = true;
  selectedOperation: String | undefined;
  
  // préparation des formulaires. Soit on crée un nouveau formulaire, soit on récupère un formulaire existant
  form: FormGroup;
  @Input() ref_uuid_proj!: String; // liste d'opératons venant du parent (boite de dialogue projet) 
  initialFormValues!: FormGroup; // Propriété pour stocker les valeurs initiales du formulaire principal
  isFormValid: boolean = false;
  private formObjSubscription: Subscription | null = null;

  
  constructor(
    private cdr: ChangeDetectorRef,
    private formService: FormService,
    private fb: FormBuilder,
    private projetService: ProjetService,
    private snackBar: MatSnackBar, // Injecter MatSnackBar
    ) {
      
      // console.log("this.ref_uuid_proj venant du input :", this.ref_uuid_proj);
      this.form = fb.group({});

    }

  async ngOnInit() {
    // Remplir this.form soit vide soit avec les données passées en entrée
    // Attendre un certain temps avant de continuer
    // S'abonner aux changements du statut du formulaire principal (projetForm)
    
    console.log("Le composant objectif s'initialise..........");  
    
    // Récuperer les listes de choix
    const subrouteTypesInter = `sites/selectvalues=${'opegerer.typ_enjeux'}`;
    this.formService.getSelectValues$(subrouteTypesInter).subscribe(
      (selectValues: SelectValue[] | undefined) => {
        console.log('Liste de choix typ_enjeux récupérée avec succès :');
        console.log(selectValues);
        this.NvEnjeux = selectValues || [];
      },
      (error) => {
        console.error('Erreur lors de la récupération de la liste de choix', error);
      }
    );
    const subrouteTypeOpe = `sites/selectvalues=${'opegerer.typ_objectifope'}`;
    this.formService.getSelectValues$(subrouteTypeOpe).subscribe(
      (selectValues: SelectValue[] | undefined) => {
        console.log('Liste de choix typ_objectifs récupérée avec succès :');
        console.log(selectValues);
        this.typeObjectifOpe = selectValues || [];
      },
      (error) => {
        console.error('Erreur lors de la récupération de la liste de choix', error);
      }
    );
    const subrouteType = `sites/selectvalues=${'opegerer.typ_objectifs'}`;
    this.formService.getSelectValues$(subrouteType).subscribe(
      (selectValues: SelectValue[] | undefined) => {
        console.log('Liste de choix typ_objectifs récupérée avec succès :');
        console.log(selectValues);
        this.typeObjectif = selectValues || [];
      },
      (error) => {
        console.error('Erreur lors de la récupération de la liste de choix', error);
      }
    );

    try {
      if (this.ref_uuid_proj !== undefined) {
        // Si on a bien une uuid de projet passé en paramètre pour recuperer les opérations lite
        
        setTimeout(async () => {
          // Accéder à la liste des opérations et remplir le tableau Material des objectifs
          this.fetch();
        }, this.loadingDelay);// Fin du bloc timeout
        this.isLoading = false;  // Le chargement est terminé
      } else {
        console.error('Le composant objectif n\'a rien a faire au demarrage.');
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération des données du projet', error);
      this.isLoading = false;  // Même en cas d'erreur, arrêter le spinner
      this.cdr.detectChanges();
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
    console.log('Destruction du composant objectif');
    this.unsubForm();
  }

  getLibelle(cd_type: string, list: SelectValue[]): string {
    const libelle = this.formService.getLibelleFromCd(cd_type, list);
    return libelle;
  }

  // Désabonnement lors de la destruction du composant
  unsubForm(): void {
    if (this.formObjSubscription) {
      this.formObjSubscription.unsubscribe();
      console.log('On se désabonne.');
    }
    
  }
  
  subscribeToForm(): void {
    // Souscrire aux changements du statut du formulaire
    this.formObjSubscription = this.form.statusChanges.subscribe(status => {
      this.isFormValid = this.form ? this.form.valid : false;  // Mettre à jour isFormValid en temps réel
      console.log('Statut du formulaire principal :', status);
      console.log("this.isFormValid = this.projetForm.valid :");
      console.log(this.isFormValid + " = " + this.form.valid);
      console.log("Etat de isFormValid passé à l'enfant:", this.isFormValid);
      
      // Afficher la liste des champs invalides
      console.log('Champs invalides :', this.getInvalidFields());

      this.cdr.detectChanges();  // Forcer la détection des changements dans le parent
    });
  }
    
  toggleEditObjectif(mode: String): void {
    console.log("----------!!!!!!!!!!!!--------toggleEditObjectif('" + mode +"') dans le composant objectif");
    if (mode === 'edit') {
      this.isEditObjectif = this.formService.simpleToggle(this.isEditObjectif); // Changer le mode du booleen
      this.formService.toggleFormState(this.form, this.isEditObjectif, this.initialFormValues); // Changer l'état du formulaire
      this.isEditFromObjectif.emit(this.isEditObjectif); // Envoyer l'état de l'édition de l'objectif au parent
      
      console.log("isEditObjectif apres toggleEditObjectif('" + mode +"') :", this.isEditObjectif);
    } else if (mode === 'add') {
      console.log('Appel de makeOperationForm() pour créer un nouveau formulaire vide');
      
      if (!this.isAddObjectif) { // Création du formulaire on est pas en mode ajout
        this.makeForm({ empty: true });
      }

      this.isAddObjectif = this.formService.simpleToggle(this.isAddObjectif); // Changer le mode du booleen
      this.formService.toggleFormState(this.form, this.isAddObjectif, this.initialFormValues); // Changer l'état du formulaire
      
      this.isAddFromObjectif.emit(this.isAddObjectif); // Envoyer l'état de l'édition de l'objectif au parent
      
      console.log("isAddObjectif apres toggleEditObjectif('" + mode +"') :", this.isAddObjectif);
      
    } else {
      this.form = this.initialFormValues; // Réinitialiser le formulaire aux valeurs initiales
      this.isEditObjectif = false; // Sortir du mode édition
      this.isAddObjectif = false; // Sortir du mode ajout
      this.isEditFromObjectif.emit(this.isEditObjectif); // Envoyer l'état de l'édition de l'objectif au parent
      this.isAddFromObjectif.emit(this.isAddObjectif); // Envoyer l'état de l'édition de l'objectif au parent
      console.log("On vient de sortir du mode édition / ajout d'opération.");
    }
    this.cdr.detectChanges(); // Forcer la détection des changements
    
  }
    
  getInvalidFields(): string[] {
    // Pour le stepper et le bouton MAJ
    if (this.form !== undefined) {
      return this.formService.getInvalidFields(this.form);
    } else {
      return [];
    }
  }

  // isStepCompleted(stepIndex: number): boolean {
  //   // Pour utiliser cette méthode dans le stepper
  //   // il faut que le stepper soit en mode linear
  //   // Fonctionn comme ceci dans le html :
  //   // <mat-step [stepControl]="form" [completed]="isStepCompleted(2)">
  //   switch (stepIndex) {
  //     case 1:
  //       return this.form.get('titre')?.valid || false;
  //     case 2:
  //       // return true || false;
  //       return true;
  //     case 3:
  //       return true;
  //     case 4:
  //       return this.form.get('typ_intervention')?.valid || false;

  //     default:
  //       return false;
  //   }
  // }

  async fetch(uuid_objectif?: String): Promise<Objectif | void> {
    if (this.ref_uuid_proj !== undefined && uuid_objectif == undefined) {
      // Si on a un uuid de d'objectif passé en paramètre pour recuperer une liste d'objectifs.
      console.log("----------!!!!!!!!!!!!--------fetch() dans le composant objectif");
      const uuid = this.ref_uuid_proj;
      const subroute = `objectifs/uuid=${uuid}/lite`;
      this.projetService.getObjectifs(subroute).then(
        (objectifs) => {
          this.objectifs = objectifs;
          this.nbObjectifs = objectifs.length;
          if (Array.isArray(this.objectifs) && this.objectifs.length > 0) {
            this.dataSource = new MatTableDataSource(this.objectifs);
            this.cdr.detectChanges();
            console.log('Liste des objectifs bien mises à jour.');
          }
        }
      ).catch(
        (error) => {
          console.error('Erreur lors de la récupération des opérations', error);
        }
      );
    } else if (uuid_objectif !== undefined) {
      // Si on un uuid d'objectif passé en paramètre pour en avoir les détails complets
      console.log("----------!!!!!!!!!!!!--------fetch(" + uuid_objectif + ") dans le composant objectif");
      const subroute = `objectifs/uuid=${uuid_objectif}/full`;
      try {
        const objectif = await this.projetService.getObjectif(subroute);
        console.log('Opération avant le return de fetch() :', objectif);
        return objectif;
      } catch (error) {
        console.error("Erreur lors de la récupération de l'objectif : ", error);
      }
    } else {
      console.error('Aucun identifiant de projet ou d\'opération n\'a été trouvé.');
    }
  }
    
  async makeForm({ objectif, empty = false }: { objectif?: Objectif, empty?: boolean } = {}): Promise<void> {
    // Deux grands modes pour un objectif :
    // 1. Créer un nouveau formulaire vide si ne donne pas le parametre objectif
    // 2. Créer un formulaire avec les données

    if (this.projetEditMode){
      this.snackBar.open("Veuillez terminer l'édition du projet avant d''ouvrir un objectif", 'Fermer', { 
        duration: 3000,});
        return;
    } else {
      this.snackBar.open("Nous rentrons dans la methode makeOperationForm().", 'Fermer', { 
      duration: 3000,});
    }

    this.unsubForm(); // Se désabonner des changements du formulaire

    if (empty) {
      // Création d'un formulaire vide
      try {
        this.form = this.formService.newObjectifForm(undefined, this.ref_uuid_proj) as FormGroup;
        this.selectedNvEnjeux = '';
        this.selectedtypeObjectifOpe = '';
        this.selectedtypeObjectif = '';
        this.subscribeToForm() // S'abonner aux changements du formulaire créé juste avant
      } catch (error) {
        console.error('Erreur lors de la création du formulaire', error);
        return;
      }
    
    } else if ( objectif !== undefined ) {
      // On ouvre un objectif existante
      // Chargement d'un formulaire avec un objectif
      this.linearMode = false; // Passer en mode non linéaire du stepper
      
      console.log("Paramètre objectif passée en paramètre dans makeOperationForm :");
      console.log(objectif);
      this.objectif = objectif; // Stocker l'objectif
      try {
        // Création du formulaire avec les données de l'opération
        if (this.objectif !== undefined) {
          this.form = this.formService.newObjectifForm(this.objectif); // Remplir this.form avec notre this.objectif
          this.selectedtypeObjectif = this.objectif.typ_objectif || '';
          this.selectedtypeObjectifOpe = this.objectif.obj_ope || '';
          this.selectedNvEnjeux = this.objectif.nv_enjeux || '';
          this.subscribeToForm(); // S'abonner aux changements du formulaire créé juste avant
          this.initialFormValues = this.form.value; // Stocker les valeurs initiales du formulaire
        }

        this.toggleEditObjectif("edit")
        
        console.log("this.form après la création du formulaire :");
        console.log(this.form);
      } catch (error) {
      console.error('Erreur lors de la création du formulaire', error);
      }
      } else {
        console.error('Paramètres objectif et empty non definis.');
        return;
      }
  }
    
  onSubmit(mode?: String): void {
    // Logique de soumission du formulaire du projet
    if (this.form !== undefined) {

      // Déja, si le formulaire est valide
      if (this.form.valid) {
        console.log("----------!!!!!!!!!!!!--------onSubmit('" + mode + "') dans le composant objectif");
        console.log(this.form.value);

        // Nouvelle opération
        if (this.isAddObjectif === true){
          this.projetService.insertObjectif(this.form.value).subscribe(
            (response: ApiResponse) => {
              console.log("Enregistrement de l'opération avec succès :", response);
              this.unsubForm(); // Se désabonner des changements du formulaire
              
              
              // Afficher le message dans le Snackbar
              const message = "Objectif bien enregistré"; // Message par défaut
              
              this.snackBar.open(message, 'Fermer', {
                duration: 3000,
                panelClass: ['snackbar-success']
              });
              this.fetch();
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
          this.isAddObjectif = false; // Changer le mode du booleen
          this.isAddFromObjectif.emit(this.isAddObjectif);

        // Modification d'un objectif
        } else if (this.isEditObjectif === true) {
          console.log('Enregistrement de l\'opération en cours suite à demande de validation...');
          
          console.log('Formulaire juste avant le onUpdate :', this.form.value);
          const updateObservable = this.formService.putBdd('update', 'objectifs', this.form, this.isEditObjectif, this.snackBar, this.form.value.uuid_objectif, this.initialFormValues);
          // S'abonner à l'observable. onUpdate 

          if (updateObservable) {
            updateObservable.subscribe(
              (result) => {
                this.isEditObjectif = result.isEditMode;
                this.isEditFromObjectif.emit(this.isEditObjectif);
                
                console.log('Formulaire mis à jour avec succès:', result.formValue);
                
                // Accéder à la liste des opérations et remplir le tableau Material des objectifs
                this.objectif = undefined; // Réinitialiser l'objectif
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
}