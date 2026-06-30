import { Routes } from '@angular/router';
import { ChiroAccueilComponent } from './chiro-accueil/chiro-accueil.component';
import { ListeRelevesComponent } from './releves/liste-releves/liste-releves.component';
import { FicheReleveComponent } from './releves/fiche-releve/fiche-releve.component';
import { ListeSitesComponent } from './sites/liste-sites/liste-sites.component';
import { FicheSiteComponent } from './sites/fiche-site/fiche-site.component';

export const CHIRO_ROUTES: Routes = [
  { path: '', component: ChiroAccueilComponent },
  { path: 'releves', component: ListeRelevesComponent },
  { path: 'releve/:uuid', component: FicheReleveComponent },
  { path: 'sites', component: ListeSitesComponent },
  { path: 'site/:id', component: FicheSiteComponent },
];
