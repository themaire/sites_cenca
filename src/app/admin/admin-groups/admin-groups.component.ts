import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { environment } from '../../../environments/environment';

import { AdminService } from '../admin.service';
import { Groupes, Groupe } from '../admin';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ConfirmationService } from '../../shared/services/confirmation.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { AdminGroupDialogComponent } from './groupDialog/admin-group-dialog.component';

@Component({
  selector: 'app-admin-groups',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './admin-groups.component.html',
  styleUrl: './admin-groups.component.scss'
})
export class AdminGroupsComponent implements OnInit {
  groups: Groupes[] = [];
  dataSource: MatTableDataSource<Groupes> = new MatTableDataSource<Groupes>([]);
  displayedColumns: string[] = ['gro_id', 'gro_nom', 'description', 'actions'];

  selectedGroup: Groupe | null = null;
  baseUrl: string = environment.apiBaseUrl;

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private confirmationService: ConfirmationService,
    private snackBar: MatSnackBar
  ) {}

  async fetch(): Promise<Groupes[]> {
    return this.adminService.getAllGroups();
  }

  async ngOnInit(): Promise<void> {
    try {
      this.groups = await this.fetch();
      this.dataSource = new MatTableDataSource<Groupes>(this.groups);
    } catch (e) {
      console.error('Erreur lors du chargement des groupes:', e);
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openGroupDialog(row: Groupes) {
    const dialogRef = this.dialog.open(AdminGroupDialogComponent, {
      width: '840px',
      data: { gro_id: row.gro_id }
    });

    dialogRef.afterClosed().subscribe({
      next: async () => {
        // Rafraîchir la liste après fermeture du dialogue
        this.groups = await this.fetch();
        this.dataSource.data = this.groups;
      }
    });
  }

  duplicateGroupConfirm(row: Groupes): void {
    const libelle = `le groupe ${row.gro_nom} (${row.gro_id})`;
    const message = `Voulez-vous vraiment dupliquer ${libelle}?`;

    // Appel de la boîte de dialogue de confirmation
    this.confirmationService.confirm('Confirmation de duplication', message, 'duplicate', 'group').subscribe(result => {
      
      console.log('Champs à exclure de la duplication :', result);

      if (result === false) {
        // Annulation de la duplication
        return;
      }
      if (Array.isArray(result)) {
        // L'utilisateur a confirmé la duplication
        // TODO: Adapter la méthode duplicate dans AdminService pour supporter les groupes
        // this.adminService.duplicate('groups', row.gro_id, result).subscribe(success => {
        //   if (success) {
        //     // Refresh de la liste des groupes
        //     this.ngOnInit();           
        //   }
        // });
        this.snackBar.open('Duplication des groupes non implémentée côté serveur', 'Fermer', { duration: 3000 });
      }
    });
  }
}
