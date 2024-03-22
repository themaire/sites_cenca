import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
    {
        path: '',
        component : HomeComponent
    },
    
    // Lazy-load
    {
        path: 'sites',
        // component : SitesComponent // Avant
        loadChildren: () => import('./sites/sites.routes').then(mod => mod.SITES_ROUTES)
    },

    // Lazy-load
    {
        path: 'admin',
        loadChildren: () => import('./admin/admin.routes').then(mod => mod.ADMIN_ROUTES)
    },

];