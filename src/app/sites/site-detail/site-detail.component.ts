import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { RouterLink, RouterOutlet } from '@angular/router';

import { Site } from '../site'; // prototype d'un site


@Component({
  selector: 'app-site-detail',
  standalone: true,
  imports: [CommonModule,
            RouterLink, 
            RouterOutlet
            ],
  templateUrl: './site-detail.component.html',
  styleUrl: './site-detail.component.scss'
})
export class SiteDetailComponent implements OnInit{
  @Input() site!: Site; // La liste des sites à afficher


  constructor(private route: ActivatedRoute, 
              private router :Router
              ) {

              }

  ngOnInit(){

    this.route.params.subscribe((params: Params) => {
      console.log("Route param :" + params['uuid_site']);
      console.log(this.route.params);
      
      if (params["uuid_site"] !== undefined) {
        // Cas d'une recherche sur critères
        subroute = "uuid=" + params['uuid_site'];
        
        this.research.getSites(subroute).then((sitesGuetted: Site[]) => {
          this.sites = sitesGuetted;
          console.log(this.sites);
        });
      }     

    });
  }


}