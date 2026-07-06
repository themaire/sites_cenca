import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ChiroService } from '../../services/chiro.service';
import { DetailSiteChiro } from '../../interfaces/site-chiro';
import { Typologies } from '../../interfaces/observation';
import { ListReleve } from '../../interfaces/releve';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { SiteRelevesComponent } from './site-releves/site-releves.component';
import { OngletInfosSiteComponent } from './onglet-infos-site/onglet-infos-site.component';

@Component({
  selector: 'app-fiche-site-chiro',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    SiteRelevesComponent, OngletInfosSiteComponent,
  ],
  templateUrl: './fiche-site.component.html',
  styleUrl: './fiche-site.component.scss',
})
export class FicheSiteComponent implements OnInit {
  site?: DetailSiteChiro;
  releves: ListReleve[] = [];
  typologies?: Typologies;
  loading = true;
  siteId?: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chiroService: ChiroService,
    private confirmationService: ConfirmationService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.siteId = Number(this.route.snapshot.paramMap.get('id'));
    this.charger();
  }

  private charger() {
    const id = this.siteId!;
    Promise.all([
      this.chiroService.getSite(id),
      this.chiroService.getSiteReleves(id),
      this.chiroService.getTypologies(),
    ]).then(([site, releves, typologies]) => {
      this.site = site;
      this.releves = releves;
      this.typologies = typologies;
      this.loading = false;
    });
  }

  onSiteSaved() {
    this.chiroService.getSite(this.siteId!).then(s => this.site = s);
  }

  supprimerSite() {
    this.confirmationService.confirm(
      'Supprimer ce site',
      'Cette action est irréversible. Le site sera supprimé définitivement.',
      'delete',
    ).subscribe((ok: boolean | string[]) => {
      if (!ok) return;
      this.chiroService.deleteSite(this.siteId!).subscribe({
        next: () => {
          this.snackBar.open('Site supprimé', 'Fermer', { duration: 3000 });
          this.router.navigate(['/chiro/sites']);
        },
        error: (err) => {
          const msg = err.status === 409
            ? 'Ce site possède des relevés et ne peut pas être supprimé.'
            : 'Erreur lors de la suppression du site.';
          this.snackBar.open(msg, 'Fermer', { duration: 5000 });
        },
      });
    });
  }

  retour() {
    this.router.navigate(['/chiro/sites']);
  }
}
