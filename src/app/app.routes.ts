import { Routes } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { MenuItemResolver } from './resolvers/menu-item.resolver'; // Import du Resolver
import { isLoggedInGuard } from './guards/is-logged-in.guard';
import { DocumentationComponent } from './documentation.component';

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
  {
    path: 'sites',
    loadChildren: () =>
      import('./sites/sites.routes').then((mod) => mod.SITES_ROUTES),
    // canActivate: [isLoggedInGuard], // Désactivé temporairement
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.routes').then((mod) => mod.ADMIN_ROUTES),
    canActivate: [isLoggedInGuard],
  },
  {
    path: 'documentation',
    component: DocumentationComponent,
    canActivate: [isLoggedInGuard],
  },

  {
    path: '**',
    component: NotFoundComponent, // Créez un composant pour afficher une page 404
  },
];
