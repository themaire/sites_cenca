import {
  Component,
  OnInit,
  OnChanges,
  inject,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  SimpleChange,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterLink, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { ListSite } from '../site'; // prototype d'un site
import { Commune } from '../site-detail/detail-infos/commune';
import { DetailSite, DetailSiteProjet } from '../site-detail';
import { SitesService, SiteDeleteDependance } from '../sites.service'; // service de données
import { LoginService } from '../../login/login.service';
import { FormService } from '../../shared/services/form.service';
import { ConfirmationService } from '../../shared/services/confirmation.service';
import { SiteDeleteBlockedComponent, SiteDeleteBlockedData } from './site-delete-blocked/site-delete-blocked.component';

import { DetailInfosComponent } from './detail-infos/detail-infos.component';
import { DetailDescriptionComponent } from './detail-description/detail-description.component';
import { DetailMfuComponent } from './detail-mfu/detail-mfu.component';
import { DetailGestionComponent } from './detail-gestion/detail-gestion.component'; 
import { DetailHabitatsComponent } from './detail-habitats/detail-habitats.component'; 
import { DetailProjetsComponent } from './detail-projets/detail-projets.component'; 
// Composant qui affiche une fiche site (6 sous-composants).

@Component({
  selector: 'app-site-detail',
  standalone: true,
  imports: [
    CommonModule,
    // RouterLink,
    // RouterOutlet,

    MatTabsModule,

    DetailInfosComponent,
    DetailDescriptionComponent,
    DetailMfuComponent,
    DetailGestionComponent,
    DetailHabitatsComponent,
    DetailProjetsComponent,
  ],
  templateUrl: './site-detail.component.html',
  styleUrl: './site-detail.component.scss',
})
export class SiteDetailComponent {
  @Input() screens?: any; // Le site selectionné pour voir son détail
  @Input() site?: ListSite; // Le site selectionné pour voir son détail
  @Output() selectedSite = new EventEmitter<Object>(); // Utiliser cette variable provenent du composant frere

  isMobile: boolean = false;

  public siteDetail!: DetailSite;
  public siteDetailProjet!: DetailSiteProjet;

  resetSelectedd(): void {
    // Assigne la valeur "undefined" à la variable selectedSite
    // qui se trouve dans le component frere "site-display" :-)
    // D'où le @output en ligne 53 pour la déclaration de selectedSite
    // dans CE component.
    this.selectedSite.emit(undefined);
  }

  // research: SitesService = inject(SitesService);

  constructor(
    private sitesService: SitesService,
    private route: ActivatedRoute,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private loginService: LoginService,
    private formService: FormService,
    private confirmationService: ConfirmationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  get isEditAllowed(): boolean {
    return this.loginService.isEdit();
  }

  deleting = false;

  /**
   * Suppression d'un site créé par erreur. On interroge d'abord la route de vérification :
   * si des données sont rattachées, on affiche directement le motif (sans passer par la
   * confirmation) ; sinon on demande confirmation, puis on supprime et on revient à la liste.
   */
  deleteSiteConfirm(): void {
    if (!this.siteDetail || this.deleting) return;
    const uuid = this.siteDetail.uuid_site;
    this.deleting = true;

    this.sitesService.checkSiteDeletion(uuid).subscribe({
      next: (check) => {
        this.deleting = false;
        if (!check.supprimable) {
          this.showDeleteBlocked({
            message: check.message || `Suppression impossible : le site ${this.siteDetail.code} a des données rattachées.`,
            dependances: check.dependances ?? [],
          });
          return;
        }
        this.askDeleteConfirmation(uuid, this.describeCascade(check.supprime_avec_le_site));
      },
      error: (err: HttpErrorResponse) => {
        // Vérification indisponible : on laisse la route DELETE trancher (elle renvoie 409 si besoin)
        this.deleting = false;
        if (err.status === 404) {
          this.formService.snackMessage(err.error?.message || 'Site introuvable.', 1, this.snackBar);
          return;
        }
        this.askDeleteConfirmation(uuid, '');
      },
    });
  }

  private askDeleteConfirmation(uuid: string, cascade: string): void {
    const site = `${this.siteDetail.code} - ${this.siteDetail.nom}`;
    const message =
      `Voulez-vous vraiment supprimer le site ${site} ?` +
      (cascade ? `
Seront aussi supprimés : ${cascade}.` : '') +
      `
<strong>Cette action est irréversible.</strong>`;

    this.confirmationService.confirm('Confirmation de suppression', message, 'delete').subscribe((ok) => {
      if (ok !== true) return;
      this.deleting = true;
      this.sitesService.deleteSite(uuid).subscribe({
        next: (res) => {
          this.deleting = false;
          this.formService.snackMessage(res?.message || 'Site supprimé', 0, this.snackBar);
          this.resetSelectedd(); // Retour à la liste, qui se recharge (sites-display.resetSelected)
        },
        error: (err: HttpErrorResponse) => {
          this.deleting = false;
          if (err.status === 409) {
            this.showDeleteBlocked({
              message: err.error?.message || 'Suppression impossible : des données sont rattachées au site.',
              dependances: (err.error?.data?.dependances ?? []) as SiteDeleteDependance[],
            });
          } else {
            this.formService.snackMessage(
              err.error?.message || 'Erreur lors de la suppression du site',
              1,
              this.snackBar
            );
          }
        },
      });
    });
  }

  private showDeleteBlocked(data: SiteDeleteBlockedData): void {
    this.dialog.open(SiteDeleteBlockedComponent, {
      data,
      width: '520px',
      maxWidth: '95vw',
      backdropClass: 'custom-backdrop-delete', // Même fond rouge que la confirmation de suppression
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '300ms',
    });
  }

  /** "3 géométries, 2 milieux naturels, communes : Reims, Épernay" à partir de supprime_avec_le_site */
  private describeCascade(cascade?: Record<string, unknown>): string {
    if (!cascade) return '';
    const parts: string[] = [];
    for (const [key, value] of Object.entries(cascade)) {
      const label = key.replace(/_/g, ' ');
      if (typeof value === 'number' && value > 0) {
        parts.push(`${value} ${label}`);
      } else if (Array.isArray(value) && value.length) {
        const noms = value.map((v: any) => (typeof v === 'object' && v ? v.nom ?? v.libelle ?? v.insee ?? JSON.stringify(v) : String(v)));
        parts.push(`${label} : ${noms.join(', ')}`);
      }
    }
    return parts.join(', ');
  }

  ngOnChanges(changes: SimpleChanges) {
    // Ce component est chargé en meme temps que sitesDisplay. Vide et non visible.
    // Le chargement des details à afficher se fait par la suite, d'où le OnChanges.
    let subroute: string = '';

    if (this.site !== undefined) {
      // Cas d'une recherche sur critères
      subroute = 'uuid=' + this.site['uuid_site'];

      console.log(
        'Ouais on est dans le OnChanges de site-detail. UUID : ' +
          this.site['uuid_site']
      );
      // console.log(this.site);

      this.sitesService.getSiteUUID(subroute).then(async (siteGuetted) => {
        this.siteDetail = siteGuetted;

        const subrouteCommunes = `commune/uuid=${siteGuetted.uuid_site}`;
        // Pour donner au composant detail-projets.component.ts <app-detail-projets>
        this.siteDetailProjet = {
          uuid_site: siteGuetted.uuid_site,
          uuid_espace: siteGuetted.uuid_espace,
          code: siteGuetted.code,
          nom: siteGuetted.nom,
          communes: await this.sitesService.getCommune(subrouteCommunes),
          surface: siteGuetted.surface,
          localisation: siteGuetted.localisation
        }
      });
    }
  }

  ngOnInit() {
    // Détecter si c'est la version mobile
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.isMobile = result.matches;
      });
  }
}
