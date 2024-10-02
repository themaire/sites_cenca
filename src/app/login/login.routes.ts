import { Route } from '@angular/router';
import { LoginComponent } from './login.component';

export const LOGIN_ROUTES: Route[] = [
  {
    path: '',

    pathMatch: 'prefix',
    providers: [
      //   AdminService,
      //   {provide: ADMIN_API_KEY, useValue: 12345},
    ],
    children: [
      { path: '', component: LoginComponent },

      //   {path: 'teams', component: AdminTeams},
    ],
  },
];
