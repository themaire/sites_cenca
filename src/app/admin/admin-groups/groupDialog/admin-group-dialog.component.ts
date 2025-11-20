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
import { Groupe } from '../../admin';
import { FormButtonsComponent } from '../../../shared/form-buttons/form-buttons.component';
import { ConfirmationService } from '../../../shared/services/confirmation.service';

@Component({
  selector: 'app-admin-group-dialog',
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
  templateUrl: './admin-group-dialog.component.html',
  styleUrl: './admin-group-dialog.component.scss'
})
  
export class AdminGroupDialogComponent implements OnInit {
  loading = true;
  error: string | null = null;
  group: Groupe | null = null;
  
  // Formulaire réactif
  groupForm!: FormGroup;
  initialFormValues!: FormGroup;
  
  // Flags pour FormButtonsComponent
  isEditActive: boolean = false;
  isAddActive: boolean = false;
  isFormValid: boolean = false;

  newGroup: boolean = false;

  constructor(
    private adminService: AdminService,
    private confirmationService: ConfirmationService,
    private formAdmin: FormAdmin,
    private dialogRef: MatDialogRef<AdminGroupDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { gro_id: string },
  ) {}

  async ngOnInit(): Promise<void> {
    try {
    //   console.log('Données reçues dans le dialog de la fiche groupe :', this.data);
      const gro_id = String(this.data.gro_id);
      this.group = await this.adminService.getGroupById(gro_id);
      
      this.groupForm = this.formAdmin.groupForm(this.group || undefined);
      this.groupForm.disable();
      
      this.initialFormValues = this.groupForm.value;

      this.groupForm.statusChanges.subscribe(() => {
        this.isFormValid = this.groupForm.valid;
      });
      
    } catch (e: any) {
      console.error(e);
      this.error = 'Impossible de charger le détail du groupe.';
    } finally {
      this.loading = false;
    }
  }

  toggleEdit(): void {
    this.isEditActive = !this.isEditActive;
    if (this.isEditActive) {
      this.groupForm.enable();
    } else {
      this.groupForm.patchValue(this.group!);
      this.groupForm.disable();
    }
  }

  onSubmit(): void {
    
    console.log("Modification d'un formulaire utilisateur :", this.groupForm.value);
    console.log("this.newGroup =", this.newGroup);

    if(this.newGroup){
      this.snackBar.open('Création de groupe non encore implémentée', 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-info'],
      });
    } else {
      // Effectuer la création de l'utilisateur via le service adminService
      // Nous faisons cela au travers / dans l'observable retourné par putBdd()
      const gro_id = this.group?.gro_id || '';
      const submitObservable = this.formAdmin.putbdd('update', 'groupes', this.groupForm, this.isEditActive, this.snackBar, gro_id, this.initialFormValues);
      
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
      this.groupForm.disable();
    }
  }

  deleteItemConfirm(): void {
    const libelle = `le groupe ${this.group?.gro_nom}`;
    const message = `Voulez-vous vraiment supprimer ${libelle}?\n<strong>Cette action est irréversible.</strong>`;
    
    this.confirmationService.confirm('Confirmation de suppression', message, 'delete').subscribe(result => {
      if (result) {
        // TODO: Implémenter la suppression de groupe
        this.snackBar.open('Suppression des groupes non encore implémentée', 'Fermer', { duration: 3000 });
        // this.adminService.deleteGroup(this.group?.gro_id || '').subscribe(success => {
        //   if (success) {
        //     this.close();
        //   }
        // });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
