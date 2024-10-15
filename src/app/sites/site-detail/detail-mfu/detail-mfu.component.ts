import {
  Component,
  Input,
  inject,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { DetailSite } from '../../site-detail';
// import interface
import { FicheMFUlite } from './acte';
import { SitesService } from '../../sites.service'; // service de données

import { FicheMfuComponent } from './fiche-mfu/fiche-mfu.component';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-detail-mfu',
  standalone: true,
  imports: [CommonModule, FicheMfuComponent, MatTableModule],
  templateUrl: './detail-mfu.component.html',
  styleUrl: './detail-mfu.component.scss',
})
export class DetailMfuComponent {
  @Input() inputDetail?: DetailSite; // Le site selectionné pour voir son détail
  public actes: FicheMFUlite[] = [];
  // Pour la liste des sites : le tableau Material
  public dataSource!: MatTableDataSource<FicheMFUlite>;
  // Pour la liste des opérations : le tableau Material
  public displayedColumns: string[] = [
    'typ_mfu',
    'debut',
    'fin',
    'tacit_rec',
    'surface',
    'type_prop',
    'url',
  ];

  research: SitesService = inject(SitesService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  async ngOnChanges(changes: SimpleChanges) {
    // Ce component est chargé en meme temps que sitesDetail.
    let subroute: string = '';

    if (this.inputDetail !== undefined) {
      // Cas d'une recherche sur critères
      subroute = `miniacte/uuid=${this.inputDetail.uuid_site}`;
      console.log(
        "Ouais on est dans le OnChanges 'onglet MFU' . UUID:" +
          this.inputDetail['uuid_site']
      );

      // ChatGPT 19/07/2024
      try {
        // remplir notre tableau actes du site en question
        this.actes = await this.research.getMfu(subroute);
        // console.log('Données de this.actes après assignation :', this.actes);

        // remplir le tableau mat-table
        this.dataSource = new MatTableDataSource(this.actes);

        this.cdr.detectChanges(); // Forcer la détection des changements
      } catch (error) {
        console.error('Error fetching documents', error);
      }
    }
  }
  onSelect(ficheMFU: FicheMFUlite): void {
    // Sert à quand on clic sur une ligne du tableau pour rentrer dans le detail d'un projet.
    // L'OPERATION SELECTIONNE PAR L'UTILISATEUR dans la variable ope

    // Ca se passe dans la vue du component dialog-operation
    if (ficheMFU.uuid_acte !== undefined) {
      // OUVRIR LA FENETRE DE DIALOGUE
      this.openDialog(ficheMFU);
    } else {
      console.log('Pas de acte au bout : ' + ficheMFU.site);
    }
  }
  // Pour l'affichage de la fenetre de dialogue
  dialog = inject(MatDialog);

  openDialog(ficheMFU: FicheMFUlite): void {
    // // Prend un projetLite en paramètre et ouvre une fenetre de dialogue
    let dialogComponent: any;

    // if (projetlite.webapp === true) {
    //   // Si c'est un projet webapp c'est a dire un projet
    //   // nouvelle genetation

    //   // dialogComponent = ProjetVComponent;
    dialogComponent = FicheMfuComponent;
    // }
    // // else{
    // // dialogComponent = ProjetVComponent;
    // // }

    this.dialog.open( dialogComponent, 
                     {data: ficheMFU,}
    );
  }
}
