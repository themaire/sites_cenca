import { Route } from '@angular/router';
import { FoncierComponent } from './foncier.component';
import { FonDemandesComponent } from './fon-demandes/fon-demandes.component';

export const FONCIER_ROUTES: Route[] = [
  {
    path: '',
    component: FoncierComponent,
    pathMatch: 'prefix',
    providers: [],
  },
  {
    path: 'demandes',
    component: FonDemandesComponent,
    pathMatch: 'prefix',
    providers: [],
  },
];