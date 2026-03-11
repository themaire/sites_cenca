import { Component, OnInit, ChangeDetectorRef, inject, Signal, OnDestroy, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { MomentDateAdapter, provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerIntl, MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule, StepperOrientation } from '@angular/material/stepper';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';

import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';

import { FormButtonsComponent } from '../../../../shared/form-buttons/form-buttons.component';
import { MatDialogRef, MatDialogModule, MatDialogContent, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { Acte, ActeLite } from '../acte';
import { SitesService } from '../../../sites.service';
import { ActeService } from '../acte.service';
import { FormService } from '../../../../shared/services/form.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { LoginService } from '../../../../login/login.service';
import { SelectValue } from '../../../../shared/interfaces/formValues';
import { ParcelleMfuComponent } from './parcelle-mfu/parcelle-mfu.component';

import 'moment/locale/fr';

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
  selector: 'app-dialog-actes-mfu',
  standalone: true,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },

    provideMomentDateAdapter(),

    {
        provide: STEPPER_GLOBAL_OPTIONS,
        useValue: { displayDefaultIndicatorType: false },
    },
  ],

  imports: [
    FormButtonsComponent,
    CommonModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatTooltipModule,
    MatDialogContent,
    MatIconModule,
    MatStepperModule,
    MatTabsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    AsyncPipe,
    ParcelleMfuComponent,
  ],
  templateUrl: './acte-mfu.component.html',
  styleUrl: './acte-mfu.component.scss'
})
export class ActeMfuComponent implements OnInit, OnDestroy {
  
  private readonly _adapter = inject<DateAdapter<unknown, unknown>>(DateAdapter);
  private readonly _intl = inject(MatDatepickerIntl);
  private readonly _locale = signal(inject<unknown>(MAT_DATE_LOCALE));
  readonly dateFormatString = this._locale() === 'fr';

  // Use inject function for dialog data
  private readonly dialogData = inject(MAT_DIALOG_DATA);
  acteLite!: ActeLite;
  acte!: Acte;
  isLoading: boolean = true;
  loadingDelay: number = 400;
  
  newMfu: boolean = false;
  isEditMfu: boolean = false;
  isAddMfu: boolean = false;
  
  mfuForm!: FormGroup;
  isFormValid: boolean = false;
  initialFormValues!: FormGroup;
  // Stocker les valeurs originales (celles du début, pas celles après sauvegarde)
  originalFormValues!: any;
  private formStatusSubscription: Subscription | null = null;
  
  projectTypes!: SelectValue[];
  selectedMfuType: string = '';

  // Listes de sélection pour les formulaires
  typeActeList: SelectValue[] = [];
  typeProprioList: SelectValue[] = [];

  statusTypes: SelectValue[] = [
    {cd_type: 'En cours', libelle: 'En cours'},
    {cd_type: 'Terminé', libelle: 'Terminé'},
    {cd_type: 'Annulé', libelle: 'Annulé'},
  ];

  stepperOrientation: Observable<StepperOrientation>;

  constructor(
      public formService: FormService,
      private dialogRef: MatDialogRef<ActeMfuComponent>,
      private sitesService: SitesService,
      private acteService: ActeService,
      private confirmationService: ConfirmationService,
      private cdr: ChangeDetectorRef,
      private fb: FormBuilder,
      private snackBar: MatSnackBar,
      private loginService: LoginService,
      ) {
        this.acteLite = this.dialogData;
        console.log("acteLite reçu dans le composant MFU :", this.acteLite);
  
        const breakpointObserver = inject(BreakpointObserver);
        this.stepperOrientation = breakpointObserver.observe('(min-width: 800px)').pipe(map(({matches}) => (matches ? 'horizontal' : 'vertical')));
      }


  async fetch(table: 'mfu', uuid_mfu: String, type?: String): Promise<any> {
    if (table === 'mfu') {
      const subroute = `mfu/uuid=${uuid_mfu}/full`;
      const mfu = await this.sitesService.getActeFull(subroute);
      if (mfu != undefined && mfu != null) {
        return mfu;
      }
      return undefined;
    }
    return [];
  }

  /**
   * Charge les listes de sélection pour les champs de formulaire
   */
  async loadSelectValues() {
    // Charger les types d'acte
    this.formService.getSelectValues$('sites/selectvalues=sitcenca.typ_mfu').subscribe({
      next: (values) => {
        this.typeActeList = values || [];
      },
      error: (err) => console.error('Erreur chargement types_acte:', err)
    });

    // Charger les types de propriétaire
    this.formService.getSelectValues$('sites/selectvalues=sitcenca.typ_proprietaires').subscribe({
      next: (values) => {
        this.typeProprioList = values || [];
      },
      error: (err) => console.error('Erreur chargement type_proprio:', err)
    });
  }

  async ngOnInit() {
    const cd_salarie = this.loginService.user()?.cd_salarie || null;

    // Charger les listes de sélection
    await this.loadSelectValues();

    if (this.acteLite?.uuid_acte) {
      try {
        setTimeout(async () => {
          console.log("UUID de l'acte MFU à charger :", this.acteLite.uuid_acte);
          const result = await this.fetch('mfu', this.acteLite.uuid_acte);
          if (result) {
            this.acte = result;
          }

          console.log('Acte complet après extraction :', this.acte);

          // Initialiser le formulaire avec les données chargées
          this.mfuForm = this.formService.newMfuForm(this.acte)

          // Enable temporairement pour capturer les valeurs des contrôles disabled
          this.mfuForm.get('tacit_rec')?.enable();
          this.mfuForm.get('validite')?.enable();
          
          // Créer une copie profonde des valeurs initiales pour la restauration (inclut les contrôles disabled)
          this.initialFormValues = JSON.parse(JSON.stringify(this.mfuForm.getRawValue()));
          
          // Stocker les valeurs originales (ne seront jamais modifiées)
          this.originalFormValues = JSON.parse(JSON.stringify(this.mfuForm.getRawValue()));
          
          // Désactiver à nouveau les slide toggles en mode consultation
          this.mfuForm.get('tacit_rec')?.disable();
          this.mfuForm.get('validite')?.disable();
          
          // Mode consultation (par défaut)
          this.isEditMfu = false;
          this.isLoading = false;
        }, this.loadingDelay);
      } catch (error) {
        console.error('Erreur lors de la récupération des données du MFU', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    } else {
      console.log("Nous avons visiblement un MFU neuf à créer. Pas de uuid_acte dans this.acteLite.");
      console.log(this.acteLite);
      try {
        this.newMfu = true;
        this.isEditMfu = true;
        
        // Créer le formulaire vide pour un nouveau MFU
        this.mfuForm = this.formService.newMfuForm(this.acte);
        // Assigner le site, le type MFU et validite par défaut pour le nouveau formulaire
        this.mfuForm.patchValue({
          site: this.acteLite.site,
          typ_mfu: 'MFU',
          validite: true
        });
        
        // Activer les toggles pour un nouveau MFU (par défaut en mode édition)
        this.mfuForm.get('tacit_rec')?.enable();
        this.mfuForm.get('validite')?.enable();

        this.initialFormValues = this.mfuForm.getRawValue();
        
        // Stocker les valeurs originales pour la détection de changements
        this.originalFormValues = JSON.parse(JSON.stringify(this.mfuForm.getRawValue()));
        
        this.isLoading = false;
      } catch (error) {
        console.error('Erreur lors de la création du formulaire du nouveau MFU.', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }
  }

  // Méthode pour rafraîchir les données du MFU après une modification
  ngOnDestroy(): void {
    if (this.formStatusSubscription) {
      this.formStatusSubscription.unsubscribe();
    }
    console.log('Destruction du composant MFU, on se désabonne.');
  }

  public getLibelle(cd_type: string, list: SelectValue[] | undefined): string {
    if (!list) {
      console.warn('La liste est undefined ou null dans getLibelle.');
      return '';
    }
    const libelle = list.find(type => type.cd_type === cd_type);
    return libelle ? libelle.libelle : '';
  }

  toggleEditMfu(event?: String): void {
    // Pour un nouvel acte, l'annulation ferme la dialog sans sauvegarder
    if (this.newMfu) {
      this.dialogRef.close();
      return;
    }

    // Pour un acte existant - gérer l'annulation
    if (event === 'cancel') {
      // Restaurer les valeurs ORIGINALES (celles du début, pas celles après sauvegarde)
      // Ne pas désactiver le formulaire pour éviter le grisé - utiliser readonly à la place
      if (this.mfuForm) {
        // Enable temporairement les contrôles disabled pour permettre le patch
        this.mfuForm.get('tacit_rec')?.enable();
        this.mfuForm.get('validite')?.enable();
        
        // Restaurer les valeurs originales
        this.mfuForm.patchValue(this.originalFormValues);
        
        this.isEditMfu = false;
        // Désactiver le slide toggle en mode consultation
        this.mfuForm.get('tacit_rec')?.disable();
        this.mfuForm.get('validite')?.disable();
      }
      // Revenir au mode consultation sans fermer le dialogue
    } else {
      // Toggle normal pour l'édition (bouton crayon) - event undefined ou 'edit'
      this.isEditMfu = !this.isEditMfu;
      if (this.mfuForm) {
        if (this.isEditMfu) {
          this.mfuForm.enable();
        } else {
          // Enable temporairement les contrôles disabled pour permettre le patch
          this.mfuForm.get('tacit_rec')?.enable();
          this.mfuForm.get('validite')?.enable();
          
          // Restaurer les valeurs originales
          this.mfuForm.patchValue(this.originalFormValues);
          
          // Désactiver le slide toggle en mode consultation
          this.mfuForm.get('tacit_rec')?.disable();
          this.mfuForm.get('validite')?.disable();
        }
      }
    }
    this.cdr.detectChanges();
  }

  toggleAddMfu(): void {
    this.isAddMfu = this.formService.simpleToggle(this.isAddMfu);
    if (this.mfuForm) {
      this.formService.toggleFormState(this.mfuForm, this.isAddMfu, this.initialFormValues);
    }
    this.cdr.detectChanges();
  }


  getInvalidFields(): string[] {
    if (this.mfuForm) {
      return this.formService.getInvalidFields(this.mfuForm);
    }
    return [];
  }

  unsubForm(): void {
    if (this.formStatusSubscription) {
      this.formStatusSubscription.unsubscribe();
      console.log('On se désabonne.');
    }
  }

/**
   * Soumet le formulaire MFU (création ou mise à jour)
   */
  onSubmit(): void {
    if (!this.mfuForm || !this.mfuForm.valid) {
      console.log('Formulaire invalide');
      const invalidFields = this.getInvalidFields();
      this.snackBar.open(`Formulaire invalide. Champs obligatoires manquants : ${invalidFields.join(', ')}`, 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-error'],
      });
      return;
    }

    // Vérifier si le formulaire a été modifié avant de soumettre
    const currentValues = this.mfuForm.getRawValue();
    const hasChanges = JSON.stringify(currentValues) !== JSON.stringify(this.originalFormValues);
    
    if (!hasChanges) {
      this.snackBar.open("Aucun changement n'a été effectué, vous ne pouvez pas sauvegarder", 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-info'],
      });
      return;
    }

    // Formater les dates avant l'envoi au backend
    const formattedDebut = this.formService.formatDateToPostgres(this.mfuForm.get('debut')?.value);
    const formattedFin = this.formService.formatDateToPostgres(this.mfuForm.get('fin')?.value);
    
    // Patch le formulaire avec les dates formatées
    this.mfuForm.patchValue({
      debut: formattedDebut,
      fin: formattedFin
    });

    const formValue = this.mfuForm.getRawValue();
    console.log('Données du formulaire MFU à soumettre:', formValue);

    if (this.newMfu) {
      // Création d'un nouveau MFU
      this.acteService.insertActe(formValue).subscribe({
        next: (response) => {
          if (response && response.success) {
            this.snackBar.open('Acte MFU créé avec succès', 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-success'],
            });
            this.dialogRef.close(true);
          } else {
            this.snackBar.open(response?.message || 'Erreur lors de la création', 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-error'],
            });
          }
        },
        error: (error) => {
          console.error('Erreur lors de la création de l\'acte MFU', error);
          this.snackBar.open('Erreur lors de la création', 'Fermer', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
        }
      });
    } else {
      // Mise à jour d'un MFU existant
      this.acteService.updateActe(this.acteLite.uuid_acte, formValue).subscribe({
        next: (response) => {
          if (response && response.success) {
            this.snackBar.open('Acte MFU mis à jour avec succès', 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-success'],
            });
            this.isEditMfu = false;
            // Créer une copie des valeurs pour la restauration si annulation des modifications
            this.initialFormValues = JSON.parse(JSON.stringify(this.mfuForm.getRawValue()));
            
            // Désactiver à nouveau les slide toggles
            this.mfuForm.get('tacit_rec')?.disable();
            this.mfuForm.get('validite')?.disable();

            // Fermer le dialogue après la mise à jour pour rafraîchir la liste
            this.dialogRef.close(true);
          } else {
            this.snackBar.open(response?.message || 'Erreur lors de la mise à jour', 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-error'],
            });
          }
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour de l\'acte MFU', error);
          this.snackBar.open("Aucun changement n'a été effectué, vous ne pouvez pas sauvegarder", 'Fermer', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
        }
      });
    }
  }

  dialogConfig = {
    width: '580px',
    height: '220px',
    hasBackdrop: true,
    backdropClass: 'custom-backdrop-delete',
    enterAnimationDuration: '3000ms',
    exitAnimationDuration: '300ms'
  };


  /**
   * Affiche une boîte de dialogue de confirmation pour la suppression d'un acte MFU.
   */
  deleteItemConfirm(): void {
    const message = `Voulez-vous vraiment supprimer cet acte MFU?\n<strong>Cette action est irréversible.</strong>`;
    
    // Appel de la boîte de dialogue de confirmation
    this.confirmationService.confirm('Confirmation de suppression', message, 'delete').subscribe(result => {
      if (result) {
        // L'utilisateur a confirmé la suppression
        this.acteService.deleteActe(this.acteLite.uuid_acte).subscribe({
          next: (response) => {
            if (response && response.success) {
              this.snackBar.open('Acte MFU supprimé avec succès', 'Fermer', {
                duration: 3000,
                panelClass: ['snackbar-success'],
              });
              this.dialogRef.close(true); // Ferme la boîte de dialogue
            } else {
              this.snackBar.open(response?.message || 'Erreur lors de la suppression', 'Fermer', {
                duration: 3000,
                panelClass: ['snackbar-error'],
              });
            }
          },
          error: (error) => {
            console.error('Erreur lors de la suppression de l\'acte MFU', error);
            this.snackBar.open('Erreur lors de la suppression', 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-error'],
            });
          }
        });
      }
    });
  }
}

