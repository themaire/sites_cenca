import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { RouterLink, RouterOutlet } from '@angular/router';

import { Site } from '../site'; // prototype d'un site
import { SitesService } from '../sites.service'; // service de données
// import { Observable } from 'rxjs';

@Component({
  selector: 'app-sites-display',
  standalone: true,
  imports: [CommonModule,
            RouterLink, 
            RouterOutlet
            ],
  templateUrl: './sites-display.component.html',
  styleUrl: './sites-display.component.scss'
})
export class SitesDisplayComponent implements OnInit{
  public sites: Site[] = []; // La liste des sites à afficher
  research: SitesService = inject(SitesService);

  constructor(private route: ActivatedRoute, private router :Router ) {}

  ngOnInit(){

    this.route.params.subscribe((params: Params) => {
      console.log("Route param :" + params['type']);
      console.log(this.route.params);
      let subroute: string = "";
      
      if (params["type"] !== undefined) {
        // Cas d'une recherche sur critères
        subroute = "criteria/" + params['type']
                        + "/" + params['code' ]
                        + "/" + params['nom']
                        + "/" + params['commune']
                        + "/" + params['milieux_naturels']
                        + "/" + params['responsable'];
        
        this.research.getSites(subroute).then((sitesGuetted: Site[]) => {
          this.sites = sitesGuetted;
          console.log(this.sites);
          // for(let i of sites){
          //   console.log(i);
          //   console.log(typeof i);
          // }
        });
      }
    //   // else{
    //   //   // Cas d'une recherche avec des mots-clés,
    //   //   // voir la section suivante
    //   //   subroute = "keyword?" + params["terms"].split(" ").join("&");

     

    });
  }

  productSelection(uuid: string) {
    this.router.navigate(['/sites', {outlets: {'detail': ['uuid', uuid]}}]);
  }

}