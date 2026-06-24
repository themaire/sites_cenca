import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import 'moment/locale/fr';

import { AdminService } from '../../admin.service';
import { FormAdmin } from '../../form-admin'
import { FormService } from '../../../shared/services/form.service';
import { Salarie, SalarieGroupe, Groupes } from '../../admin';
import { FormButtonsComponent } from '../../../shared/form-buttons/form-buttons.component';
import { ConfirmationService } from '../../../shared/services/confirmation.service';

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
  selector: 'app-admin-user-dialog',
  standalone: true,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    provideMomentDateAdapter(),
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatDividerModule,
    MatListModule,
    ReactiveFormsModule,
    FormButtonsComponent,
  ],
  templateUrl: './admin-user-dialog.component.html',
  styleUrl: './admin-user-dialog.component.scss'
})

export class AdminUserDialogComponent implements OnInit {
  loading = true;
  error: string | null = null;
  user: Salarie | null = null;

  // Formulaire réactif
  userForm!: FormGroup;
  initialFormValues!: FormGroup;

  // Flags pour FormButtonsComponent
  isEditActive: boolean = false;
  isAddActive: boolean = false;
  isFormValid: boolean = false;

  newUser: boolean = false;

  // Gestion des groupes
  userGroups: SalarieGroupe[] = [];
  allGroups: Groupes[] = [];
  groupSelectControl = new FormControl<number | null>(null);
  groupsLoading = false;

  get availableGroups(): Groupes[] {
    const assignedIds = new Set(this.userGroups.map(g => g.gro_id));
    return this.allGroups.filter(g => !assignedIds.has(Number(g.gro_id)));
  }

  constructor(
    private adminService: AdminService,
    private confirmationService: ConfirmationService,
    private formAdmin: FormAdmin,
    private formService: FormService,
    private dialogRef: MatDialogRef<AdminUserDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { cd_salarie: string | null, isNew?: boolean },
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      if (this.data.isNew) {
        this.newUser = true;
        this.isAddActive = true;
        this.userForm = this.formAdmin.salarieForm();
        this.userForm.enable();
        this.allGroups = await this.adminService.getAllGroups();
      } else {
        const cd_salarie = String(this.data.cd_salarie);
        [this.user, this.userGroups, this.allGroups] = await Promise.all([
          this.adminService.getUserById(cd_salarie),
          this.adminService.getUserGroups(cd_salarie),
          this.adminService.getAllGroups(),
        ]);
        this.userForm = this.formAdmin.salarieForm(this.user || undefined);
        this.userForm.disable();
      }

      this.initialFormValues = this.userForm.value;
      this.userForm.statusChanges.subscribe(() => {
        this.isFormValid = this.userForm.valid;
      });
    } catch (e: any) {
      console.error(e);
      this.error = 'Impossible de charger le détail de l\'utilisateur.';
    } finally {
      this.loading = false;
    }
  }

  addGroup(): void {
    const gro_id = this.groupSelectControl.value;
    if (gro_id === null) return;

    this.groupsLoading = true;
    this.adminService.addGroupToUser(this.user!.cd_salarie, gro_id).subscribe({
      next: async (response) => {
        if (response.success) {
          this.userGroups = await this.adminService.getUserGroups(this.user!.cd_salarie);
          this.groupSelectControl.setValue(null);
        }
        this.groupsLoading = false;
      },
      error: () => { this.groupsLoading = false; }
    });
  }

  removeGroup(salgro_id: number): void {
    this.adminService.removeGroupFromUser(salgro_id).subscribe({
      next: async (response) => {
        if (response.success) {
          this.userGroups = await this.adminService.getUserGroups(this.user!.cd_salarie);
        }
      }
    });
  }

  toggleEdit(): void {
    this.isEditActive = !this.isEditActive;
    if (this.isEditActive) {
      this.userForm.enable();
    } else {
      // Annuler : recharger les valeurs initiales
      this.userForm.patchValue(this.user!);
      this.userForm.disable();
    }
  }

  onSubmit(): void {
    
    console.log("Modification d'un formulaire utilisateur :", this.userForm.value);
    console.log("this.newUser =", this.newUser);

    if (this.newUser) {
      const submitObservable = this.formAdmin.putbdd('insert', 'salaries', this.userForm, this.isAddActive, this.snackBar);
      if (submitObservable) {
        submitObservable.subscribe({
          next: () => {
            this.dialogRef.close(true);
          },
          error: (error) => {
            this.snackBar.open('Erreur lors de la création de l\'utilisateur. ' + error.message, 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-error'],
            });
          }
        });
      }
    } else {
      // Effectuer la création de l'utilisateur via le service adminService
      // Nous faisons cela au travers / dans l'observable retourné par putBdd()
      const cd_salarie = this.user?.cd_salarie || '';
      this.userForm.patchValue({
        date_embauche: this.formService.formatDateToPostgres(this.userForm.get('date_embauche')?.value),
        date_depart: this.formService.formatDateToPostgres(this.userForm.get('date_depart')?.value),
      })
      const submitObservable = this.formAdmin.putbdd('update', 'salaries', this.userForm, this.isEditActive, this.snackBar, cd_salarie, this.initialFormValues);
      
      // S'abonner à l'observable pour gérer la réponse
      if (submitObservable) {
        submitObservable.subscribe({
          next: (result) => {
            this.isEditActive = result.isEditMode;
            this.initialFormValues = result.formValue;
            this.snackBar.open('Modifications enregistrées avec succès', 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-success'],
            });
          },
          error: (error) => {
            this.snackBar.open('Erreur lors de l\'enregistrement des modifications. ' + error.message, 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-error'],
            });
          }
        });
      }
      
      this.isEditActive = false;
      this.userForm.disable();
    }
  }

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
    
    // Fabriquer le libellé de l'opération

    const libelle = "l'utilisateur " + this.user?.nom + " " + this.user?.prenom;

    const message = `Voulez-vous vraiment supprimer ${libelle}?\n<strong>Cette action est irréversible.</strong>`
    
    // Appel de la boîte de dialogue de confirmation
    // Le bouton supprimer de la boite de dialogue ( result ) va appeler le service projetService.deleteItem()
    this.confirmationService.confirm('Confirmation de suppression', message, 'delete').subscribe(result => {
      if (result) {
        // L'utilisateur a confirmé la suppression
        // Utiliser le service projetService pour supprimer l'élément
        this.adminService.deleteUser(this.user?.cd_salarie || '').subscribe(success => {
          if (success) {
            this.close();
          }
          // En cas d'erreur, le service adminService gère l'affichage du message d'erreur
        });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
