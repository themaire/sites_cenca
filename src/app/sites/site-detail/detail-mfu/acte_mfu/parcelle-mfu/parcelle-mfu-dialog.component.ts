import { Component, OnInit, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { Subscription } from 'rxjs';

import { FormButtonsComponent } from '../../../../../shared/form-buttons/form-buttons.component';
import { MatDialogRef, MatDialogModule, MatDialogContent, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { Parcelle } from './parcelle';
import { ParcelleService } from './parcelle.service';
import { FormService } from '../../../../../shared/services/form.service';
import { ConfirmationService } from '../../../../../shared/services/confirmation.service';
import { SelectValue } from '../../../../../shared/interfaces/formValues';

@Component({
  selector: 'app-dialog-parcelle-mfu',
  standalone: true,
  imports: [
    FormButtonsComponent,
    CommonModule,
    FormsModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatTooltipModule,
    MatDialogContent,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
  ],
  templateUrl: './parcelle-mfu-dialog.component.html',
  styleUrl: './parcelle-mfu-dialog.component.scss'
})
export class ParcelleMfuDialogComponent implements OnInit, OnDestroy {
  
  // Use inject function for dialog data
  private readonly dialogData = inject(MAT_DIALOG_DATA);
  parcelle!: Parcelle;
  isLoading: boolean = true;
  loadingDelay: number = 400;
  
  newParcelle: boolean = false;
  isEditParcelle: boolean = false;
  
  parcelleForm!: FormGroup;
  isFormValid: boolean = false;
  initialFormValues!: FormGroup;
  // Stocker les valeurs originales (celles du début, pas celles après sauvegarde)
  originalFormValues!: any;
  private formStatusSubscription: Subscription | null = null;
  
  // Liste de sélection pour le type de propriétaire
  typeProprioList: SelectValue[] = [];

  // Cascade properties
  departements: any[] = [
    { code: '08', nom: 'Ardennes' },
    { code: '10', nom: 'Aube' },
    { code: '51', nom: 'Marne' },
    { code: '52', nom: 'Haute-Marne' }
  ];
  communes: any[] = [];
  sections: string[] = [];
  numeros: any[] = [];

  selectedDepartement: string = '';
  selectedCommune: string = '';
  selectedSection: string = '';

  isLoadingCommunes = false;
  isLoadingSections = false;
  isLoadingNumeros = false;

  get isCascadeLoading(): boolean {
    return this.isLoadingSections || this.isLoadingNumeros;
  }

  constructor(
      public formService: FormService,
      private dialogRef: MatDialogRef<ParcelleMfuDialogComponent>,
      private parcelleService: ParcelleService,
      private confirmationService: ConfirmationService,
      private cdr: ChangeDetectorRef,
      private fb: FormBuilder,
      private snackBar: MatSnackBar,
  ) {
    this.parcelle = this.dialogData;
    console.log("parcelle reçu dans le dialogue MFU :", this.parcelle);
  }


  async fetch(uuid_parcelle: string): Promise<Parcelle | null> {
    const parcelle = await this.parcelleService.getParcelleByUuid(uuid_parcelle);
    return parcelle || null;
  }

  /**
   * Charge les listes de sélection pour les champs de formulaire
   */
  async loadSelectValues() {
    // Charger les types de propriétaire
    this.formService.getSelectValues$('sites/selectvalues=sitcenca.typ_proprietaires/libelle').subscribe({
      next: (values) => {
        this.typeProprioList = values || [];
      },
      error: (err) => console.error('Erreur chargement type_proprio:', err)
    });
  }

  async ngOnInit() {
    // Charger les listes de sélection
    await this.loadSelectValues();

    // Vérifier si c'est une nouvelle parcelle ou une modification
    if (!this.parcelle || !this.parcelle.uuid_parcelle) {
      // Nouvelle parcelle
      console.log("Nous avons visiblement une parcelle neuve à créer.");
      try {
        this.newParcelle = true;
        this.isEditParcelle = true;
        
        // Créer le formulaire vide pour une nouvelle parcelle
        this.parcelleForm = this.formService.newParcelleForm();
        // Assigner l'acte_mfu par défaut
        if (this.parcelle && this.parcelle.acte_mfu) {
          this.parcelleForm.patchValue({
            acte_mfu: this.parcelle.acte_mfu
          });
        }
        
        this.initialFormValues = JSON.parse(JSON.stringify(this.parcelleForm.getRawValue()));
        
        // Stocker les valeurs originales pour la détection de changements
        this.originalFormValues = JSON.parse(JSON.stringify(this.parcelleForm.getRawValue()));
        
        this.isLoading = false;
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Erreur lors de la création du formulaire de la nouvelle parcelle.', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    } else {
      // Modification d'une parcelle existante
      try {
        setTimeout(async () => {
          console.log("UUID de la parcelle à charger :", this.parcelle.uuid_parcelle);
          const result = await this.fetch(this.parcelle.uuid_parcelle);
          if (result) {
            this.parcelle = result;
          }

          console.log('Parcelle complète après extraction :', this.parcelle);

          // Initialiser le formulaire avec les données chargées
          this.parcelleForm = this.formService.newParcelleForm(this.parcelle);
          
          // Enable temporairement pour capturer les valeurs des contrôles disabled
          this.parcelleForm.get('validite')?.enable();
          
          // Précharger la cascade avant de capturer les valeurs initiales
          await this.loadCascadeForEdit(this.parcelle);
          
          // Créer une copie profonde des valeurs initiales pour la restauration (inclut les contrôles disabled)
          this.initialFormValues = JSON.parse(JSON.stringify(this.parcelleForm.getRawValue()));
          
          // Stocker les valeurs originales (ne seront jamais modifiées)
          this.originalFormValues = JSON.parse(JSON.stringify(this.parcelleForm.getRawValue()));
          
          // Désactiver à nouveau le slide toggle en mode consultation
          this.parcelleForm.get('validite')?.disable();
          
          // Mode consultation (par défaut)
          this.isEditParcelle = false;
          this.isLoading = false;
          this.cdr.detectChanges();
        }, this.loadingDelay);
      } catch (error) {
        console.error('Erreur lors de la récupération des données de la parcelle', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.formStatusSubscription) {
      this.formStatusSubscription.unsubscribe();
    }
    console.log('Destruction du composant Dialogue Parcelle MFU, on se désabonne.');
  }

  public getLibelle(cd_type: string, list: SelectValue[] | undefined): string {
    if (!list) {
      console.warn('La liste est undefined ou null dans getLibelle.');
      return '';
    }
    const libelle = list.find(type => type.cd_type === cd_type);
    return libelle ? libelle.libelle : '';
  }

  toggleEditParcelle(event?: String): void {
    // Pour une nouvelle parcelle, l'annulation ferme le dialogue sans sauvegarder
    if (this.newParcelle) {
      this.dialogRef.close();
      return;
    }

    // Pour une parcelle existante - gérer l'annulation
    if (event === 'cancel') {
      // Restaurer les valeurs ORIGINALES (celles du début, pas celles après sauvegarde)
      if (this.parcelleForm) {
        // Enable temporairement les contrôles disabled pour permettre le patch
        this.parcelleForm.get('validite')?.enable();
        
        // Restaurer les valeurs originales
        this.parcelleForm.patchValue(this.originalFormValues);
        
        this.isEditParcelle = false;
        // Désactiver le slide toggle en mode consultation
        this.parcelleForm.get('validite')?.disable();
      }
    } else {
      // Toggle normal pour l'édition (bouton crayon) - event undefined ou 'edit'
      this.isEditParcelle = !this.isEditParcelle;
      if (this.parcelleForm) {
        if (this.isEditParcelle) {
          this.parcelleForm.enable();
        } else {
          // Enable temporairement les contrôles disabled pour permettre le patch
          this.parcelleForm.get('validite')?.enable();
          
          // Restaurer les valeurs originales
          this.parcelleForm.patchValue(this.originalFormValues);
          
          // Désactiver le slide toggle en mode consultation
          this.parcelleForm.get('validite')?.disable();
        }
      }
    }
    this.cdr.detectChanges();
  }

  getInvalidFields(): string[] {
    if (this.parcelleForm) {
      return this.formService.getInvalidFields(this.parcelleForm);
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
   * Soumet le formulaire parcelle (création ou mise à jour)
   */
  onSubmit(): void {
    if (!this.parcelleForm || !this.parcelleForm.valid) {
      console.log('Formulaire invalide');
      const invalidFields = this.getInvalidFields();
      this.snackBar.open(`Formulaire invalide. Champs obligatoires manquants : ${invalidFields.join(', ')}`, 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-error'],
      });
      return;
    }

    // Vérifier si le formulaire a été modifié avant de soumettre
    const currentValues = this.parcelleForm.getRawValue();
    const hasChanges = JSON.stringify(currentValues) !== JSON.stringify(this.originalFormValues);
    
    if (!hasChanges) {
      this.snackBar.open("Aucun changement n'a été effectué, vous ne pouvez pas sauvegarder", 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-info'],
      });
      return;
    }

    const formValue = this.parcelleForm.getRawValue();
    console.log('Données du formulaire parcelle à soumettre:', formValue);

    if (this.newParcelle) {
      // Création d'une nouvelle parcelle
      this.parcelleService.insertParcelle(formValue).subscribe({
        next: (response) => {
          if (response && response.success) {
            this.snackBar.open('Parcelle créée avec succès', 'Fermer', {
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
          console.error('Erreur lors de la création de la parcelle', error);
          this.snackBar.open('Erreur lors de la création', 'Fermer', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
        }
      });
    } else {
      // Mise à jour d'une parcelle existante
      this.parcelleService.updateParcelle(this.parcelle.uuid_parcelle, formValue).subscribe({
        next: (response) => {
          if (response && response.success) {
            this.snackBar.open('Parcelle mise à jour avec succès', 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-success'],
            });
            this.isEditParcelle = false;
            // Créer une copie des valeurs pour la restauration si annulation des modifications
            this.initialFormValues = JSON.parse(JSON.stringify(this.parcelleForm.getRawValue()));
            
            // Désactiver à nouveau les slide toggles
            this.parcelleForm.get('validite')?.disable();

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
          console.error('Erreur lors de la mise à jour de la parcelle', error);
          this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', {
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
   * Charge les communes pour un département sélectionné
   */
  async onDepartementChange(deptCode: string) {
    this.selectedDepartement = deptCode;
    this.selectedCommune = '';
    this.selectedSection = '';
    this.communes = [];
    this.sections = [];
    this.numeros = [];

    if (!deptCode) return;

    this.isLoadingCommunes = true;
    try {
      this.communes = await this.parcelleService.getCommunesByDepartement(deptCode);
    } catch (error) {
      console.error('Erreur chargement communes (dialog):', error);
      this.communes = [];
    } finally {
      this.isLoadingCommunes = false;
    }
  }

  /**
   * Recharge les sections quand la commune change et trigger change detection
   */
  async onCommuneChange(communeCode: string) {
    this.selectedCommune = communeCode;
    this.selectedSection = '';
    this.sections = [];
    this.numeros = [];
    this.parcelleForm?.patchValue({ insee: communeCode, section: '', numero: null });

    if (!communeCode) return;

    this.isLoadingSections = true;
    try {
      this.sections = await this.parcelleService.getSectionsByCommune(communeCode);
      console.log('[Dialog] Sections chargées:', this.sections);
    } catch (error) {
      console.error('Erreur sections (dialog):', error);
      this.sections = [];
    } finally {
      this.isLoadingSections = false;
      this.cdr.detectChanges(); // Force l'update du template
    }
  }

  /**
   * Recharge les numéros quand la section change
   */
  async onSectionChange(section: string) {
    if (this.isCascadeLoading || !this.selectedCommune) return;

    this.selectedSection = section;
    this.numeros = [];
    this.parcelleForm?.patchValue({ section });

    if (!section) return;

    this.isLoadingNumeros = true;
    try {
      this.numeros = await this.parcelleService.getNumerosBySection(this.selectedCommune, section);
    } catch (error) {
      console.error('Erreur numéros (dialog):', error);
      this.numeros = [];
    } finally {
      this.isLoadingNumeros = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Filtre les communes en fonction de la saisie
   */
  filterCommunes(event: any): void {
    const filterValue = (event.target?.value || '').toLowerCase();
    const allCommunes = this.communes;
    // Les communes filtrées s'affichent dans l'autocomplete
    if (filterValue.length > 0) {
      // Garder la liste complète pour l'autocomplete
    }
  }

  /**
   * Précharge la cascade lors de l'édition d'une parcelle existante
   */
  private async loadCascadeForEdit(parcelle: Parcelle) {
    if (!parcelle.insee) return;

    // Extraire dept de INSEE (2 premiers chars)
    this.selectedDepartement = parcelle.insee.substring(0, 2);

    // Charger communes pour dept
    this.isLoadingCommunes = true;
    try {
      this.communes = await this.parcelleService.getCommunesByDepartement(this.selectedDepartement);
    } catch (error) {
      console.error('Chargement communes (dialog edit):', error);
      this.communes = [];
    } finally {
      this.isLoadingCommunes = false;
    }

    // Définir commune existante
    this.selectedCommune = parcelle.insee;

    // Charger sections
    this.isLoadingSections = true;
    try {
      this.sections = await this.parcelleService.getSectionsByCommune(this.selectedCommune);
      console.log('[Dialog] Sections pré-chargées:', this.sections);
    } catch (error) {
      console.error('Chargement sections (dialog edit):', error);
      this.sections = [];
    } finally {
      this.isLoadingSections = false;
    }

    // Définir section existante
    this.selectedSection = parcelle.section || '';

    // Charger numéros si section existe
    if (this.selectedSection) {
      this.isLoadingNumeros = true;
      try {
        this.numeros = await this.parcelleService.getNumerosBySection(this.selectedCommune, this.selectedSection);
      } catch (error) {
        console.error('Chargement numéros (dialog edit):', error);
        this.numeros = [];
      } finally {
        this.isLoadingNumeros = false;
      }
    }

    this.cdr.detectChanges();
  }

  /**
   * Affiche une boîte de dialogue de confirmation pour la suppression d'une parcelle.
   */
  deleteItemConfirm(): void {
    const message = `Voulez-vous vraiment supprimer cette parcelle?<br><strong>${this.parcelle.code_parcelle || 'Cette parcelle'}</strong><br>Cette action est irréversible.`;
    
    // Appel de la boîte de dialogue de confirmation
    this.confirmationService.confirm('Confirmation de suppression', message, 'delete').subscribe(result => {
      if (result) {
        // L'utilisateur a confirmé la suppression
        this.parcelleService.deleteParcelle(this.parcelle.uuid_parcelle).subscribe({
          next: (response) => {
            if (response && response.success) {
              this.snackBar.open('Parcelle supprimée avec succès', 'Fermer', {
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
            console.error('Erreur lors de la suppression de la parcelle', error);
            this.snackBar.open('Erreur lors de la suppression', 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-error'],
            });
          }
        });
      }
    });
  }

  /**
   * Génère le nom d'affichage pour la parcelle
   */
  getParcelleDisplayName(): string {
    if (this.parcelle && this.parcelle.code_parcelle) {
      return this.parcelle.code_parcelle;
    }
    if (this.parcelle) {
      const parts = [];
      if (this.parcelle.prefix) parts.push(this.parcelle.prefix);
      if (this.parcelle.section) parts.push(this.parcelle.section);
      if (this.parcelle.numero) parts.push(this.parcelle.numero);
      return parts.length > 0 ? parts.join(' ') : 'Nouvelle parcelle';
    }
    return 'Nouvelle parcelle';
  }
}

