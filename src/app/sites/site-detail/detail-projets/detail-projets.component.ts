import { Component, Input, inject, SimpleChanges, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

// import { ProjetVComponent } from './projetV/projetV.component';
import { ProjetComponent } from './projet/projet.component';

import { DetailSiteProjet } from '../../site-detail';
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
export class DetailProjetsComponent implements OnInit {
  @Input() siteDetailProjet?: DetailSiteProjet; // Le site selectionné pour voir son détail
  public projetsLite: ProjetLite[] = [];
  public dataSource!: MatTableDataSource<ProjetLite>;
  
  // Mode de fonctionnement : 'site' (par uuid_site) ou 'search' (par critères)
  public mode: 'site' | 'search' = 'site';
  public searchParams: any = {};

  // Pour la liste des opérations : le tableau Material
  public displayedColumns: string[] = ['annee', 'responsable', 'projet', 'action', 'date_deb', 'statut',];

  research: SitesService = inject(SitesService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  constructor(
    private dialog: MatDialog,
    private overlay: Overlay,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Détecter si on est en mode recherche via les paramètres de route
    this.route.params.subscribe(params => {
      if (params['annee'] || params['responsable'] || params['statut'] || params['generation']) {
        this.mode = 'search';
        this.searchParams = {
          annee: params['annee'] || '*',
          responsable: params['responsable'] || '*',
          statut: params['statut'] || '*',
          generation: params['generation'] || '*'
        };
        this.loadProjetsFromSearch();
      }
    });
  }

  async loadProjetsFromSearch(): Promise<void> {
    try {
      // Construire la subroute avec les paramètres de recherche
      // TODO: Adapter cette route selon votre API backend
      const queryParams = new URLSearchParams();
      
      if (this.searchParams.annee !== '*') queryParams.append('annee', this.searchParams.annee);
      if (this.searchParams.responsable !== '*') queryParams.append('responsable', decodeURIComponent(this.searchParams.responsable));
      if (this.searchParams.statut !== '*') queryParams.append('statut', decodeURIComponent(this.searchParams.statut));
      if (this.searchParams.generation !== '*') queryParams.append('generation', decodeURIComponent(this.searchParams.generation));
      
      const subroute = `projets/search?${queryParams.toString()}`;
      console.log('Recherche de projets avec:', subroute);
      
      this.projetsLite = await this.research.getProjets(subroute);
      this.dataSource = new MatTableDataSource(this.projetsLite);
      
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Erreur lors de la recherche de projets', error);
    }
  }

  async ngOnChanges(changes: SimpleChanges){
    // Recuperer les opérations du site selectionné dans un tableau mat-table
    // Ce component est chargé en meme temps que sitesDetail.
    // Ne charger que si on est en mode 'site'
    if (this.mode === 'search') return;
    
    let subroute: string = "";
    
    if (this.siteDetailProjet !== undefined) {  // Si le site selectionné n'est pas vide
      console.log(this.siteDetailProjet);
      subroute = `projets/uuid=${this.siteDetailProjet.uuid_espace}/lite?`; // On récupère les projets du site selectionné
      console.log("Ouais on est dans le OnChanges 'onglet PROJETS' . UUID:" + this.siteDetailProjet["uuid_espace"]);
      
      // ChatGPT 19/07/2024
      try {
        // On récupère la liste des projets du site
        this.projetsLite = await this.research.getProjets(subroute);
        // Assure que chaque projet a un tableau 'communes'
        this.projetsLite.forEach(projet => {
          if (!Array.isArray(projet.communes)) {
            projet.communes = this.siteDetailProjet?.communes ?? [];
          }
          if (!projet.departement && this.siteDetailProjet?.code) {
            if (this.siteDetailProjet?.code.substring(0, 2) == '08') {
              projet.departement = 'Ardennes';
            } else if (this.siteDetailProjet?.code.substring(0, 2) == '10') {
              projet.departement = 'Aube';
            } else if (this.siteDetailProjet?.code.substring(0, 2) == '51') {
              projet.departement = 'Marne';
            } else if (this.siteDetailProjet?.code.substring(0, 2) == '52') {
              projet.departement = 'Haute-Marne';
            }
          }
          if (!projet.code && this.siteDetailProjet?.code) {
            projet.code = this.siteDetailProjet.code;
          }
          if (!projet.nom && this.siteDetailProjet?.nom) {
            projet.nom = this.siteDetailProjet.nom;
          }
        });

        // On ajoute le geojson du site à chaque projet
        // Car l'étape précedente ne replit pas cette information
        // this.projetsLite.forEach(projet => {
        //   if (this.inputDetail !== undefined) {
        //     projet.geojson_site = this.inputDetail.geojson;
        //   }
        // });

        // console.log('Données de projetsLite :', this.projetsLite);
        
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
        projetlite.localisation_site = this.siteDetailProjet?.localisation; // On donne la localisation du site au projetLite
        // OUVRIR LA FENETRE DE DIALOGUE
        this.openDialog(projetlite);
      }else{
        console.log("Pas un projet TRAVAUX ( " + projetlite.generation + " ) ou pas un vrai projet passé en parametre. uuid_proj : " + projetlite.uuid_proj);
      }
    }else{
      // Si on ne fournit pas de projetLite en paramètre
      // On ouvre une fenetre de dialogue avec un formulaire vide
      this.openDialog();
    }
  }

  openDialog(projetlite?: ProjetLite): void {
    // Prend un projetLite en paramètre et ouvre une fenetre de dialogue

    // Le but est de donner un projetLite à la fenetre de dialogue
    // Si le projetLite est vide alors on ouvre une fenetre de dialogue vide
    // Ce qui veut dire que l'on doit créé un projetLite vide mais qui
    // contient toutefois l'uuid du site selectionné

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
        uuid_site: this.siteDetailProjet?.uuid_site
      } as ProjetLite;
      
      console.log("--------------ProjetLite : ");
      console.log(projetlite);
    }
    
    // Ouverture de la fenetre de dialogue
    // tout en créant la constante dialogRef
    const dialogRef = this.dialog.open(ProjetComponent, {
      data: projetlite, // <---------------- données injectée au composant ProjetComponent dont l'uuid du porjet selectionné
      minWidth: '50vw',
      maxWidth: '95vw',
      height: '70vh',
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