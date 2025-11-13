import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { environment } from '../../../environments/environment';

import { AdminServiceService } from '../admin-service.service';
import { Salaries, Salarie } from '../admin';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ConfirmationService } from '../../shared/services/confirmation.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { AdminUserDialogComponent } from './userDialog/admin-user-dialog.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  salaries: Salaries[] = [];
  dataSource: MatTableDataSource<Salaries> = new MatTableDataSource<Salaries>([]);
  displayedColumns: string[] = ['nom_complet', 'email', 'fonction', 'identifiant', 'actions'];

  selectedSalarie: Salarie | null = null;
  baseUrl: string = environment.apiBaseUrl;

  constructor(
    private adminService: AdminServiceService,
    private dialog: MatDialog,
    private confirmationService: ConfirmationService,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.salaries = await this.adminService.getAllUsers();
      this.dataSource = new MatTableDataSource<Salaries>(this.salaries);
    } catch (e) {
      console.error('Erreur lors du chargement des utilisateurs:', e);
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openUserDialog(row: Salaries) {
    this.dialog.open(AdminUserDialogComponent, {
      width: '840px',
      data: { cd_salarie: row.cd_salarie }
    });
  }

  duplicateUserConfirm(row: Salaries): void {
    const libelle = `l'utilisateur ${row.nom_complet} (${row.cd_salarie})`;
    const message = `Voulez-vous vraiment dupliquer ${libelle}?`;

    // Appel de la boîte de dialogue de confirmation
    // Le bouton dupliquer de la boite de dialogue ( result ) va appeler le service projetService.duplicate()
    this.confirmationService.confirm('Confirmation de duplication', message, 'duplicate', 'user').subscribe(result => {
      
      // La boite de dialiogue renvoie dans result : 
      // false si l'utilisateur annule la duplication
      // ou une liste des champs à exclure de la duplication si l'utilisateur confirme
      console.log('Champs à exclure de la duplication :', result);

      if (result === false) {
        // Annulation de la duplication
        // console.log('Duplication annulée par l\'utilisateur.');
        return;
      }
      if (Array.isArray(result)) { // Par exemple result peut valoir : ['dates', 'quantite']
        // L'utilisateur a confirmé la duplication
        // Utiliser le service projetService pour dupliquer l'élément
        // Ne pas oublié que l'on passe result qui est une liste des champs à exclure de la duplication ['dates', 'quantite', ...]
        this.adminService.duplicate('salaries', row.cd_salarie, result).subscribe(success => {
          if (success) {
            // Refresh de la liste des utilisateurs
            this.ngOnInit();           
          } else {
            // success === false ici si la duplication a échoué
            // On ne fait rien le service a déjà géré l'erreur en affichant un message snackbar d'erreur
          }
        });
      }
    });
  }
}
