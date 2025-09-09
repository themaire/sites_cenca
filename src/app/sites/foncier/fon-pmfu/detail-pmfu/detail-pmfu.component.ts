import {
  Component,
  Inject,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '../../../../../../node_modules/@angular/common';

import {
  MatDialogRef,
  MatDialogModule,
  MatDialogTitle,
  MatDialogContent,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { ProjetMfu, ProjetsMfu } from '../../foncier';
import { FoncierService } from '../../foncier.service';

import { SelectValue } from '../../../../shared/interfaces/formValues';
import { FormService } from '../../../../shared/services/form.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { FormButtonsComponent } from '../../../../shared/form-buttons/form-buttons.component';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { LoginService } from '../../../../login/login.service';
import { Subscription } from 'rxjs';

import {
  MatStepperModule,
  StepperOrientation,
} from '@angular/material/stepper';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import {
  MatDatepickerIntl,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import {
  MatNativeDateModule,
  MAT_DATE_LOCALE,
  DateAdapter,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';

import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import 'moment/locale/fr';

import { MatSnackBar } from '@angular/material/snack-bar'; // Importer MatSnackBar

import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';

import { DocfileService } from '../../../../shared/services/docfile.service';

import { ApiResponse } from '../../../../shared/interfaces/api';
@Component({
  selector: 'app-detail-pmfu',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatDialogContent,
    MatIconModule,
    FormButtonsComponent,
    ReactiveFormsModule,
    MatStepperModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    AsyncPipe,
    MatButtonModule,
  ],
  templateUrl: './detail-pmfu.component.html',
  styleUrl: './detail-pmfu.component.scss',
})
export class DetailPmfuComponent {
  pmfu!: ProjetMfu;
  projetLite!: ProjetsMfu;
  isLoading: boolean = true;
  loadingDelay: number = 400;
  pmfuLength!: number;

  isAddPmfu: boolean = false;
  isEditPmfu: boolean = false;
  newPmfu: boolean = false;

  pmfuForm!: FormGroup;
  initialFormValues!: FormGroup;
  docForm!: FormGroup;
  isFormValid: boolean = false;
  @ViewChild('fileInput') fileInput!: ElementRef;

  private formStatusSubscription: Subscription | null = null;

  constructor(
    public docfileService: DocfileService,
    private confirmationService: ConfirmationService,
    private formService: FormService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private foncierService: FoncierService,
    private loginService: LoginService, // Inject LoginService
    private dialog: MatDialogRef<DetailPmfuComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProjetsMfu | number // Inject MAT_DIALOG_DATA to access the passed data
  ) {
    // Données en entrée provenant de la liste simple des projets tous confondus
    console.log('Données reçues dans le composant projet :', data);
    if (typeof data === 'object') {
      this.projetLite = data as ProjetsMfu;
      console.log(
        'ProjetLite reçu dans le composant projet :',
        this.projetLite
      );
    } else if (typeof data === 'number') {
      // Dans le cas d'un projet neuf, on passe le nombre de projets existants pour créer un nouvel ID
      this.pmfuLength = data + 1 as number;
      console.log('pmfuLength dans le constructeur : ' + this.pmfuLength);
    }
  }

  toggleEditPmfu(): void {
    this.isEditPmfu = this.formService.simpleToggle(this.isEditPmfu); // Changer le mode du booleen
    this.formService.toggleFormState(
      this.pmfuForm,
      this.isEditPmfu,
      this.initialFormValues
    ); // Changer l'état du formulaire
    this.cdr.detectChanges(); // Forcer la détection des changements
  }
  onSubmit(): void {
    // Mettre à jour le formulaire
    if (!this.newPmfu) {
      console.log(
        "Modification d'un projet MFU existant. this.newPmfu = " + this.newPmfu
      );

      let pmfu_id!: number;
      if (this.projetLite.pmfu_id !== undefined) {
        pmfu_id = this.projetLite.pmfu_id;
      } else if (this.pmfuForm.get('pmfu_id') !== null) {
        pmfu_id = this.pmfu.pmfu_id;
      }
      console.log('pmfu_id dans onSubmit() : ' + pmfu_id);
      const submitObservable = this.formService.putBdd(
        'update',
        'projets_mfu',
        this.pmfuForm,
        this.isEditPmfu,
        this.snackBar,
        pmfu_id.toString(),
        this.initialFormValues
      );

      // S'abonner à l'observable
      if (submitObservable) {
        submitObservable.subscribe(
          (result) => {
            this.isEditPmfu = result.isEditMode;
            this.initialFormValues = result.formValue;
            console.log('Projet mis à jour avec succès:', result.formValue);
          },
          (error) => {
            console.error('Erreur lors de la mise à jour du formulaire', error);
          }
        );
      }
    } else if (this.newPmfu) {
      console.log(
        "Création d'un nouveau projet dans la BDD. this.newProjet = " +
          this.newPmfu
      );
      this.pmfuForm.value.pmfu_id = this.pmfuLength;
      console.log('pmfuLength dans onSubmit() : ' + this.pmfuLength);
      console.log('pmfuForm avant envoi :');
      console.log(this.pmfuForm.value);
      const submitObservable = this.formService.putBdd(
        'insert',
        'projets_mfu',
        this.pmfuForm,
        this.isEditPmfu,
        this.snackBar
      );
      this.dialog.close(); // Fermer la fenêtre de dialogue immédiatement après la soumission

      // S'abonner à l'observable
      if (submitObservable) {
        submitObservable.subscribe(
          (result) => {
            this.isEditPmfu = result.isEditMode;
            this.initialFormValues = result.formValue;
            this.newPmfu = false; // On n'est plus en mode création, donc maintenant le formulaire s'affiche normalement
            // Les steps du stepper sont affichés et apparaissent comme en mode consultation (edition)
            this.pmfu = result.formValue;
            // La liste des projets dans le composant parent sera mise à jour au moment de fermer la fenêtre de dialogue
            console.log(
              'Nouveau projet enregistré avec succès:',
              result.formValue
            );
          },
          (error) => {
            console.error('Erreur lors de la mise à jour du formulaire', error);
          }
        );
      }
    }
  }
  async fetch(pmfu_id: Number): Promise<ProjetMfu | undefined> {
    // Récupérer les données d'un projet à partir de son ID
    // @param : gestion ou autre pour que le back sache quelle table interroger
    // !! Le backend ne fera pas la meme requete SQL si on est en gestion ou autre
    // Il s'agira de deux schémas different où les données sont stockées

    const subroute = `foncier/id=${pmfu_id}/full`; // Full puisque UN SEUL projet
    console.log('subroute dans fetch : ' + subroute);
    console.log(
      "Récupération des données du projet avec l'ID du projet :" + pmfu_id
    );
    this.docForm = this.formService.newDocForm(this.projetLite?.pmfu_id);
    const pmfu = await this.foncierService.getProjetMfu(subroute);
    return pmfu as ProjetMfu; // Retourner l'objet Projet complet
  }

  async ngOnInit() {
    // Initialiser les valeurs du formulaire principal quand le composant a fini de s'initialiser

    const cd_salarie = this.loginService.user()?.cd_salarie || null; // Code salarié de l'utilisateur connecté

    // Récupérer les données d'un projet ou créer un nouveau projet
    // this.projetLite est assigné dans le constructeur et vient de data (fenetre de dialogue)
    if (this.projetLite?.pmfu_id) {
      // Quand un ID est passé en paramètre
      try {
        // Simuler un délai artificiel
        setTimeout(async () => {
          // Accéder aux données du projet (va prendre dans le schema opegerer ou opeautre)

          // Accéder données du projet
          // Assigner l'objet projet directement et forcer le type Projet
          if (this.projetLite) {
            this.pmfu = (await this.fetch(
              this.projetLite.pmfu_id
            )) as ProjetMfu;
            this.pmfuForm = this.formService.newPmfuForm(this.pmfu, this.pmfuLength); // Créer le formulaire avec les données du projet
            this.docForm = this.formService.newDocForm(this.pmfu.pmfu_id);
            console.log(this.docForm);
          } else {
            // Défini un formulaire vide pour le projet MFU
            this.pmfuForm = this.formService.newPmfuForm();
            this.docForm = this.formService.newDocForm();
            console.log(this.docForm);
          }
          // Souscrire aux changements du statut du formulaire principal (projetForm)
          this.formStatusSubscription = this.pmfuForm.statusChanges.subscribe(
            (status) => {
              this.isFormValid = this.pmfuForm.valid; // Mettre à jour isFormValid en temps réel
              // console.log('Statut du formulaire principal :', status);
              // console.log("this.isFormValid = this.projetForm.valid :");
              // console.log(this.isFormValid + " = " + this.projetForm.valid);
              // console.log("isFormValid passé à l'enfant:", this.isFormValid);
              this.cdr.detectChanges(); // Forcer la détection des changements dans le parent
            }
          );

          this.isLoading = false; // Le chargement est terminé
        }, this.loadingDelay);
      } catch (error) {
        console.error(
          'Erreur lors de la récupération des données du projet',
          error
        );
        this.isLoading = false; // Même en cas d'erreur, arrêter le spinner
        this.cdr.detectChanges();
      }
    } else {
      // Projet neuf à créer
      console.log(
        'Nous avons visiblement un projet neuf à créer. Pas de pmfu_id dans this.projetLite.'
      );
      console.log(this.projetLite);
      try {
        this.newPmfu = true;
        // Passer directement en mode edition
        this.isEditPmfu = true; // On est en mode édition

        // Créer un formulaire vide
        // Le form_group correspondant aux projet neuf à créer
        this.pmfuForm = this.formService.newPmfuForm(undefined, this.pmfuLength);

        // Le form_group correspondant aux documents
        this.docForm = this.formService.newDocForm();
        // Définir les valeurs par défaut pour créateur et responsable
        this.pmfuForm.patchValue({
          responsable: cd_salarie,
        });

        console.log(
          'Formulaire de projet créé avec succès :',
          this.pmfuForm.value
        );

        // Souscrire aux changements du statut du formulaire principal (projetForm)
        this.formStatusSubscription = this.pmfuForm.statusChanges.subscribe(
          (status) => {
            this.isFormValid = this.pmfuForm.valid; // Mettre à jour isFormValid en temps réel
            // console.log('Statut du formulaire principal :', status);
            // console.log("this.isFormValid = this.projetForm.valid :");
            // console.log(this.isFormValid + " = " + this.projetForm.valid);
            // console.log("isFormValid passé à l'enfant:", this.isFormValid);
            this.cdr.detectChanges(); // Forcer la détection des changements dans le parent
          }
        );

        this.isLoading = false; // Le chargement est terminé
      } catch (error) {
        console.error(
          'Erreur lors de la création du formulaire du nouveau projet.',
          error
        );
        this.isLoading = false; // Même en cas d'erreur, arrêter le spinner
        this.cdr.detectChanges();
      }
    }
  }
  onFileSelected(event: any, ControlName: string) {
    this.docfileService.onFileSelected(event, ControlName, this.docForm!);
    console.log(this.docForm.get('docfiles')?.value);
  }
  submitDocfile(): Observable<ApiResponse> {
    return this.docfileService.submitDocfiles(this.docForm!, this.projetLite?.pmfu_id);
  }

  hasFiles(): void {
    const v = this.docForm.value || {};
    let hasFiles = Boolean(
      v.noteBureau ||
        v.decisionBureau ||
        v.projetActe ||
        (Array.isArray(v.photosSite) && v.photosSite.length > 0)
    );
    this.docfileService.hasFiles = hasFiles;
  }
  handleDocfileSubmission() {
    this.hasFiles();
    this.docfileService.handleDocfileSubmission(this.docForm!, this.fileInput, this.projetLite?.pmfu_id ? this.pmfu.pmfu_id : this.pmfuLength);
  }
}
