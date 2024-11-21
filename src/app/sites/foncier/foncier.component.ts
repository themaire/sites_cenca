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

  menuItems: MenuItem[] = [
    {
      id: 0,
      name: 'Axes du CENCA',
      children: [], // A remplir par le service this.menuService
    },
  ];

  constructor(private menuService: MenuService) {
    
  }

  ngOnInit(): void {
    this.menuService.menuItems$.subscribe((items) => {
      this.menuItems[0].children = items;
    });

    console.log("menuItems de ngOnInit() du component foncier  : ");
    console.log(this.menuItems);
  }

  
}
