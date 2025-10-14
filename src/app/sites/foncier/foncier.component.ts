import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
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

  foncierItems: MenuItem[] = [];


  constructor(private menuService: MenuService) {
    
  }

  ngOnInit(): void {
    // this.menuService.menuItems$.subscribe((items) => {
    //   this.menuItems[0].children = items;
    // });

    this.menuService.loadSubMenuItem(10).then((subMenuItems) => {
      console.log("subMenuItems de ngOnInit() du component foncier  : ");
      console.log(subMenuItems);
      
      // Debug chaque élément
      subMenuItems.forEach((item, index) => {
        console.log(`Item ${index}:`, item);
        console.log(`Item ${index} opened:`, item.opened);
        console.log(`Item ${index} opened type:`, typeof item.opened);
      });
    
      // Filtre directement les items qui ont opened: true
      this.foncierItems = subMenuItems.filter(item => {
        console.log('Filtering item:', item.name, 'opened:', item.opened);
        return item.opened === true;
      });
      
      console.log("Sous-menus chargés uniquement opened :", this.foncierItems);
    });

    console.log("foncierItems de ngOnInit() du component foncier  : ");
    console.log(this.foncierItems);
  }

  
}
