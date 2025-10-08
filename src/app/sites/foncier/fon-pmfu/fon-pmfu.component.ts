<<<<<<< HEAD
import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  SimpleChanges,
  Pipe,
  PipeTransform,
} from '@angular/core';
=======
import { Component, OnInit, Input, ChangeDetectorRef, SimpleChanges } from '@angular/core';
>>>>>>> upstream/dev
// import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
<<<<<<< HEAD
import { MatFormFieldModule } from '@angular/material/form-field';
=======
>>>>>>> upstream/dev

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';

import { FoncierService } from '../foncier.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ProjetMfu, ProjetsMfu } from '../foncier';
import { DetailPmfuComponent } from './detail-pmfu/detail-pmfu.component';
import { FormService } from '../../../services/form.service';
<<<<<<< HEAD
import { ViewChild, AfterViewInit } from '@angular/core';

import { MatSort, MatSortModule } from '@angular/material/sort';
import {
  MatPaginator,
  MatPaginatorModule,
  MatPaginatorIntl,
} from '@angular/material/paginator';
import { CustomMatPaginatorIntl } from '../../../shared/costomMaterial/custom-matpaginator-intl';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlight',
  standalone: true
})
export class HighlightPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(value: string, search: string): SafeHtml {
    if (!value) return '';  //  retourne une chaîne vide si value null/undefined
    if (!search) return value;
    const regex = new RegExp(`(${search})`, 'gi');
    const result = value.replace(regex, `<span class="highlight">$1</span>`);
    return this.sanitizer.bypassSecurityTrustHtml(result);
  }
}
@Component({
  selector: 'app-fon-pmfu',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatIcon,
    MatButtonModule,
    MatTooltipModule,
    HighlightPipe
  ],
  templateUrl: './fon-pmfu.component.html',
  styleUrl: './fon-pmfu.component.scss',
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }],
})
export class FonPmfuComponent implements OnInit, AfterViewInit {
  public isAddPmfu: boolean = false;
  public isEditPmfu: boolean = false;
  public filterValue: string = '';

  pmfuLite!: ProjetsMfu[];
  pmfu?: ProjetMfu;
  displayedColumns: string[] = ['pmfu_nom', 'pmfu_responsable', 'pmfu_commune'];
  dataSource!: MatTableDataSource<ProjetsMfu>;
  pmfuForm!: FormGroup;
  initialFormValues!: FormGroup;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
=======

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
>>>>>>> upstream/dev

  constructor(
    private cdr: ChangeDetectorRef,
    private foncierService: FoncierService,
    private formService: FormService,
    private dialog: MatDialog,
    private overlay: Overlay
  ) {}
<<<<<<< HEAD
  ngAfterViewInit() {
    if (this.dataSource) {
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    }
  }
=======
>>>>>>> upstream/dev

  async ngOnInit() {
    const subroute = 'pmfu/id=0/lite';
    const data = await this.foncierService.getProjetsMfu(subroute);
<<<<<<< HEAD
    this.pmfuLite = data;
    this.initDataSource(this.pmfuLite);
    console.log('data dans ngOnInit() du component fon-pmfu : ');
    console.log(data);

    const fakeEvent = { target: { value: '' } } as unknown as Event;
    this.applyFilter(fakeEvent);
  }

=======
    console.log('data dans ngOnInit() du component fon-pmfu : ');
    console.log(data);
    this.pmfuLite = data;
    this.dataSource = new MatTableDataSource(this.pmfuLite);
  }
>>>>>>> upstream/dev
  onSelect(ProjetMfu?: ProjetMfu): void {
    if (ProjetMfu) {
      this.openDialog(ProjetMfu);
    } else {
      this.openDialog();
    }
  }

  openDialog(ProjetMfu?: ProjetMfu): void {
    // Prend un Projet MFU en paramètre et ouvre une fenetre de dialogue
<<<<<<< HEAD
=======

>>>>>>> upstream/dev
    // Le but est de donner un Projet MFU à la fenetre de dialogue
    // Si le Projet MFU est vide alors on ouvre une fenetre de dialogue vide
    // Ce qui veut dire que l'on doit créé un Projet MFU vide mais qui
    // contient toutefois l'uuid du site selectionné

    // console.log("Ouverture de la fenetre de dialogue pour le Projet MFU : ", projetlite);
    // console.log("heure minute seconde milliseconde de l'ouverture du dialogue : ", new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));

    // Ouverture de la fenetre de dialogue
    // tout en créant la constante dialogRef
<<<<<<< HEAD
    if (ProjetMfu) {
      const dialogRef = this.dialog.open(DetailPmfuComponent, {
        data: ProjetMfu, // <---------------- données injectée au composant ProjetComponent dont l'id du porjet selectionné
        width: '90vw',
        height: '85vh',
        hasBackdrop: true, // Avec fond
        backdropClass: 'custom-backdrop-gerer', // Personnalisé
        enterAnimationDuration: '400ms',
        exitAnimationDuration: '300ms',

        scrollStrategy: this.overlay.scrollStrategies.close(), // ✅ Résout le décalage du fond (ne ferme pas car scroll interne)
      });
      dialogRef.afterClosed().subscribe((result) => {
        console.log('La fenetre de dialogue vient de se fermer');
        this.ngOnChanges({}); // Mettre à jour la liste des projets (mat-table)
      });
    } else {
      const dialogRef = this.dialog.open(DetailPmfuComponent, {
        data: '', // <---------------- données injectée au composant ProjetComponent dont l'uuid du porjet selectionné
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
      dialogRef.afterClosed().subscribe((result) => {
        console.log('La fenetre de dialogue vient de se fermer');
        this.ngOnChanges({}); // Mettre à jour la liste des projets (mat-table)
      });
    }
  }

  async ngOnChanges(changes: SimpleChanges) {
    try {
      const subroute = 'pmfu/id=0/lite';
      const data = await this.foncierService.getProjetsMfu(subroute);
      this.pmfuLite = data;
      this.initDataSource(this.pmfuLite);
    } catch (error) {
      console.error('Error fetching documents', error);
    }
  }
cleanString(str: string): string {
  return str.replace(/\s+/g, ' ').trim().toLowerCase();
}

  private initDataSource(data: ProjetsMfu[]) {
    this.dataSource = new MatTableDataSource(data);
    if (this.sort) this.dataSource.sort = this.sort;
    if (this.paginator) this.dataSource.paginator = this.paginator;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'pmfu_nom':
        return item.pmfu_nom ? this.cleanString(item.pmfu_nom) : 'zzzzzz';
        case 'pmfu_responsable':
          return item.pmfu_responsable
            ? item.pmfu_responsable.toLowerCase()
            : '';
        case 'pmfu_commune':
          return item.pmfu_commune ? item.pmfu_commune.toLowerCase() : '';
        default:
          return '';
      }
    };
    if (this.filterValue) {
    // setTimeout pour s'assurer que sort/paginator sont attachés avant l'application du filtre
    setTimeout(() => {
      this.dataSource.filter = this.filterValue;
      if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
    }, 0);
  }
  }
  toggleEditPmfu(mode: string): void {
    console.log(
      "----------!!!!!!!!!!!!--------toggleEditPmfu('" +
=======
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
>>>>>>> upstream/dev
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
<<<<<<< HEAD
        "isEditExtraction apres toggleEditPmfu('" + mode + "') :",
        this.isEditPmfu
      );
    } else if (mode === 'add') {
      console.log('Appel de makeForm() pour créer un nouveau formulaire vide');
=======
        "isEditExtraction apres toggleEditOperation('" + mode + "') :",
        this.isEditPmfu
      );
    } else if (mode === 'add') {
      console.log(
        'Appel de makeOperationForm() pour créer un nouveau formulaire vide'
      );
>>>>>>> upstream/dev

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
<<<<<<< HEAD

applyFilter(event: Event | string) {
  const value =
    typeof event === 'string'
      ? event
      : (event.target as HTMLInputElement).value;

  this.filterValue = value.trim().toLowerCase();

  if (this.dataSource) {
    this.dataSource.filter = this.filterValue;
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }
}

=======
>>>>>>> upstream/dev
}
