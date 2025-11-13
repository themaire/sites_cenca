import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MenuService } from '../menu.service';
import { MenuItem } from '../menuItem';
import { CardComponent } from '../home/card/card.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink, RouterOutlet, CommonModule, CardComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss', '../home/home.component.scss']
})
export class AdminComponent {

  subrouteLength!: number;
  preferencesItems: MenuItem[] = [];


  constructor(
    public route: ActivatedRoute,
    private menuService: MenuService) {
  }


  ngOnInit(): void {

    this.subrouteLength = this.route.snapshot.url.length + 1; // On ajoute 1 pour le segment 'foncier' (il a son propre fichier de route)
    console.log("this.subrouteLength de ngOnInit() du component foncier  : " + this.subrouteLength);

    /**
     * 10 car c'est l'id du menu Foncier dans la base de données
     */
    this.menuService.loadSubMenuItem(28).then((subMenuItems) => {
      // Debug chaque élément
      console.log("subMenuItems de ngOnInit() du component preferences  : ");

      subMenuItems.forEach((item, index) => {
        
        if ((item.class_color?.split('-').length ?? 0) > 1) {
          item.parent_name = item.class_color?.split('-').slice(1).join(' ').replace(/^\w/, l => l.toUpperCase());
        }

        // console.log(`Item ${index}:`, item);
        // console.log(`Item ${index} opened:`, item.opened);
        // console.log(`Item ${index} opened type:`, typeof item.opened);

        this.preferencesItems.push(item);
      });
    });
  }
}