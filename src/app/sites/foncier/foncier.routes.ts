import { Route } from '@angular/router';
import { FoncierComponent } from './foncier.component';
import { FonExtractionComponent } from './fon-extractions/fon-extractions.component';
import { FonPmfuComponent } from './fon-pmfu/fon-pmfu.component';
import { FonActesMultiSitesComponent } from './fon-actes-multi-sites/fon-actes-multi-sites.component';

export const FONCIER_ROUTES: Route[] = [
  {
    path: '',
    component: FoncierComponent,
    pathMatch: 'prefix',
    providers: [],
  },
  {
    path: 'extractions',
    component: FonExtractionComponent,
    pathMatch: 'prefix',
    providers: [],
  },
  {
    path: 'pmfu',
    component: FonPmfuComponent,
    pathMatch: 'prefix',
    providers: [],
  },
  {
    // Nouvelle page pour la gestion des actes multi-sites.
    path: 'amfu',
    component: FonActesMultiSitesComponent,
    pathMatch: 'prefix',
    providers: [],
  },
  {
    path: 'actes',
    redirectTo: 'amfu',
    pathMatch: 'full',
  },
  {
    path: 'actes-multi-sites',
    redirectTo: 'amfu',
    pathMatch: 'full',
  }
];