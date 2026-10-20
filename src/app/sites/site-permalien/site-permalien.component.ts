import { Component, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ListSite } from '../site';
import { SiteDetailComponent } from '../site-detail/site-detail.component';

/**
 * Permalien d'une fiche site : `/site/:uuid`.
 *
 * La fiche n'a besoin que de l'uuid pour charger tout le reste : on lui passe
 * un site réduit à son uuid. Sert aux liens partagés et aux liens donnés par ATLAS.
 */
@Component({
  selector: 'app-site-permalien',
  standalone: true,
  imports: [SiteDetailComponent],
  templateUrl: './site-permalien.component.html',
  styleUrl: '../sites.component.scss',
})
export class SitePermalienComponent {
  site = signal<ListSite | undefined>(undefined);

  /** Arrivée depuis une autre page de l'application (sinon : lien ouvert directement). */
  private readonly pagePrecedente: boolean;

  constructor(route: ActivatedRoute, private router: Router, private location: Location) {
    this.pagePrecedente = !!this.router.getCurrentNavigation()?.previousNavigation;

    // Nouvel objet à chaque uuid : déclenche le ngOnChanges de la fiche
    route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const uuid = params.get('uuid');
      this.site.set(uuid ? ({ uuid_site: uuid } as ListSite) : undefined);
    });
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
