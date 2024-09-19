import { Component, OnInit, OnChanges, inject, Input, Output, EventEmitter, SimpleChanges, SimpleChange } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterLink, RouterOutlet } from '@angular/router';

import {MatTabsModule} from '@angular/material/tabs';

import { ListSite } from '../site'; // prototype d'un site
import { DetailSite } from '../site-detail';
import { SitesService } from '../sites.service'; // service de données

import { DetailInfosComponent } from './detail-infos/detail-infos.component'; // service de données
import { DetailDescriptionComponent } from './detail-description/detail-description.component'; // service de données
import { DetailMfuComponent } from './detail-mfu/detail-mfu.component'; // service de données
import { DetailGestionComponent } from './detail-gestion/detail-gestion.component'; // service de données
import { DetailHabitatsComponent } from './detail-habitats/detail-habitats.component'; // service de données
import { DetailProjetsComponent } from './detail-projets/detail-projets.component'; // service de données

// Composant qui affiche une fiche site (6 sous-composants).

@Component({
  selector: 'app-site-detail',
  standalone: true,
  imports: [CommonModule,
            RouterLink, 
            RouterOutlet,
            
            MatTabsModule,

            DetailInfosComponent, DetailDescriptionComponent,
            DetailMfuComponent, DetailGestionComponent,
            DetailHabitatsComponent, DetailProjetsComponent
            ],
  templateUrl: './site-detail.component.html',
  styleUrl: './site-detail.component.scss'
})
export class SiteDetailComponent {
  @Input() site?: ListSite; // Le site selectionné pour voir son détail
  @Output() selectedSite = new EventEmitter<Object>(); // Utiliser cette variable provenent du composant parent
  
  public siteDetail!: DetailSite;
  resetSelectedd(): void {
    // Assigne la valeur "undefined" à la variable selectedSite
    // qui se trouve dans le component parent "site-display" :-)
    // D'où le @output en ligne 22 pour la déclaration de selectedSite
    // dans CE component.
    this.selectedSite.emit(undefined);
  }

  research: SitesService = inject(SitesService);

  constructor(private route: ActivatedRoute, 
              private router :Router
              ) {

              }

  ngOnChanges(changes: SimpleChanges){
    // Ce component est chargé en meme temps que sitesDisplay. Vide et non visible.
    // Le chargement des details à afficher se fait par la suite, d'où le OnChanges.

    // for (let propName in changes) {  
    //   console.log('propname :' + propName)
    //   let change = changes[propName];
    //   let curVal  = JSON.stringify(change.currentValue);
    //   console.log(curVal);
    //   // console.log(curVal);

    //   let prevVal = JSON.stringify(change.previousValue);
    //   console.log(prevVal);
    // }
    

    let subroute: string = "";
    
    if (this.site !== undefined) {
      // Cas d'une recherche sur critères
      subroute = "uuid=" + this.site["uuid_site"];

      console.log("Ouais on est dans le OnChanges de site-detail. UUID : " + this.site["uuid_site"]);
      // console.log(this.site);
      
      this.research.getSiteUUID(subroute).then((siteGuetted) => {
        this.siteDetail = siteGuetted;
      });
      
    }

  }

  
}