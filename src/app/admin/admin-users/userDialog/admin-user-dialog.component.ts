import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { AdminService } from '../../admin.service';
import { FormAdmin } from '../../form-admin'
import { Salarie } from '../../admin';
import { FormService } from '../../../shared/services/form.service';
import { FormButtonsComponent } from '../../../shared/form-buttons/form-buttons.component';

@Component({
  selector: 'app-admin-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    FormButtonsComponent,
  ],
  templateUrl: './admin-user-dialog.component.html',
})
export class AdminUserDialogComponent implements OnInit {
  loading = true;
  error: string | null = null;
  user: Salarie | null = null;
  
  // Formulaire réactif
  userForm!: FormGroup;
  initialFormValues!: FormGroup; // Propriété pour stocker les valeurs initiales du formulaire principal
  
  // Flags pour FormButtonsComponent
  isEditActive: boolean = false;
  isAddActive: boolean = false;
  isFormValid: boolean = false;

  newUser: boolean = false;

  constructor(
    private adminService: AdminService,
    private formAdmin: FormAdmin,
    private dialogRef: MatDialogRef<AdminUserDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { cd_salarie: string },
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      console.log('Données reçues dans le dialog :', this.data);
      // cd_salarie est une chaîne (ex: 'ES', 'JD', etc.)
      const cd_salarie = String(this.data.cd_salarie);
      this.user = await this.adminService.getUserById(cd_salarie);
      
      // Créer le formulaire avec les données de l'utilisateur
      this.userForm = this.formAdmin.salarieForm(this.user || undefined);
      this.userForm.disable(); // Désactivé par défaut (mode lecture)
      
      // Créer une copie des valeurs initiales du formulaire pour la comparaison ultérieure
      this.initialFormValues = this.userForm.value;

      // S'abonner aux changements de validité du formulaire
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

    if(this.newUser){
      this.snackBar.open('Création d\'utilisateur non encore implémentée', 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-info'],
      });
    } else {
      // Effectuer la création de l'utilisateur via le service adminService
      // Nous faisons cela au travers / dans l'observable retourné par putBdd()
      const cd_salarie = this.user?.cd_salarie || '';
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

  close(): void {
    this.dialogRef.close();
  }
}
