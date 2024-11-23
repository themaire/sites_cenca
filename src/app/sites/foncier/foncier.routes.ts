import { Route } from '@angular/router';
import { FoncierComponent } from './foncier.component';
import { FonExtractionComponent } from './fon-extractions/fon-extractions.component';

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
];