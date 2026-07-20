import { Route } from '@angular/router';
import { AdminComponent } from './admin.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { AdminGroupsComponent } from './admin-groups/admin-groups.component';
import { AdminNewsComponent } from './admin-news/admin-news.component';

export const ADMIN_ROUTES = [
  {
    path: '',
    component: AdminComponent,
    children: [
      { path: 'utilisateurs', component: AdminUsersComponent, outlet: 'userDroits' },
      { path: 'groupes', component: AdminGroupsComponent, outlet: 'userDroits' },
      { path: 'gerer', component: AdminNewsComponent, outlet: 'news' }
    ]
  }
];