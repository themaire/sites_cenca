import { Routes, provideRouter, withHashLocation } from '@angular/router';
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
    canActivate: [isLoggedInGuard],
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
  },
  {
    path: '**',
    redirectTo: '',
  },
];

// Fournir le routeur avec le mode hash activé
export const appRoutingProviders = [
  provideRouter(routes, withHashLocation()),
];
