import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AdminServiceService } from '../../admin-service.service';
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
  
  // Flags pour FormButtonsComponent
  isEditActive: boolean = false;
  isAddActive: boolean = false;
  isFormValid: boolean = false;

  constructor(
    private adminService: AdminServiceService,
    private dialogRef: MatDialogRef<AdminUserDialogComponent>,
    private formService: FormService,
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
      this.userForm = this.formService.newSalarieForm(this.user || undefined);
      this.userForm.disable(); // Désactivé par défaut (mode lecture)
      
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
    if (this.userForm.valid) {
      console.log('Sauvegarde des données utilisateur :', this.userForm.value);
      // TODO: Appeler le service pour sauvegarder les modifications
      // this.adminService.updateUser(this.userForm.value).subscribe(...);
      
      this.snackBar.open('Modifications enregistrées avec succès', 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-success'],
      });
      
      this.isEditActive = false;
      this.userForm.disable();
    } else {
      this.snackBar.open('Veuillez remplir tous les champs obligatoires', 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-error'],
      });
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
