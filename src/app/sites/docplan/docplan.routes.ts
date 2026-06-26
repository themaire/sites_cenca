import { Route } from '@angular/router';
import { DocplanComponent } from './docplan.component';
import { DocplanDisplayComponent } from './docplan-display/docplan-display.component';

export const TRAVAUX_ROUTES: Route[] = [
  {
    path: '',
    component: DocplanComponent,
    pathMatch: 'prefix',
    providers: [],
    children: [
      {
        path: 'filtre/:annee_deb/:localisation/:typ_document/:actuel',
        component: DocplanDisplayComponent,
        outlet: 'liste',
      },
    ],
  },
];
