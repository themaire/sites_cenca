import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChiroService } from '../../services/chiro.service';
import { DetailReleve } from '../../interfaces/releve';
import { ObservationDetail, Typologies } from '../../interfaces/observation';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { OngletReleveComponent } from './onglet-releve/onglet-releve.component';
import { OngletObservationsComponent } from './onglet-observations/onglet-observations.component';

@Component({
  selector: 'app-fiche-releve',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    OngletReleveComponent, OngletObservationsComponent,
  ],
  templateUrl: './fiche-releve.component.html',
  styleUrl: './fiche-releve.component.scss',
})
export class FicheReleveComponent implements OnInit {
  releve?: DetailReleve;
  observations: ObservationDetail[] = [];
  typologies?: Typologies;
  loading = true;
  erreur?: string;
  isEditMode = false;
  uuid?: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chiroService: ChiroService,
    private confirmationService: ConfirmationService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.uuid = this.route.snapshot.paramMap.get('uuid') ?? undefined;
    if (!this.uuid) {
      this.erreur = 'Identifiant de relevé manquant dans l\'URL.';
      this.loading = false;
      return;
    }
    this.charger();
  }

  private charger() {
    const uuid = this.uuid!;
    Promise.all([
      this.chiroService.getReleve(uuid),
      this.chiroService.getObservations(uuid),
      this.chiroService.getTypologies(),
    ]).then(([releve, observations, typologies]) => {
      this.releve = releve;
      this.observations = observations;
      this.typologies = typologies;
      this.loading = false;
    }).catch((err: Error) => {
      console.error('[FicheReleve]', err);
      this.erreur = err.message ?? 'Erreur lors du chargement du relevé.';
      this.loading = false;
    });
  }

  toggleEdit() {
    this.isEditMode = !this.isEditMode;
  }

  onReleveSaved() {
    this.isEditMode = false;
    this.chiroService.getReleve(this.uuid!).then(r => this.releve = r);
  }

  onObservationsChanged() {
    this.chiroService.getObservations(this.uuid!).then(obs => this.observations = obs);
  }

  supprimerReleve() {
    this.confirmationService.confirm(
      'Supprimer ce relevé',
      'Cette action est irréversible. Toutes les observations associées seront également supprimées.',
      'delete',
    ).subscribe((ok: boolean | string[]) => {
      if (!ok) return;
      this.chiroService.deleteReleve(this.uuid!).subscribe({
        next: () => {
          this.snackBar.open('Relevé supprimé', 'Fermer', { duration: 3000 });
          this.router.navigate(['/chiro/releves']);
        },
        error: (err) => {
          console.error('[FicheReleve] suppression', err);
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 4000 });
        },
      });
    });
  }

  retour() {
    this.router.navigate(['/chiro/releves']);
  }
}
