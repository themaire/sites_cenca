import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { RouterLink, RouterOutlet } from '@angular/router';

import { ListSite } from '../site'; // prototype d'un site
import { SitesService } from '../sites.service'; // service de données
import { SiteDetailComponent } from '../site-detail/site-detail.component'; // service de données


@Component({
  selector: 'app-sites-display',
  standalone: true,
  imports: [CommonModule,
            RouterLink, RouterOutlet,
            SiteDetailComponent
            ],
  templateUrl: './sites-display.component.html',
  styleUrl: './sites-display.component.scss'
})
export class SitesDisplayComponent implements OnInit{
  public sites: ListSite[] = []; // La liste des sites à afficher
  public selectedSite?: ListSite;
  research: SitesService = inject(SitesService);

  listTheaders: Array<string> = ["--", "Codes", "Nom", "Status", "Communes(s)", "Milieux naturels", "Bassin agence", "Responsable",]

  constructor(private route: ActivatedRoute, private router :Router ) {}

  ngOnInit(){
    // Rechercher et obtenir une liste de sites selon des critères passés en paramètre via la route.
    this.route.params.subscribe((params: Params) => {
      // console.log("Route param type :" + params['type']);
      // console.log(this.route.params);
      let subroute: string = "";
      
      if (params["type"] !== undefined) {
        // Cas d'une recherche sur critères
        subroute = "criteria/" + params['type']
                        + "/" + params['code' ]
                        + "/" + params['nom']
                        + "/" + params['commune']
                        + "/" + params['milieux_naturels']
                        + "/" + params['responsable'];
        
        this.research.getSites(subroute).then((sitesGuetted: ListSite[]) => {
          this.sites = sitesGuetted;
          // console.log(this.sites);

        });
      }
    //   // else{
    //   //   // Cas d'une recherche avec des mots-clés,
    //   //   // voir la section suivante
    //   //   subroute = "keyword?" + params["terms"].split(" ").join("&");

    });
  }

  onSelect(site: ListSite): void {
    // Sert au bouton qui fait rentrer dans le detail d'un site.
    // LE SITE SELECTIONNE PAR L'UTILISATEUR dans la variable selectedSite

    // Si this.selectedSite == undefined on affiche la liste de sites
    // Si this.selectedSite == "un site" on le detail du site

    // Ca se passe dans la vue du component sites-display 
    this.selectedSite = site;
  }

  resetSelected(): void {
    // Remettre à zéro pour justement vider la variable pour ré afficher la liste
    // des sites.

    // !!! Cette fonction est utilisé (un bouton retour) dans le sous component site-detail
    // pour quitter la vue "detail". 
    this.selectedSite = undefined;
  }
}