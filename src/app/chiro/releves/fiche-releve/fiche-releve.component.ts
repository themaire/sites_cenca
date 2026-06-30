import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ChiroService } from '../../services/chiro.service';
import { DetailReleve } from '../../interfaces/releve';
import { ObservationDetail } from '../../interfaces/observation';
import { OngletReleveComponent } from './onglet-releve/onglet-releve.component';
import { OngletObservationsComponent } from './onglet-observations/onglet-observations.component';

@Component({
  selector: 'app-fiche-releve',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    OngletReleveComponent, OngletObservationsComponent,
  ],
  templateUrl: './fiche-releve.component.html',
  styleUrl: './fiche-releve.component.scss',
})
export class FicheReleveComponent implements OnInit {
  releve?: DetailReleve;
  observations: ObservationDetail[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chiroService: ChiroService,
  ) {}

  ngOnInit() {
    const uuid = this.route.snapshot.paramMap.get('uuid')!;
    Promise.all([
      this.chiroService.getReleve(uuid),
      this.chiroService.getObservations(uuid),
    ]).then(([releve, observations]) => {
      this.releve = releve;
      this.observations = observations;
      this.loading = false;
    });
  }

  retour() {
    this.router.navigate(['/chiro/releves']);
  }
}
