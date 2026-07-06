import { Component, EventEmitter, Input, Output, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CustomMatPaginatorIntl } from '../../../../shared/costomMaterial/custom-matpaginator-intl';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { ChiroService } from '../../../services/chiro.service';
import { ObservationDetail, Typologies } from '../../../interfaces/observation';
import { DialogObservationComponent, DialogObservationData } from './dialog-observation/dialog-observation.component';

@Component({
  selector: 'app-onglet-observations',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatTooltipModule, MatSnackBarModule,
  ],
  templateUrl: './onglet-observations.component.html',
  styleUrl: './onglet-observations.component.scss',
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }],
})
export class OngletObservationsComponent implements AfterViewInit {
  @Input() set observations(val: ObservationDetail[]) {
    this.dataSource.data = val;
  }
  @Input() uuidReleve!: string;
  @Input() typologies?: Typologies;
  @Output() changed = new EventEmitter<void>();

  dataSource = new MatTableDataSource<ObservationDetail>();
  displayedColumns = ['espece', 'nombre', 'denombrement', 'methode', 'statut_bio', 'stade', 'sexe', 'etat_bio', 'extras', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialog: MatDialog,
    private chiroService: ChiroService,
    private confirmationService: ConfirmationService,
    private snackBar: MatSnackBar,
  ) {}

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ouvrirDialogNouveauObs() {
    this.ouvrirDialog(undefined);
  }

  ouvrirDialogEdition(obs: ObservationDetail) {
    this.ouvrirDialog(obs);
  }

  private ouvrirDialog(obs?: ObservationDetail) {
    if (!this.typologies) return;
    const data: DialogObservationData = {
      uuidReleve: this.uuidReleve,
      observation: obs,
      typologies: this.typologies,
    };
    this.dialog.open(DialogObservationComponent, {
      data,
      width: '760px',
      maxHeight: '90vh',
    }).afterClosed().subscribe(ok => {
      if (ok) this.changed.emit();
    });
  }

  supprimerObs(obs: ObservationDetail) {
    this.confirmationService.confirm(
      'Supprimer cette observation',
      `Supprimer l'observation de <strong>${obs.espece_nom || obs.cd_espece}</strong> (${obs.nombre} individu(s)) ?`,
      'delete',
    ).subscribe(ok => {
      if (!ok) return;
      this.chiroService.deleteObservation(obs.uuid_observation).subscribe({
        next: () => {
          this.snackBar.open('Observation supprimée', 'Fermer', { duration: 3000 });
          this.changed.emit();
        },
        error: (err) => {
          console.error('[OngletObs] suppression', err);
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 4000 });
        },
      });
    });
  }
}
