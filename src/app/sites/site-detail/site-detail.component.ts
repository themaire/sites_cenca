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
import { ListSite } from '../site'; // prototype d'un site
import { Commune } from '../site-detail/detail-infos/commune';
import { DetailSite, DetailSiteProjet } from '../site-detail';
import { SitesService } from '../sites.service'; // service de données

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
    private breakpointObserver: BreakpointObserver
  ) {}

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
