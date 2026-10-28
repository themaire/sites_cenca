import { Component, Input, inject, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// import { ProjetVComponent } from './projetV/projetV.component';
import { ActionTravauxComponent } from './action_travaux/action_travaux.component';

import { DetailSiteProjet } from '../../site-detail';
import { ProjetLite } from './projets';
import { ProjetsAutresService } from './action-autre/projets-autres.service';
import { CREDO_NEUTRE, TYPES_SANS_CREDO, credoDuProjet, credoDuTypeProjet } from './credos-projets';
import { firstValueFrom } from 'rxjs';
import { SitesService } from '../../sites.service'; // service de données

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule, MatChipListboxChange } from '@angular/material/chips';

import {
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { LoginService } from '../../../login/login.service';

@Component({
  selector: 'app-detail-actions',
  standalone: true,
  imports: [CommonModule,
            MatDialogModule,
            MatTableModule,
            MatTooltipModule,
            MatIconModule,
            MatButtonModule,
            MatFormFieldModule,
            MatInputModule,
            MatChipsModule,
  ],
  templateUrl: './detail-actions.component.html',
  styleUrls: ['./detail-actions.component.scss', '../../../shared/form-buttons/form-buttons.component.scss']
})
export class DetailActionsComponent {
  @Input() siteDetailProjet?: DetailSiteProjet; // Le site selectionné pour voir son détail
  public projetsLite: ProjetLite[] = [];
  public dataSource!: MatTableDataSource<ProjetLite>;

  // Pour la liste des opérations : le tableau Material
  public displayedColumns: string[] = ['annee', 'responsable', 'projet', 'action', 'date_deb', 'statut',];

  // Filtre dynamique sur les valeurs uniques trouvées dans la colonne Type (action)
  filterAction: string = 'tous';

  // L'action est une chaîne du type "Famille | Sous-famille | Détail" : on ne garde que le dernier élément
  // pour réduire le nombre de valeurs distinctes affichées dans le filtre
  private getActionLastSegment(action: string): string {
    const segments = action.split('|');
    return segments[segments.length - 1].trim();
  }

  // Liste des valeurs uniques (dernier segment) de la colonne "action" présentes dans les projets
  get uniqueActionTypes(): string[] {
    const actions = (this.projetsLite || [])
      .map(projet => projet.action)
      .filter((action): action is string => !!action)
      .map(action => this.getActionLastSegment(action));
    return Array.from(new Set(actions)).sort();
  }

  // Nombre de projets pour un type d'action donné (utilisé pour l'affichage des compteurs)
  countByActionType(action: string): number {
    return (this.projetsLite || []).filter(
      projet => projet.action && this.getActionLastSegment(projet.action) === action
    ).length;
  }

  /** Crédo d'un chip : celui le plus fréquent parmi les projets ayant cette action (classe .credo-<cle>) */
  getChipCredo(action: string): string {
    const compte = new Map<string, number>();
    for (const projet of this.projetsLite) {
      if (projet.action && this.getActionLastSegment(projet.action) === action) {
        const cle = projet.credo ?? CREDO_NEUTRE.cle;
        compte.set(cle, (compte.get(cle) ?? 0) + 1);
      }
    }
    return [...compte.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? CREDO_NEUTRE.cle;
  }

  /** Classes d'une cellule : teinte du crédo du projet, en alternance pair / impair */
  classesLigne(projet: ProjetLite, index: number): string[] {
    return ['credo-' + (projet.credo ?? CREDO_NEUTRE.cle), index % 2 === 0 ? 'even-row' : 'odd-row'];
  }

  /**
   * Crédo de chaque ligne, comme dans la fiche projet : travaux → Gérer ; projet « autre » → son type,
   * ou la branche de son action pour les types NR / AUT.
   * La liste « lite » fournit typ_projet ; branche_action n'est pas encore fournie : on la déduit du libellé
   * racine de l'action via l'arbre des actions. Si typ_projet manquait, on le lit dans sites/autres.
   */
  private async affecterCredos(): Promise<void> {
    for (const projet of this.projetsLite) {
      if (projet.generation === '1_TVX') projet.credo = credoDuTypeProjet('TRV').cle;
    }
    const autres = this.projetsLite.filter(p => p.generation === '1_AUT');
    if (!autres.length) return;

    const sansType = autres.filter(p => !p.typ_projet);
    const brancheUtile = autres.some(p => !p.branche_action && (!p.typ_projet || TYPES_SANS_CREDO.includes(p.typ_projet)));
    const [projetsAutres, arbre] = await Promise.all([
      sansType.length
        ? firstValueFrom(this.projetsAutresService.getProjets({ uuid_site: this.siteDetailProjet?.uuid_espace, limite: 2000 })).catch(() => [])
        : Promise.resolve([]),
      brancheUtile ? this.projetsAutresService.getActions('AUT').catch(() => []) : Promise.resolve([]),
    ]);
    const normaliser = (texte: string) => texte.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
    const typeParProjet = new Map(projetsAutres.map(p => [p.uuid_proj.toLowerCase(), p.typ_projet]));
    const brancheParLibelle = new Map(arbre.map(a => [normaliser(a.libelle), a.cd_action]));

    for (const projet of autres) {
      const type = projet.typ_projet ?? typeParProjet.get(projet.uuid_proj?.toLowerCase());
      const branche = projet.branche_action
        ?? (projet.action ? brancheParLibelle.get(normaliser(projet.action.split('|')[0])) : undefined);
      projet.credo = credoDuProjet(type, branche).cle;
    }
  }


  // Applique le filtre sélectionné sur le tableau Material des projets
  // On lit la valeur directement depuis l'évènement du chip cliqué : combiner [(ngModel)] et (change)
  // sur mat-chip-listbox lit filterAction avant que ngModel ne l'ait mis à jour (décalage d'un clic).
  applyActionFilter(event: MatChipListboxChange): void {
    this.filterAction = event.value;
    this.dataSource.filter = this.filterAction;
  }

  research: SitesService = inject(SitesService);
  private projetsAutresService = inject(ProjetsAutresService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  constructor(
    private dialog: MatDialog,
    private overlay: Overlay,
    private loginService: LoginService
  ) {}

  get isEditAllowed(): boolean {
    return this.loginService.isEdit();
  }

  async ngOnChanges(changes: SimpleChanges){
    // Recuperer les opérations du site selectionné dans un tableau mat-table
    // Ce component est chargé en meme temps que sitesDetail.
    let subroute: string = "";
    
    if (this.siteDetailProjet !== undefined) {  // Si le site selectionné n'est pas vide
      console.log(this.siteDetailProjet);
      subroute = `projets/uuid=${this.siteDetailProjet.uuid_espace}/lite?webapp=1`; // On récupère les projets du site sélectionné
      console.log("Ouais on est dans le OnChanges 'onglet PROJETS' . UUID:" + this.siteDetailProjet["uuid_espace"]);
      
      // Chargement des données du tableau mat-table des projets du site selectionné
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

        // Configurer le filtre dynamique sur la colonne Type (action)
        this.dataSource.filterPredicate = (data: ProjetLite, filter: string) => {
          if (filter === 'tous') {
            return true;
          }
          return !!data.action && this.getActionLastSegment(data.action) === filter;
        };
        this.dataSource.filter = this.filterAction;

        // Couleurs des lignes et des chips (les lignes « autres » restent neutres jusqu'à la réponse)
        await this.affecterCredos();

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
      if(projetlite.uuid_proj !== undefined && (projetlite.generation == "1_TVX" || projetlite.generation == "1_AUT")){
        projetlite.localisation_site = this.siteDetailProjet?.localisation; // On donne la localisation du site au projetLite
        projetlite.uuid_espace = this.siteDetailProjet?.uuid_espace; // Localisation pré-remplie des opérations « autres »
        // OUVRIR LA FENETRE DE DIALOGUE
        this.openDialog(projetlite);
      }else{
        console.log("Projet non géré ( " + projetlite.generation + " ) ou pas un vrai projet passé en parametre. uuid_proj : " + projetlite.uuid_proj);
      }
    }else{
      // Si on ne fournit pas de projetLite en paramètre
      // On ouvre une fenetre de dialogue avec un formulaire vide
      this.openDialog();
    }
  }

  openDialog(projetlite?: ProjetLite): void {
    if (projetlite === undefined && !this.isEditAllowed) return;
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
        uuid_site: this.siteDetailProjet?.uuid_site,
        uuid_espace: this.siteDetailProjet?.uuid_espace,
        nom: this.siteDetailProjet?.nom,
        code: this.siteDetailProjet?.code,
      } as ProjetLite;
      
      console.log("--------------ProjetLite : ");
      console.log(projetlite);
    }
    
    // Ouverture de la fenetre de dialogue
    // tout en créant la constante dialogRef
    const dialogRef = this.dialog.open(ActionTravauxComponent, {
      data: projetlite, // <---------------- données injectée au composant ActionTravauxComponent dont l'uuid du porjet selectionné
      minWidth: '50vw',
      maxWidth: '95vw',
      height: '70vh',
      maxHeight: '90vh',
      hasBackdrop: true, // Avec fond
      backdropClass: 'custom-backdrop-neutre', // Neutre jusqu'au chargement : la fiche prend ensuite la couleur de son crédo (styles.scss)
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