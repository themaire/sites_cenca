import { Route } from '@angular/router';
import { TravauxComponent } from './travaux.component';
import { TravauxDisplayComponent } from './travaux-display/travaux-display.component';

export const TRAVAUX_ROUTES: Route[] = [
  {
    path: '',
    component: TravauxComponent,
    pathMatch: 'prefix',
    providers: [],
    children: [
      {
        path: 'filtre/:annee/:responsable/:localisation/:statut',
        component: TravauxDisplayComponent,
        outlet: 'liste',
      },
    ],
  },
];
