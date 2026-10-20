import { Component, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ListSite } from '../site';
import { SiteLite } from '../foncier/foncier';
import { SitesService } from '../sites.service';
import { SiteDetailComponent } from '../site-detail/site-detail.component';

/** Format d'un uuid : sinon le paramètre du permalien est un code de site. */
const FORMAT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Permalien d'une fiche site : `/site/:id`, où `id` est le code du site (ex. `/site/52134`,
 * court et lisible) ou son uuid (sites sans code, anciens liens).
 *
 * La fiche n'a besoin que de l'uuid pour charger tout le reste : on lui passe
 * un site réduit à son uuid. Sert aux liens partagés et aux liens donnés par Sonneur.
 */
@Component({
  selector: 'app-site-permalien',
  standalone: true,
  imports: [SiteDetailComponent, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './site-permalien.component.html',
  styleUrl: '../sites.component.scss',
})
export class SitePermalienComponent {
  site = signal<ListSite | undefined>(undefined);
  /** Code demandé, inconnu de la base. */
  codeIntrouvable = signal<string | null>(null);
  /** Plusieurs sites portent le code demandé : on laisse choisir. */
  homonymes = signal<SiteLite[]>([]);

  /** Arrivée depuis une autre page de l'application (sinon : lien ouvert directement). */
  private readonly pagePrecedente: boolean;

  constructor(
    route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private sitesService: SitesService
  ) {
    this.pagePrecedente = !!this.router.getCurrentNavigation()?.previousNavigation;

    route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => this.charger(params.get('id') ?? ''));
  }

  private async charger(id: string): Promise<void> {
    this.site.set(undefined);
    this.codeIntrouvable.set(null);
    this.homonymes.set([]);
    if (!id) return;

    if (FORMAT_UUID.test(id)) {
      this.afficher(id);
      return;
    }

    const sites = await this.sitesService.getSitesParCode(id).catch(() => [] as SiteLite[]);
    if (sites.length === 1) {
      this.afficher(sites[0].uuid_site);
    } else if (sites.length > 1) {
      this.homonymes.set(sites);
    } else {
      this.codeIntrouvable.set(id);
    }
  }

  /** Nouvel objet à chaque site : déclenche le ngOnChanges de la fiche. */
  private afficher(uuid: string): void {
    this.site.set({ uuid_site: uuid } as ListSite);
  }

  /** Retour : page précédente si on vient de l'application, sinon la recherche de sites. */
  retour(): void {
    if (this.pagePrecedente) {
      this.location.back();
    } else {
      this.router.navigate(['/sites']);
    }
  }
}
