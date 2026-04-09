import {
  Component,
  Input,
  inject,
  SimpleChanges,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DetailSite } from '../../site-detail';
import { ActeLite } from './acte';
import { SitesService } from '../../sites.service';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';


import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { ActeMfuComponent } from './acte_mfu/acte-mfu.component';

import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';

@Component({
  selector: 'app-detail-mfu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatTableModule,
    MatTooltipModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSortModule,
    MatInputModule,
    MatRadioModule
  ],
  templateUrl: './detail-mfu.component.html',
  styleUrl: './detail-mfu.component.scss',
})
export class DetailMfuComponent {

  @Input() inputDetail?: DetailSite;
  public actes: ActeLite[] = [];
  public dataSource!: MatTableDataSource<ActeLite>;

  public displayedColumns: string[] = [
    'typ_mfu',
    'debut',
    'fin',
    'tacit_rec',
    'surf_totale',
    'type_prop',
    'url',
  ];

  @ViewChild(MatSort) sort: MatSort | undefined;

  // Appliquer le tri après l'initialisation de la vue
  ngAfterViewInit() {
    if (this.dataSource) {
      this.dataSource.sort = this.sort!;
    }
  }

  // Variable pour le filtre avec ngModel
  filterValidite: string = 'tous';

  research: SitesService = inject(SitesService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  public dialog: MatDialog = inject(MatDialog);
  public overlay: Overlay = inject(Overlay);
  // Garde la position de scroll pour figer l'arriere-plan pendant la modale.
  private lockedScrollY: number | null = null;

  async ngOnChanges(changes: SimpleChanges) {
    let subroute: string = '';

    if (this.inputDetail !== undefined) {
      subroute = `mfu/uuid=${this.inputDetail.uuid_site}/lite`;
      console.log("Ouais on est dans le OnChanges 'onglet MFU' . UUID:" + this.inputDetail['uuid_site']);

      try {
        this.actes = await this.research.getActe(subroute);
        console.log('Données de this.actes après récupération :', this.actes);
        this.dataSource = new MatTableDataSource(this.actes);

        // Configurer le filtre personnalisé
        this.dataSource.filterPredicate = (data: ActeLite, filter: string) => {
          const actuelValue = String(data.validite);
          if (filter === 'tous') {
            return true;
          }
          if (filter === 'valide') {
            return actuelValue === 'true';
          }
          if (filter === 'invalide') {
            return actuelValue === 'false';
          }
          return true;
        };

        this.cdr.detectChanges();
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }

      } catch (error) {
        console.error('Error fetching documents', error);
      }
    }
  }

  async refreshActes(): Promise<void> {
    if (this.inputDetail !== undefined) {
      const subroute = `mfu/uuid=${this.inputDetail.uuid_site}/lite`;
      console.log("Rafraîchissement de la liste des actes MFU. UUID:", this.inputDetail['uuid_site']);

      try {
        this.actes = await this.research.getActe(subroute);
        this.dataSource = new MatTableDataSource(this.actes);

        // Configurer le filtre personnalisé
        this.dataSource.filterPredicate = (data: ActeLite, filter: string) => {
          const actuelValue = String(data.validite);
          if (filter === 'tous') {
            return true;
          }
          if (filter === 'valide') {
            return actuelValue === 'true';
          }
          if (filter === 'invalide') {
            return actuelValue === 'false';
          }
          return true;
        };

        this.cdr.detectChanges();
      } catch (error) {
        console.error('Erreur lors du rafraîchissement des documents', error);
      }
    }
  }

  // Appliquer le filtre
  applicationFiltre(): void {
    console.log("Filtre appliqué : ", this.filterValidite);
    this.dataSource.filter = this.filterValidite;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // Getter pour le nombre d'actes en fonction de la validité
  get ActesTotal(): number {
    return this.actes.length;
  }

  get ActesValides(): number {
    return this.actes.filter(acte => String(acte.validite) === 'true').length;
  }

  get ActesInvalides(): number {
    return this.actes.filter(acte => String(acte.validite) === 'false').length;
  }


  onSelect(actelite?: ActeLite, event?: Event): void {
    event?.stopPropagation();

    if (actelite !== undefined) {
      this.openDialog(actelite);
    } else {
      this.openDialog();
    }
  }

  openDialog(actelite?: ActeLite): void {
    if (actelite !== undefined) {
      const acteAny = actelite as any;
      const resolvedUuid = acteAny?.uuid_acte || acteAny?.uuid || acteAny?.ref_uuid_acte || '';
      if (!acteAny?.uuid_acte && resolvedUuid) {
        actelite = { ...actelite, uuid_acte: resolvedUuid } as ActeLite;
      }
    }

    this.lockBackgroundScroll();

    if (actelite === undefined) {
      console.log("Charge un MFU vide");
      actelite = {
        site: this.inputDetail?.uuid_site || '',
      } as ActeLite;
      console.log("--------------actelite : ", actelite);
    }

    const dialogRef = this.dialog.open(ActeMfuComponent, {
      data: actelite,
      minWidth: '80vw',
      maxWidth: '95vw',
      height: '85vh',
      maxHeight: '95vh',
      hasBackdrop: true,
      backdropClass: 'custom-backdrop-gerer',
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      autoFocus: false,
      restoreFocus: false,
      scrollStrategy: this.overlay.scrollStrategies.noop(),
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.unlockBackgroundScroll();
      console.log('Dialog MFU fermé avec résultat:', result);
      if (result === true) {
        this.refreshActes();
      }
    });
  }

  private lockBackgroundScroll(): void {
    if (this.lockedScrollY !== null) {
      return;
    }

    this.lockedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.lockedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflowY = 'hidden';
  }

  private unlockBackgroundScroll(): void {
    if (this.lockedScrollY === null) {
      return;
    }

    const scrollY = this.lockedScrollY;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflowY = '';
    this.lockedScrollY = null;
    window.scrollTo(0, scrollY);
  }
}

