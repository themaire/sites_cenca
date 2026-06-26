import { Component, inject, ViewChild, AfterViewInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params } from '@angular/router';

import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { CustomMatPaginatorIntl } from '../../../shared/costomMaterial/custom-matpaginator-intl';

import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';

import { ProjetTravaux } from '../travaux';
import { TravauxService } from '../travaux.service';
import { ProjetLite } from '../../site-detail/detail-projets/projets';
import { ProjetComponent } from '../../site-detail/detail-projets/projet/projet.component';

@Component({
  selector: 'app-travaux-display',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatPaginatorModule,
    MatDialogModule,
  ],
  templateUrl: './travaux-display.component.html',
  styleUrl: './travaux-display.component.scss',
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }],
})
export class TravauxDisplayComponent implements AfterViewInit {
  public projets: ProjetTravaux[] = [];
  selectedProjet?: ProjetTravaux;

  // Pour la liste des sites : le tableau Material
  public dataSource!: MatTableDataSource<ProjetTravaux>;
  public displayedColumns: string[] = [
    'annee',
    'responsable',
    'titre',
    'code_site',
    'loc',
    'nb_ope',
    'statut',
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private research: TravauxService = inject(TravauxService);

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private overlay: Overlay,
  ) {}

  ngAfterViewInit() {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  private loadSites(params: Params): void {
    const subroute =
      'criteria_travaux/' +
      params['annee'] +
      '/' +
      params['responsable'] +
      '/' +
      params['localisation']
      + '/' +
      params['statut'];
    
    this.research.getProjets(subroute).then((projetsGuetted: ProjetTravaux[]) => {
    this.projets = projetsGuetted;
    this.dataSource = new MatTableDataSource(this.projets); // Pour le filtre du tableau mat-table. Mettre une valeur dans value et dans le filtre du mat input SELECTION DES SITES
    const fakeEvent = { target: { value: '' } } as unknown as Event;
    this.applyFilter(fakeEvent);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    });
  }

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      console.log('Route param type : ' + params['localisation']);
      // console.log(this.route.params);
      this.loadSites(params);

      console.log('Tableau des projets : ');
      console.log(this.projets);
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;

    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onSelect(projet: ProjetTravaux): void {
    if (projet.uuid_proj) {
      this.openDialog(projet);
    } else {
      console.log('Pas de uuid_proj pour ouvrir le projet : ', projet);
    }
  }

  resetSelected(): void {
    this.selectedProjet = undefined;
    this.route.params.subscribe((params: Params) => {
      this.loadSites(params);
    });
  }

  openDialog(projet: ProjetTravaux): void {
    // Construit un ProjetLite minimal à partir du ProjetTravaux pour alimenter ProjetComponent
    const projetLite: ProjetLite = {
      uuid_proj: projet.uuid_proj,
      responsable: projet.responsable,
      annee: projet.annee,
      statut: projet.statut,
      generation: '1_TVX',
      pro_debut: '',
      action: '',
      typ_interv: '',
      webapp: false,
      uuid_site: '',
      geojson_site: '',
    };

    const dialogRef = this.dialog.open(ProjetComponent, {
      data: projetLite,
      minWidth: '50vw',
      maxWidth: '95vw',
      height: '70vh',
      maxHeight: '90vh',
      hasBackdrop: true,
      backdropClass: 'custom-backdrop-gerer',
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });

    dialogRef.afterClosed().subscribe(() => {
      this.route.params.subscribe((params: Params) => {
        this.loadSites(params);
      });
    });
  }
}
