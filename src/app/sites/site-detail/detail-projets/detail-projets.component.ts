import { Component, Input, inject, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// import { ProjetVComponent } from './projetV/projetV.component';
import { ProjetComponent } from './projet/projet.component';

import { DetailSite } from '../../site-detail';
import { ProjetLite } from './projets';
import { SitesService } from '../../sites.service'; // service de données

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

import {
  MatDialog, 
  MatDialogModule
} from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';

@Component({
  selector: 'app-detail-projets',
  standalone: true,
  imports: [CommonModule,
            MatDialogModule,
            MatTableModule, 
            MatTooltipModule, 
            MatIconModule,

            MatFormFieldModule, MatInputModule, 
  ],
  templateUrl: './detail-projets.component.html',
  styleUrls: ['./detail-projets.component.scss', '../../../shared/form-buttons/form-buttons.component.scss']
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
      subroute = `projets/uuid=${this.inputDetail.uuid_espace}/lite`;
      console.log("Ouais on est dans le OnChanges 'onglet PROJETS' . UUID:" + this.inputDetail["uuid_espace"]);
      
      // ChatGPT 19/07/2024
      try {
        // On récupère la liste des projets du site
        this.projetsLite = await this.research.getProjets(subroute);

        // On ajoute le geojson du site à chaque projet
        // Car l'étape précedente ne replit pas cette information
        this.projetsLite.forEach(projet => {
          if (this.inputDetail !== undefined) {
            projet.geojson_site = this.inputDetail.geojson;
          }
        });

        console.log('Données de projetsLite :', this.projetsLite);
        
        this.dataSource = new MatTableDataSource(this.projetsLite);

        // console.log('Données de this.Mfus après assignation :', this.actes);
        // this.cdr.detectChanges(); // Forcer la détection des changements
      } catch (error) {
        console.error('Error fetching documents', error);
      }
    }
  }

  onSelect(projetlite?: ProjetLite): void {
    // Sert à quand on clic sur une ligne du tableau pour rentrer dans le detail d'un projet.
    // L'OPERATION SELECTIONNE PAR L'UTILISATEUR dans la variable ope

    // console.log("OnSelect parametre projetLite : ", projetlite);

    if(projetlite !== undefined){
      // Ca se passe dans la vue du component dialog-operation
      if(projetlite.uuid_proj !== undefined && projetlite.generation == "1_TVX"){
        // OUVRIR LA FENETRE DE DIALOGUE
        projetlite.nom = this.inputDetail?.nom;
        this.openDialog(projetlite);
      }else{
        console.log("Pas un projet TRAVAUX ( " + projetlite.generation + " ) ou pas un vrai projet passé en parametre. uuid_proj : " + projetlite.uuid_proj);
      }
    }else{
      this.openDialog();
    }
  }

  dialog = inject(MatDialog);
  overlay = inject(Overlay);

  openDialog(projetlite?: ProjetLite): void {
    // Prend un projetLite en paramètre et ouvre une fenetre de dialogue

    // Le but est de donner un projetLite à la fenetre de dialogue
    // Si le projetLite est vide alors on ouvre une fenetre de dialogue vide
    // Ce qui veut dire que l'on doit créé un projetLite vide mais qui
    // contient l'uuid du site selectionné

    // console.log("Ouverture de la fenetre de dialogue pour le projetLite : ", projetlite);
    // console.log("heure minute seconde milliseconde de l'ouverture du dialogue : ", new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));

    
    // Si on fournit un projetLite en paramètre
    if(projetlite !== undefined){
      if(projetlite.webapp === true){
        console.log("--------------ProjetLite : ", projetlite);
        // Si c'est un projet webapp c'est a dire un projet 
        // nouvelle genetation
      }
    }else{
      // Sinon on charge un projet vide
      console.log("Charge un projet vide");
      projetlite = {
        uuid_site: this.inputDetail?.uuid_site
      } as ProjetLite;
      
      console.log("--------------ProjetLite : ");
      console.log(projetlite);
    }
    
    // Ouverture de la fenetre de dialogue
    // tout en créant la constante dialogRef
    const dialogRef = this.dialog.open(ProjetComponent, {
      data: projetlite,
      minWidth: '50vw',
      maxWidth: '95vw',
      height: '60vh',
      maxHeight: '90vh',
      hasBackdrop: true, // Avec fond
      backdropClass: 'custom-backdrop-gerer', // Personnalisé
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',

      scrollStrategy: this.overlay.scrollStrategies.close(), // ✅ Résout le décalage du fond (ne ferme pas car scroll interne)
    });

    // Préparer à l'avance quand la fenetre de dialogue se ferme
    dialogRef.afterClosed().subscribe(result => {
      console.log('La fenetre de dialogue vient de se fermer');
      this.ngOnChanges({}); // Mettre à jour la liste des projets (mat-table)
    });

  }
}