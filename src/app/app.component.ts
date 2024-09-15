import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { RouterModule } from '@angular/router';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { SitesComponent } from './sites/sites.component';
import { MenuItem } from './menuItem';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    SitesComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'site_cenca';
  menuItems: MenuItem[] = [
    {
      name: 'Axes du CENCA',
      class_color: 'c-menu',
      children: [
        {
          name: 'Protéger',
          class_color: 'c-proteger',
          children: [
            { name: 'Stratégie, animation et veille foncière' },
            { name: 'Liste des sites', route: '/sites' },
            { name: 'Police et surveillance' },
            { name: 'Classements de sites' },
            { name: 'Patrtenariats et foncier' },
          ],
        },
        {
          name: 'Connaitre',
          class_color: 'c-connaitre',
          children: [
            { name: 'Tableau de bord' },
            { name: 'Inventaires et suivis scientifique' },
            { name: 'Plans de gestion' },
          ],
        },
        {
          name: 'Gérer',
          class_color: 'c-gerer',
          children: [
            { name: 'Travaux de gestion' },
            { name: 'Libre évolution' },
            { name: 'Partenariat et ancrage territorial' },
            { name: 'Partenariats et sources de financement' },
          ],
        },
        {
          name: 'Valoriser',
          class_color: 'c-valoriser',
          children: [
            { name: "Traveaux d'aménagement" },
            { name: 'Sembilisations' },
          ],
        },
        {
          name: 'Accompagner',
          class_color: 'c-accompagner',
          children: [
            { name: 'Mesure compensatoires' },
            { name: 'Natura 2000' },
            { name: 'Assistance technique' },
          ],
        },
        {
          name: 'Administratif',
          class_color: 'c-administratif',
          children: [],
        },
        { name: 'Liens utiles', class_color: 'c-liens-utils', children: [] },
      ],
    },
    // {
    //   name: 'Gerer',
    //   class_color: 'c-gerer',
    //   children: [{ name: 'Insects' }, { name: 'Molluscs' }],
    // },
  ];
}
