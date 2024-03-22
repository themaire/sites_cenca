import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';
// import { Observable } from 'rxjs'
import { Selector } from '../selector';


import { SitesService } from '../sites.service';

@Component({
  selector: 'app-sites-research',
  standalone: true,
  imports: [CommonModule
  ],
  templateUrl: './sites-research.component.html',
  styleUrl: './sites-research.component.scss'
})
export class SitesResearchComponent implements OnInit {
  public selectors: Selector[] = [];
  research: SitesService = inject(SitesService);

  private params :any = {"type":"*", "code":"*", "nom":"*", "commune":"*", "milieux_naturels":"*", "responsable":"*",};  
  
  constructor( private router :Router ) {
    this.research.getSelectors().then((selectors: Selector[]) => {
      this.selectors = selectors;
      console.log(this.selectors);
    });
  }

  // getSelectors(): void {
  //   this.selectors = this.research.getSites("selectors");
  // }

  ngOnInit() {
    // this.getSelectors();

    // this.research.getSelectors() // va appeller la route /sites/selector
    //     .subscribe(
    //                 // res => console.log(res),
    //                 res => this.selectors = res,
    //                 err => console.error(err),
    //                 ()  => console.log('getProducts("selectors") done')
    //               );
    // console.log(this.selectors);

  };
  
  stringChange(event: Event) {
    // Get the new input value
    
    // console.log(event);

    const newName = (event.target as HTMLInputElement).value;
    const nameField = (event.target as HTMLInputElement).id;
    
    // Perform actions based on the new value
    this.params[nameField] = encodeURIComponent( newName );
    // console.log('Input value changed:', newName);
    // console.dir(this.params);
    // console.log("Dans nameChange avec " + this.params.type + "/" + this.params.code + "/" + this.params.nom + "/" + this.params.commune + "/" + this.params.milieux_naturels + "/" + this.params.responsable);

  }

  selectionSelectors($event: any, selector: any, index: boolean = false) {
    let selectElement = $event.target;
    let optionIndex = selectElement.selectedIndex;
    // console.log(optionIndex);

    let optionText = selectElement.options[optionIndex].text;
    // console.log(optionText);

    let optionValue = selectElement.options[optionIndex].value;
    // console.log(optionValue);


    // console.log("Dans selection avec "+selector+"="+ optionText + " sélectionné !");

    if (selector == optionText) {
      this.params[selector] = "*";
      selectElement.style.backgroundColor = "#F5F3F3";
    }else{
      if(index != true) this.params[selector] = encodeURIComponent( optionText );
      else this.params[selector] = encodeURIComponent( optionIndex );
      selectElement.style.backgroundColor = "#76b82a";
    }
    // console.dir(this.params);
    
    // console.log("Dans selection avec " + this.params.type + "/" + this.params.code + "/" + this.params.nom + "/" + this.params.commune + "/" + this.params.milieux_naturels + "/" + this.params.responsable);
    
  }
  
  productSelection() {
    // console.log("Dans productSelection avec " + this.params.type + "/" + this.params.code + "/" + this.params.nom + "/" + this.params.commune + "/" + this.params.milieux_naturels + "/" + this.params.responsable);
    // console.log("Liste de sites demandée.");
    this.router.navigate(['/sites', {outlets: {'liste': ['filtre', this.params.type, this.params.code, this.params.nom, this.params.commune, this.params.milieux_naturels, this.params.responsable]}}]);
    // this.router.navigate(['sites', {outlets: {'liste': ['filtre']}}]);
    // this.router.navigate(['sites', {outlets: {'liste': ['filtre', this.params.type]}}]);
    // this.router.navigate(['/sites', {outlets: {'display': ['filtre', this.params.type]}}]);
  }

}