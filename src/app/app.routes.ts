import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MenuItemResolver } from './resolvers/menu-item.resolver'; // Import du Resolver

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    resolve: {
        menuItems: MenuItemResolver // Association du resolver à cette route
    }
  },

  // Lazy-load
  {
    path: 'sites',
    // component : SitesComponent // Avant
    loadChildren: () =>
      import('./sites/sites.routes').then((mod) => mod.SITES_ROUTES),
  },

  // Lazy-load
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.routes').then((mod) => mod.ADMIN_ROUTES),
  },
];
