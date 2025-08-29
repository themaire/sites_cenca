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

  foncierItems!: MenuItem[];



  constructor(private menuService: MenuService) {
    
  }

  ngOnInit(): void {
    // this.menuService.menuItems$.subscribe((items) => {
    //   this.menuItems[0].children = items;
    // });

    this.menuService.loadSubMenuItem(10).then((subMenuItems) => {
      this.foncierItems = subMenuItems;
      console.log("Sous-menus chargés :", subMenuItems);
    });

    console.log("foncierItems de ngOnInit() du component foncier  : ");
    console.log(this.foncierItems);
  }

  
}
