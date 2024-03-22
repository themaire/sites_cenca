import { Route } from '@angular/router';
import { AdminComponent } from './admin.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';

export const ADMIN_ROUTES: Route[] = [{
    path: '',
    
    pathMatch: 'prefix',
    providers: [
    //   AdminService,
    //   {provide: ADMIN_API_KEY, useValue: 12345},
    ],
    children: [
        {path: '', component: AdminComponent},
        {path: 'users', component: AdminUsersComponent, outlet: 'toUsers'},
    //   {path: 'teams', component: AdminTeams},
    ],
  }];