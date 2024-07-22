import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { RouterLink, RouterOutlet } from '@angular/router';

import { ListSite } from '../site'; // prototype d'un site
import { SitesService } from '../sites.service'; // service de données
import { SiteDetailComponent } from '../site-detail/site-detail.component'; // service de données

import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';

@Component({
  selector: 'app-sites-display',
  standalone: true,
  imports: [CommonModule,
            RouterLink, RouterOutlet,
            SiteDetailComponent, 

            MatTableModule, 

            MatFormFieldModule, MatInputModule, 
            
            // MatSortModule, 
            MatPaginatorModule
            ],
  templateUrl: './sites-display.component.html',
  styleUrl: './sites-display.component.scss'
})
export class SitesDisplayComponent {
  public sites: ListSite[] = []; // La liste des sites à afficher
  public selectedSite?: ListSite;

  // Pour la liste des sites : le tableau Material
  public dataSource!: MatTableDataSource<ListSite>;
  public displayedColumns: string[] = ['code', 'nom', 'statut', 'communes', 'milieux_naturels', 'bassin_agence', 'responsable',];
  // listTheaders: Array<string> = ["--", "Codes", "Nom", "Status", "Communes(s)", "Milieux naturels", "Bassin agence", "Responsable",]

  @ViewChild(MatPaginator, {static: false})
  set paginator(value: MatPaginator) {
    if (this.dataSource){
      this.dataSource.paginator = value;
    }
  }

  research: SitesService = inject(SitesService);

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
          this.dataSource = new MatTableDataSource(this.sites);
          this.dataSource.paginator = this.paginator
        });
      }

    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;

    console.log(filterValue.trim().toLowerCase())
    this.dataSource.filter = filterValue.trim().toLowerCase();
    console.log("datasource filtrée : " + this.dataSource);
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onSelect(site: ListSite): void {
    // Sert au bouton qui fait rentrer dans le detail d'un site.
    // LE SITE SELECTIONNE PAR L'UTILISATEUR dans la variable selectedSite

    // Si this.selectedSite == undefined on affiche la liste de sites
    // Si this.selectedSite == "un site" on le detail du site

    // Ca se passe dans la vue du component sites-display 
    if(site.uuid_site !== undefined){
      this.selectedSite = site;
    }else{
      console.log("Pas de uuid pour afficher le site : " + site.uuid_site);
    }
  }

  resetSelected(): void {
    // Remettre à zéro pour justement vider la variable pour ré afficher la liste
    // des sites.

    // !!! Cette fonction est utilisé (un bouton retour) dans le sous component site-detail
    // pour quitter la vue "detail". 
    this.selectedSite = undefined;
  }
}