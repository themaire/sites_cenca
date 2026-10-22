import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MenuService } from '../../menu.service';
import { MenuItem } from '../../menuItem';
import { CardComponent } from '../../home/card/card.component';

@Component({
  selector: 'app-foncier',
  standalone: true,
  imports: [RouterModule,
    CardComponent,
    CommonModule
  ],
  templateUrl: './foncier.component.html',
  styleUrls: ['./foncier.component.scss', '../../home/home.component.scss']
})
export class FoncierComponent implements OnInit {

  subrouteLength!: number;
  foncierItems: MenuItem[] = [];


  constructor(
    private route: ActivatedRoute,
    private menuService: MenuService) {
  }

  ngOnInit(): void {

    this.subrouteLength = this.route.snapshot.url.length + 1; // On ajoute 1 pour le segment 'foncier' (il a son propre fichier de route)

    // this.menuService.menuItems$.subscribe((items) => {
    //   this.menuItems[0].children = items;
    // });

    /**
     * 10 car c'est l'id du menu Foncier dans la base de données
     */
    this.menuService.loadSubMenuItem(10).then((subMenuItems) => {
      // Filtre directement les items qui ont opened: true
      this.foncierItems = subMenuItems.filter(item => {
        // Divise la route en segments
        const routeSegments = item.route?.split('/') || [];

        // Retire les premiers segments selon subrouteLength
        const remainingSegments = routeSegments.slice(this.subrouteLength);

        // Reconstruit la route
        item.route = remainingSegments.join('/');

        // parent_name pour l'affichage
        if ((item.class_color?.split('-').length ?? 0) > 1) {
          item.parent_name = item.class_color?.split('-').slice(1).join(' ').replace(/^\w/, l => l.toUpperCase());
        } else if ((item.class_color?.split('-').length ?? 0) === 1) {
          item.parent_name = item.class_color?.replace(/^\w/, l => l.toUpperCase());
        }

        // Uniformiser la carte "Actes multi-sites" et forcer la route canonique AMFU.
        if (item.route === 'actes' || item.route === 'actes-multi-sites' || item.route === 'amfu') {
          item.route = 'amfu';
          item.parent_name = 'Protéger';
          item.class_color = 'c-proteger';
        }

        return item.opened === true;
      });
    });
  }


}
