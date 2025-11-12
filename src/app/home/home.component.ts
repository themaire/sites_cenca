import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MenuItem } from '../menuItem';
import { CardComponent } from './card/card.component';

import { MapComponent } from '../map/map.component';
import { LoginService } from '../login/login.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, CardComponent, MapComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  menuItems!: MenuItem[];

  constructor(
    private route: ActivatedRoute,
    public loginService: LoginService,
  ) {
    // console.log("loginService.user()?.nom " + loginService.user()?.nom);
    // console.log("loginService.user()?.nom " + loginService.user()?.gro_id);
  }

  ngOnInit(): void {

    /**
     * Filtre les éléments de menu pour ne garder que ceux avec `accueil: true`.
     * Utilise une fonction récursive pour parcourir tous les niveaux de la hiérarchie.
     */
    this.route.data.subscribe((data) => {
      // console.log("Données résolues reçues dans HomeComponent :", data['menuItems']);
      
      // Fonction récursive pour parcourir tous les niveaux
      const findAccueilItems = (items: MenuItem[]): MenuItem[] => {
        let result: MenuItem[] = [];
        
        for (const item of items) {
          // Si l'item a accueil: true, on l'ajoute
          if (item.accueil === true) {
            if ((item.class_color?.split('-').length ?? 0) > 1) {
              item.parent_name = item.class_color?.split('-').slice(1).join(' ').replace(/^\w/, l => l.toUpperCase());
            } else if ((item.class_color?.split('-').length ?? 0) === 1) {
              item.parent_name = item.class_color?.replace(/^\w/, l => l.toUpperCase());
            }
            result.push(item);
          }
          
          // Si l'item a des enfants, on les parcourt récursivement
          if (item.children && item.children.length > 0) {
            result = result.concat(findAccueilItems(item.children));
          }
        }
        
        return result;
      };
      
      // Applique la fonction récursive sur toutes les données
      this.menuItems = findAccueilItems(data['menuItems']);
    });
    
    console.log("Menu items filtré avec les acceuils is true :", this.menuItems);
  }
}
