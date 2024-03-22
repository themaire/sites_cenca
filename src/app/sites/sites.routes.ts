import { Route } from '@angular/router';
import { SitesComponent } from './sites.component';
import { SitesDisplayComponent } from './sites-display/sites-display.component';

export const SITES_ROUTES: Route[] = [{
    path: '',
    component: SitesComponent,
    pathMatch: 'prefix',
    providers: [
                ],
    children: [
       
        {
            // path: 'filtre/:type',
            // path: 'filtre',
            path: 'filtre/:type/:code/:nom/:commune/:milieux_naturels/:responsable',
            component: SitesDisplayComponent,
            outlet: 'liste'
        },
    ],
  }];