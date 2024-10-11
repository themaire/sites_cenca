import { Component, Input, inject, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// import { ProjetVComponent } from './projetV/projetV.component';
import { ProjetComponent } from './projet/projet.component';

import { DetailSite } from '../../site-detail';
import { ProjetLite } from './projets';
import { SitesService } from '../../sites.service'; // service de données

import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';

import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
} from '@angular/material/dialog';

@Component({
  selector: 'app-detail-projets',
  standalone: true,
  imports: [CommonModule,
            MatTableModule, 
            ProjetComponent,

            MatFormFieldModule, MatInputModule, 
  ],
  templateUrl: './detail-projets.component.html',
  styleUrl: './detail-projets.component.scss'
})
export class DetailProjetsComponent {
  @Input() inputDetail?: DetailSite; // Le site selectionné pour voir son détail
  public projetsLite: ProjetLite[] = [];
  public dataSource!: MatTableDataSource<ProjetLite>;

  // Pour la liste des opérations : le tableau Material
  public displayedColumns: string[] = ['responsable', 'annee', 'date_deb', 'projet', 'action', 'typ_interv', 'statut',];

  research: SitesService = inject(SitesService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  async ngOnChanges(changes: SimpleChanges){
    // Recuperer les opérations du site selectionné dans un tableau mat-table
    // Ce component est chargé en meme temps que sitesDetail.
    let subroute: string = "";
    
    if (this.inputDetail !== undefined) {  // Si le site selectionné n'est pas vide
      // Cas d'une recherche sur critères
      console.log(this.inputDetail);
      subroute = `projetslite/uuid=${this.inputDetail.uuid_espace}`;
      console.log("Ouais on est dans le OnChanges 'onglet PROJETS' . UUID:" + this.inputDetail["uuid_espace"]);
      
      // ChatGPT 19/07/2024
      try {
        this.projetsLite = await this.research.getProjets(subroute);
        this.dataSource = new MatTableDataSource(this.projetsLite);

        // console.log('Données de this.Mfus après assignation :', this.actes);
        // this.cdr.detectChanges(); // Forcer la détection des changements
      } catch (error) {
        console.error('Error fetching documents', error);
      }
    }
  }

  onSelect(projetlite: ProjetLite): void {
    // Sert à quand on clic sur une ligne du tableau pour rentrer dans le detail d'un projet.
    // L'OPERATION SELECTIONNE PAR L'UTILISATEUR dans la variable ope

    // Ca se passe dans la vue du component dialog-operation
    if(projetlite.responsable !== undefined){
      // OUVRIR LA FENETRE DE DIALOGUE
      this.openDialog(projetlite);
    }else{
      console.log("Pas de projet au bout : " + projetlite.projet);
    }
  }

  // Pour l'affichage de la fenetre de dialogue
  dialog = inject(MatDialog);

  openDialog(projetlite: ProjetLite): void {
    // Prend un projetLite en paramètre et ouvre une fenetre de dialogue
    let dialogComponent: any
    console.log("--------------ProjetLite : ", projetlite);

    if(projetlite.webapp === true){
      // Si c'est un projet webapp c'est a dire un projet 
      // nouvelle genetation

      // dialogComponent = ProjetVComponent;
      dialogComponent = ProjetComponent;
    }
    // else{
      // dialogComponent = ProjetVComponent;
    // }

    this.dialog.open(dialogComponent, {
      data : projetlite
    });

  }
}