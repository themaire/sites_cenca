import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  SimpleChanges,
  Pipe,
  PipeTransform,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';

import { FoncierService } from '../foncier.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ProjetMfu, ProjetsMfu } from '../foncier';
import { Selector } from '../../../shared/interfaces/selector';
import { DetailPmfuComponent } from './detail-pmfu/detail-pmfu.component';
import { FormService } from '../../../services/form.service';
import { ViewChild, AfterViewInit } from '@angular/core';

import { MatSort, MatSortModule } from '@angular/material/sort';
import {
  MatPaginator,
  MatPaginatorModule,
  MatPaginatorIntl,
} from '@angular/material/paginator';
import { CustomMatPaginatorIntl } from '../../../shared/costomMaterial/custom-matpaginator-intl';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
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
    RouterLink,
    MatTableModule,
    MatIconModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatSelectModule,
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

  // Filtres par menus déroulants, alimentés par la route selectors_pmfu
  public selectors: Selector[] = [];
  public selectorsError: boolean = false;
  // name du sélecteur -> valeur choisie (absence de clé = "Tous")
  public selectorFilters: Record<string, string> = {};

  pmfuLite!: ProjetsMfu[];
  pmfu?: ProjetMfu;
  displayedColumns: string[] = ['pmfu_nom', 'pmfu_responsable', 'pmfu_commune_nom', 'type_acte'];
  dataSource!: MatTableDataSource<ProjetsMfu>;
  pmfuForm!: FormGroup;
  initialFormValues!: FormGroup;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private cdr: ChangeDetectorRef,
    private foncierService: FoncierService,
    private formService: FormService,
    private dialog: MatDialog,
    private overlay: Overlay
  ) {}
  
  ngAfterViewInit() {
    if (this.dataSource) {
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    }
  }

  async ngOnInit() {
    // Charger les listes de valeurs des filtres (sans bloquer l'affichage de la table)
    this.foncierService.getSelectorsPmfu()
      .then((selectors: Selector[]) => {
        const order = ['pmfu_responsable', 'pmfu_commune_nom', 'type_acte', 'statut'];
        this.selectors = selectors.slice().sort((a, b) => {
          const aIndex = order.indexOf(a.name);
          const bIndex = order.indexOf(b.name);
          const safeA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
          const safeB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
          return safeA - safeB;
        });
      })
      .catch((err) => {
        console.error('Impossible de charger les sélecteurs pmfu (selectors_pmfu)', err);
        this.selectorsError = true;
      });

    const subroute = 'pmfu/id=0/lite';
    const data = await this.foncierService.getProjetsMfu(subroute);
    this.pmfuLite = data;
    this.initDataSource(this.pmfuLite);
    console.log('data dans ngOnInit() du component fon-pmfu : ');
    console.log(data);

    const fakeEvent = { target: { value: '' } } as unknown as Event;
    this.applyFilter(fakeEvent);
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
    if (ProjetMfu) {
      const dialogRef = this.dialog.open(DetailPmfuComponent, {
        data: ProjetMfu, // <---------------- données injectée au composant ProjetComponent dont l'id du porjet selectionné
        width: '90vw',
        height: '85vh',
        hasBackdrop: true, // Avec fond
        backdropClass: 'custom-backdrop-gerer', // Personnalisé
        enterAnimationDuration: '400ms',
        exitAnimationDuration: '300ms',

        scrollStrategy: this.overlay.scrollStrategies.block(),
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

        scrollStrategy: this.overlay.scrollStrategies.block(),
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

  /** Libellé affiché pour la/les commune(s) d'un projet MFU dans la table */
  pmfuCommunesLibelle(row: ProjetsMfu): string {
    return (row.pmfu_commune_nom || []).join(', ');
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
        case 'pmfu_commune_nom':
          return this.pmfuCommunesLibelle(item).toLowerCase();
        default:
          return '';
      }
    };
    // Filtrage combiné : mots-clés ET menus déroulants.
    // Le paramètre filter de MatTableDataSource ne sert que de déclencheur,
    // les critères sont lus directement dans l'état du composant.
    this.dataSource.filterPredicate = (row: ProjetsMfu) => this.matchesFilters(row);
    // setTimeout pour s'assurer que sort/paginator sont attachés avant l'application du filtre
    setTimeout(() => this.refreshFilter(), 0);
  }

  /** Vrai si la ligne passe le filtre mots-clés ET tous les menus déroulants actifs */
  private matchesFilters(row: ProjetsMfu): boolean {
    for (const [name, selected] of Object.entries(this.selectorFilters)) {
      const rowValue = this.cleanString(String((row as any)[name] ?? ''));
      if (rowValue !== this.cleanString(selected)) return false;
    }
    if (this.filterValue) {
      const haystack = Object.values(row)
        .filter((v) => v !== null && v !== undefined)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(this.filterValue)) return false;
    }
    return true;
  }

  /**
   * Réapplique le filtrage sur la table.
   * MatTableDataSource ne filtre pas quand filter est une chaîne vide,
   * d'où le déclencheur JSON dès qu'au moins un critère est actif.
   */
  private refreshFilter(): void {
    if (!this.dataSource) return;
    const hasCriteria = !!this.filterValue || Object.keys(this.selectorFilters).length > 0;
    this.dataSource.filter = hasCriteria
      ? JSON.stringify({ kw: this.filterValue, sel: this.selectorFilters })
      : '';
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  /** Choix dans un menu déroulant de filtre ('' = Tous) */
  onSelectorChange(name: string, value: string): void {
    if (value) {
      this.selectorFilters[name] = value;
    } else {
      delete this.selectorFilters[name];
    }
    this.refreshFilter();
  }

  /** Réinitialise mots-clés et menus déroulants */
  resetFilters(input?: HTMLInputElement): void {
    this.filterValue = '';
    this.selectorFilters = {};
    if (input) input.value = '';
    this.refreshFilter();
  }

  get hasActiveFilters(): boolean {
    return !!this.filterValue || Object.keys(this.selectorFilters).length > 0;
  }

  toggleEditPmfu(mode: string): void {
    console.log(
      "----------!!!!!!!!!!!!--------toggleEditPmfu('" +
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
        "isEditExtraction apres toggleEditPmfu('" + mode + "') :",
        this.isEditPmfu
      );
    } else if (mode === 'add') {
      console.log('Appel de makeForm() pour créer un nouveau formulaire vide');

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

applyFilter(event: Event | string) {
  const value =
    typeof event === 'string'
      ? event
      : (event.target as HTMLInputElement).value;

  this.filterValue = value.trim().toLowerCase();
  this.refreshFilter();
}

}
