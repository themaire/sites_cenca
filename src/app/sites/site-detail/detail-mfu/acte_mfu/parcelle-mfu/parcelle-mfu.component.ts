import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';

import { Parcelle } from './parcelle';
import { ParcelleService } from './parcelle.service';
import { FormService } from '../../../../../shared/services/form.service';
import { ConfirmationService } from '../../../../../shared/services/confirmation.service';
import { SelectValue } from '../../../../../shared/interfaces/formValues';
import { ParcelleMfuDialogComponent } from './parcelle-mfu-dialog.component';
import { FormButtonsComponent } from '../../../../../shared/form-buttons/form-buttons.component';

@Component({
  selector: 'app-parcelle-mfu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatTooltipModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    FormButtonsComponent,
  ],
  templateUrl: './parcelle-mfu.component.html',
  styleUrl: './parcelle-mfu.component.scss'
})
export class ParcelleMfuComponent implements OnInit {
  @Input() uuidActe: string = '';
  @Input() isEditModeParent: boolean = false;
  @Input() showAddForm: boolean = false;
  @Output() parcellesUpdated = new EventEmitter<void>();

  private cdr = inject(ChangeDetectorRef);
  private parcelleService = inject(ParcelleService);
  private formService = inject(FormService);
  private confirmationService = inject(ConfirmationService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private overlay = inject(Overlay);

  // Données des parcelles
  parcelles: Parcelle[] = [];
  dataSource = new MatTableDataSource<Parcelle>();
  
  // Colonnes du tableau
  displayedColumns: string[] = ['insee', 'prefix', 'section', 'numero', 'surface', 'pour_partie', 'libelle_court', 'proprietaire', 'actions'];

  // État du formulaire
  isAddMode: boolean = false;
  isEditModeLocal: boolean = false;
  parcelleForm!: FormGroup;
  editingParcelle: Parcelle | null = null;
  initialFormValues: any;

  // Listes de sélection
  typeProprioList: SelectValue[] = [];

  // Loading
  isLoading: boolean = false;

  constructor() {}

  async ngOnInit() {
    // Charger les types de propriétaire
    this.loadSelectValues();
    
    // Charger les parcelles
    if (this.uuidActe) {
      await this.loadParcelles();
    }
    
    // Si showAddForm est true, démarrer directement en mode ajout
    if (this.showAddForm) {
      this.startAddMode();
    }
  }

  async loadParcelles() {
    this.isLoading = true;
    try {
      this.parcelles = await this.parcelleService.getParcellesByActe(this.uuidActe);
      this.dataSource.data = this.parcelles;
      console.log('Parcelles MFU complètes après extraction :', this.parcelles);
    } catch (error) {
      console.error('Erreur lors du chargement des parcelles:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  loadSelectValues() {
    // Charger les types de propriétaire
    this.formService.getSelectValues$('sites/selectvalues=sitcenca.typ_proprietaires').subscribe({
      next: (values) => {
        this.typeProprioList = values || [];
      },
      error: (err) => console.error('Erreur chargement type_proprio:', err)
    });
  }

  onSelectParcelles() {
    // Bascule entre afficher/masquer le formulaire d'ajout
    if (!this.isAddMode) {
      this.startAddMode();
    } else {
      this.cancelAddMode();
    }
  }

  startAddMode() {
    this.isAddMode = true;
    this.isEditModeLocal = false;
    this.editingParcelle = null;
    // Créer un nouveau formulaire vide avec l'uuid de l'acte
    this.parcelleForm = this.formService.newParcelleForm();
    this.parcelleForm.patchValue({ acte_mfu: this.uuidActe });
    this.initialFormValues = JSON.parse(JSON.stringify(this.parcelleForm.getRawValue()));
    this.cdr.detectChanges();
  }

  cancelAddMode() {
    this.isAddMode = false;
    this.parcelleForm = null!;
    this.cdr.detectChanges();
  }

  startEditMode(parcelle: Parcelle) {
    this.isEditModeLocal = true;
    this.isAddMode = false;
    this.editingParcelle = parcelle;
    
    // Créer un formulaire avec les données de la parcelle
    // Le formulaire utilise directement typ_proprietaire
    this.parcelleForm = this.formService.newParcelleForm(parcelle);
    
    this.initialFormValues = JSON.parse(JSON.stringify(this.parcelleForm.getRawValue()));
    this.cdr.detectChanges();
  }

  cancelEditMode() {
    this.isEditModeLocal = false;
    this.editingParcelle = null;
    this.parcelleForm = null!;
    this.cdr.detectChanges();
  }

  onSubmit() {
    if (!this.parcelleForm || !this.parcelleForm.valid) {
      this.snackBar.open('Formulaire invalide', 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-error'],
      });
      return;
    }

    // Vérifier si le formulaire a été modifié
    const currentValues = this.parcelleForm.getRawValue();
    const hasChanges = JSON.stringify(currentValues) !== JSON.stringify(this.initialFormValues);
    
    if (!hasChanges) {
      this.snackBar.open("Aucun changement n'a été effectué", 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-info'],
      });
      return;
    }

    const formValue = this.parcelleForm.getRawValue();
    console.log('Données de la parcelle à soumettre:', formValue);

    // Supprimer libelle et libelle_court car ces colonnes n'existent pas dans la table
    // Le formulaire utilise directement typ_proprietaire
    delete formValue.libelle;
    delete formValue.libelle_court;

    if (this.isAddMode) {
      // Création d'une nouvelle parcelle
      this.parcelleService.insertParcelle(formValue).subscribe({
        next: (response) => {
          if (response && response.success) {
            this.snackBar.open('Parcelle créée avec succès', 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-success'],
            });
            this.loadParcelles();
            this.cancelAddMode();
            this.parcellesUpdated.emit();
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
    } else if (this.isEditModeLocal && this.editingParcelle) {
      // Mise à jour d'une parcelle existante
      this.parcelleService.updateParcelle(this.editingParcelle.uuid_parcelle, formValue).subscribe({
        next: (response) => {
          if (response && response.success) {
            this.snackBar.open('Parcelle mise à jour avec succès', 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-success'],
            });
            this.loadParcelles();
            this.cancelEditMode();
            this.parcellesUpdated.emit();
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

  deleteParcelle(parcelle: Parcelle) {
    const message = `Voulez-vous vraiment supprimer cette parcelle?<br><strong>
    </strong><br>Cette action est irréversible.`;
    
    this.confirmationService.confirm('Confirmation de suppression', message, 'delete').subscribe(result => {
      if (result) {
        this.parcelleService.deleteParcelle(parcelle.uuid_parcelle).subscribe({
          next: (response) => {
            if (response && response.success) {
              this.snackBar.open('Parcelle supprimée avec succès', 'Fermer', {
                duration: 3000,
                panelClass: ['snackbar-success'],
              });
              this.loadParcelles();
              this.parcellesUpdated.emit();
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

  getLibelle(cd_type: string, list: SelectValue[] | undefined): string {
    if (!list) return '';
    const item = list.find(t => t.cd_type === cd_type);
    return item ? item.libelle : cd_type;
  }

  getTypeProprioList(): SelectValue[] {
    return this.typeProprioList;
  }

  /**
   * Gère les actions des boutons (edit, add, cancel, save)
   * @param action L'action déclenchée par le bouton
   */
  toggleEditParcelle(action: String): void {
    console.log('toggleEditParcelle action:', action);
    
    if (action === 'cancel') {
      // Annuler - revenir à la liste
      if (this.isAddMode) {
        this.cancelAddMode();
      } else if (this.isEditModeLocal) {
        this.cancelEditMode();
      }
    } else if (action === 'add') {
      // Ajouter une nouvelle parcelle
      this.startAddMode();
    } else if (action === 'edit') {
      // Modifier - déjà géré par startEditMode
    }
  }

  /**
   * Ouvre le dialogue de modification d'une parcelle
   * @param parcelle La parcelle à modifier (optionnel - si non fourni, crée une nouvelle parcelle)
   */
  openParcelleDialog(parcelle?: Parcelle): void {
    if (parcelle === undefined) {
      // Nouvelle parcelle - préparer les données de base
      console.log("Charge une parcelle vide");
      parcelle = {
        uuid_parcelle: '',
        insee: '',
        prefix: '',
        section: '',
        numero: 0,
        partie: '',
        surface: 0,
        validite: 'true',
        acte_mfu: this.uuidActe,
        remarque: '',
        pour_partie: false,
        libelle_court: '',
        proprietaire: '',
        code_parcelle: ''
      } as Parcelle;
      console.log("--------------parcelle : ", parcelle);
    }

    const dialogRef = this.dialog.open(ParcelleMfuDialogComponent, {
      data: parcelle,
      minWidth: '60vw',
      maxWidth: '90vw',
      height: '85vh',
      maxHeight: '95vh',
      hasBackdrop: true,
      backdropClass: 'custom-backdrop-gerer',
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Dialog parcelle MFU fermé avec résultat:', result);
      if (result === true) {
        // Rafraîchir les parcelles après modification
        this.loadParcelles();
        this.parcellesUpdated.emit();
      }
    });
  }
}

