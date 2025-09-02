import { Route } from '@angular/router';
import { FoncierComponent } from './foncier.component';
import { FonExtractionComponent } from './fon-extractions/fon-extractions.component';
import { FonPmfuComponent } from './fon-pmfu/fon-pmfu.component';

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
  }
];