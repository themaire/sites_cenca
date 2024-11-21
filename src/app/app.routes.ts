import { Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { MenuItemResolver } from './resolvers/menu-item.resolver'; // Import du Resolver
import { isLoggedInGuard } from './guards/is-logged-in.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    resolve: {
      menuItems: MenuItemResolver, // Association du resolver à cette route
    },
    canActivate: [isLoggedInGuard],
  },
  {
    path: 'login',
    component: LoginComponent,
  },

  // Lazy-load
  {
    path: 'sites',
    // component : SitesComponent // Avant
    loadChildren: () =>
      import('./sites/sites.routes').then((mod) => mod.SITES_ROUTES),
    canActivate: [isLoggedInGuard],
  },

  // Lazy-load
  {
    path: 'foncier',
    loadChildren: () =>
      import('./sites/foncier/foncier.routes').then((mod) => mod.FONCIER_ROUTES),
  },

  // Lazy-load
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.routes').then((mod) => mod.ADMIN_ROUTES),
    canActivate: [isLoggedInGuard],
  },
];
