import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { ChiroService } from '../../services/chiro.service';
import { DetailSiteChiro } from '../../interfaces/site-chiro';
import { ListReleve } from '../../interfaces/releve';
import { SiteRelevesComponent } from './site-releves/site-releves.component';

@Component({
  selector: 'app-fiche-site-chiro',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatChipsModule,
    SiteRelevesComponent,
  ],
  templateUrl: './fiche-site.component.html',
  styleUrl: './fiche-site.component.scss',
})
export class FicheSiteComponent implements OnInit {
  site?: DetailSiteChiro;
  releves: ListReleve[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chiroService: ChiroService,
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    Promise.all([
      this.chiroService.getSite(id),
      this.chiroService.getSiteReleves(id),
    ]).then(([site, releves]) => {
      this.site = site;
      this.releves = releves;
      this.loading = false;
    });
  }

  retour() {
    this.router.navigate(['/chiro/sites']);
  }
}
