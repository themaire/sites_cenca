import { Component, OnInit, Input, ChangeDetectorRef, SimpleChanges } from '@angular/core';
// import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';

import { FoncierService } from '../foncier.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ProjetMfu, ProjetsMfu } from '../foncier';
import { DetailPmfuComponent } from './detail-pmfu/detail-pmfu.component';
import { FormService } from '../../../services/form.service';

@Component({
  selector: 'app-fon-pmfu',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule],
  templateUrl: './fon-pmfu.component.html',
  styleUrl: './fon-pmfu.component.scss',
})
export class FonPmfuComponent implements OnInit {
  public isAddPmfu: boolean = false;
  public isEditPmfu: boolean = false;

  pmfuLite!: ProjetsMfu[];
  pmfu?: ProjetMfu;
  isNew: boolean = false;
  displayedColumns: string[] = [
    'pmfu_name',
    'pmfu_responsable',
    'pmfu_commune',
  ];
  dataSource!: MatTableDataSource<ProjetsMfu>;
  pmfuForm!: FormGroup;
  initialFormValues!: FormGroup;
  isFormValid: boolean = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private foncierService: FoncierService,
    private formService: FormService,
    private dialog: MatDialog,
    private overlay: Overlay
  ) {}

  async ngOnInit() {
    const subroute = 'pmfu/id=0/lite';
    const data = await this.foncierService.getProjetsMfu(subroute);
    console.log('data dans ngOnInit() du component fon-pmfu : ');
    console.log(data);
    this.pmfuLite = data;
    this.dataSource = new MatTableDataSource(this.pmfuLite);
  }
  onSelect(ProjetMfu?: ProjetMfu): void {
    if (ProjetMfu) {
      this.openDialog(ProjetMfu);
    } else {
      this.openDialog();
    }
  }

  openDialog(ProjetMfu?: ProjetMfu): void {
    // Prend un Projet MFU en paramètre et ouvre une fenetre de dialogue

    // Le but est de donner un Projet MFU à la fenetre de dialogue
    // Si le Projet MFU est vide alors on ouvre une fenetre de dialogue vide
    // Ce qui veut dire que l'on doit créé un Projet MFU vide mais qui
    // contient toutefois l'uuid du site selectionné

    // console.log("Ouverture de la fenetre de dialogue pour le Projet MFU : ", projetlite);
    // console.log("heure minute seconde milliseconde de l'ouverture du dialogue : ", new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));

    // Ouverture de la fenetre de dialogue
    // tout en créant la constante dialogRef
    const dialogRef = this.dialog.open(DetailPmfuComponent, {
      data: ProjetMfu, // <---------------- données injectée au composant ProjetComponent dont l'uuid du porjet selectionné
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
    dialogRef.afterClosed().subscribe((result) => {
      console.log('La fenetre de dialogue vient de se fermer');
      this.ngOnChanges({}); // Mettre à jour la liste des projets (mat-table)
    });
  }

  async ngOnChanges(changes: SimpleChanges) {
    // Recuperer les opérations du site selectionné dans un tableau mat-table
    // Ce component est chargé en meme temps que sitesDetail.
    let subroute: string = '';

    if (this.pmfu !== undefined) {
      // Si le site selectionné n'est pas vide
      console.log(this.pmfu);
      subroute = `pmfu/id=${this.pmfu.pmfu_id}/lite?`; // On récupère les projets du site selectionné
      console.log(
        "Ouais on est dans le OnChanges 'onglet PROJETS' . UUID:" +
          this.pmfu.pmfu_id
      );

      // ChatGPT 19/07/2024
      try {
        // On récupère la liste des projets du site
        this.pmfuLite = await this.foncierService.getProjetsMfu(subroute);
        // Assure que chaque projet a un tableau 'communes'
        // On ajoute le geojson du site à chaque projet
        // Car l'étape précedente ne replit pas cette information
        // this.projetsLite.forEach(projet => {
        //   if (this.inputDetail !== undefined) {
        //     projet.geojson_site = this.inputDetail.geojson;
        //   }
        // });
        // console.log('Données de projetsLite :', this.projetsLite);
        this.dataSource = new MatTableDataSource(this.pmfuLite);

        // console.log('Données de this.Mfus après assignation :', this.actes);
        // this.cdr.detectChanges(); // Forcer la détection des changements
      } catch (error) {
        console.error('Error fetching documents', error);
      }
    }
  }

  toggleEditPmfu(mode: string): void {
    console.log(
      "----------!!!!!!!!!!!!--------toggleEditOperation('" +
        mode +
        "') dans le composant extraction"
    );
    if (mode === 'edit') {
      this.isEditPmfu = this.formService.simpleToggle(this.isEditPmfu); // Changer le mode du booleen
      this.formService.toggleFormState(
        this.pmfuForm,
        this.isEditPmfu,
        this.initialFormValues
      ); // Changer l'état du formulaire

      console.log(
        "isEditExtraction apres toggleEditOperation('" + mode + "') :",
        this.isEditPmfu
      );
    } else if (mode === 'add') {
      console.log(
        'Appel de makeOperationForm() pour créer un nouveau formulaire vide'
      );

      if (!this.isAddPmfu) {
        // Création du formulaire on est pas en mode ajout
        this.makePmfuForm({ empty: true });
      }

      this.isAddPmfu = this.formService.simpleToggle(this.isAddPmfu); // Changer le mode du booleen
      this.formService.toggleFormState(
        this.pmfuForm,
        this.isAddPmfu,
        this.initialFormValues
      ); // Changer l'état du formulaire

      console.log(
        "isAddOperation apres toggleEditOperation('" + mode + "') :",
        this.isAddPmfu
      );
    } else {
      this.pmfuForm = this.initialFormValues; // Réinitialiser le formulaire aux valeurs initiales
      this.isEditPmfu = false; // Sortir du mode édition
      this.isAddPmfu = false; // Sortir du mode ajout
      console.log("On vient de sortir du mode édition / ajout d'opération.");
    }
    this.cdr.detectChanges(); // Forcer la détection des changements
  }
  async makePmfuForm(
    { pmfu, empty }: { pmfu?: ProjetMfu; empty?: boolean } = {
      pmfu: undefined,
      empty: false,
    }
  ): Promise<void> {
    // Deux grands modes :
    // 1. Créer un nouveau formulaire vide si ne donne PAS une operation
    // 2. Créer un formulaire avec les données d'une opération
  }
  onSubmit(mode?: String): void {
    // Logique de soumission du formulaire du projet
    if (this.pmfuForm.valid) {
      const formData = this.pmfuForm.value;
      console.log('Form data to submit:', formData);
    }
  }
}
