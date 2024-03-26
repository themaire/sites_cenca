import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DetailSite } from '../../site-detail';

@Component({
  selector: 'app-detail-infos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-infos.component.html',
  styleUrl: './detail-infos.component.scss'
})
export class DetailInfosComponent {
  @Input() inputDetail?: DetailSite; // Le site selectionné pour voir son détail



  constructor(    ) {

    }
  

  ngOnChanges(){

    // console.log("Valeur de input vers detail-infos : ");
    // // console.log("grosdetail est : " + this.inputDetail['code']);
    // for(let detail in this.inputDetail){
    //   console.log(detail);
    // }

  }

}