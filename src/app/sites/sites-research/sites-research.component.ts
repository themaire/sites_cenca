import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';
// import { Observable } from 'rxjs'
import { Selector } from '../selector';

import { SitesService } from '../sites.service';

// formulaire de recherche
import {
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-sites-research',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatIconModule,
    ReactiveFormsModule,
    MatSelectModule,
  ],
  templateUrl: './sites-research.component.html',
  styleUrl: './sites-research.component.scss',
})
export class SitesResearchComponent implements OnInit {
  public selectors: Selector[] = [];
  research: SitesService = inject(SitesService);

  private params: any = {
    type: '*',
    code: '*',
    nom: '*',
    commune: '*',
    milieux_naturels: '*',
    responsable: '*',
  };

  constructor(private router: Router) {
    this.research.getSelectors().then((selectors: Selector[]) => {
      this.selectors = selectors;
      // console.log(this.selectors);
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
  }

  stringChange(event: Event) {
    // Get the new input value

    // console.log(event);

    const newName = (event.target as HTMLInputElement).value;
    const nameField = (event.target as HTMLInputElement).id;
    // console.log(newName);
    // Perform actions based on the new value

    if (newName != '') {
      this.params[nameField] = encodeURIComponent(newName);
      console.log('je mets la bonne valeur ' + encodeURIComponent(newName));
    } else {
      this.params[nameField] = '*';
      console.log('je remets une etoile');
    }
    console.log(this.params[nameField]);

    // console.log('Input value changed:', newName);
    // console.dir(this.params);
    // console.log("Dans nameChange avec " + this.params.type + "/" + this.params.code + "/" + this.params.nom + "/" + this.params.commune + "/" + this.params.milieux_naturels + "/" + this.params.responsable);
  }

  selectionSelectors($event: any, selector: any, index: boolean = false) {
    let selectElement = $event.value;
    // Utilise `selectElement` pour les opérations nécessaires
    console.log('Selected value:', selectElement);

    let optionIndex = selectElement.selectedIndex;
    // console.log(optionIndex);

    let optionText = selectElement;
    console.log(optionText);

    console.log(
      'Avant le IF Dans selection avec ' + selector + '=' + optionText
    );

    if (selector.toLowerCase() === optionText.toLowerCase()) {
      this.params[selector] = '*';
      console.log(this.params[selector]);
      selectElement.style.backgroundColor = '#F5F3F3';
      console.log(
        'Dans le if avec ' + selector + '=' + optionText + ' sélectionné !'
      );
    } else {
      if (index != true) this.params[selector] = encodeURIComponent(optionText);
      else this.params[selector] = encodeURIComponent(optionIndex);
      console.log(this.params[selector]);
      // selectElement.style.backgroundColor = '#76b82a';
    }
    console.dir(this.params);

    // console.log("Dans selection avec " + this.params.type + "/" + this.params.code + "/" + this.params.nom + "/" + this.params.commune + "/" + this.params.milieux_naturels + "/" + this.params.responsable);
  }

  productSelection() {
    // console.log("Dans productSelection avec " + this.params.type + "/" + this.params.code + "/" + this.params.nom + "/" + this.params.commune + "/" + this.params.milieux_naturels + "/" + this.params.responsable);
    // console.log("Liste de sites demandée.");
    this.router.navigate([
      '/sites',
      {
        outlets: {
          liste: [
            'filtre',
            this.params.type,
            this.params.code,
            this.params.nom,
            this.params.commune,
            this.params.milieux_naturels,
            this.params.responsable,
          ],
        },
      },
    ]);
    // this.router.navigate(['sites', {outlets: {'liste': ['filtre']}}]);
    // this.router.navigate(['sites', {outlets: {'liste': ['filtre', this.params.type]}}]);
    // this.router.navigate(['/sites', {outlets: {'display': ['filtre', this.params.type]}}]);
  }

  // Variable pour le FormControl de code.
  codeFormControl = new FormControl('', [
    Validators.minLength(4),
    Validators.pattern('^[0-9]*$'),
    // Ce pattern permet uniquement les chiffres],);
  ]);

  // Variable pour le FormControl de nom.
  nameFormControl = new FormControl('', [Validators.minLength(3)]);
  // Méthode pour réinitialiser le FormControl
  clearCode(type: string) {
    if (type == 'code') {
      this.codeFormControl.setValue('');
    } else if (type == 'nom') {
      this.nameFormControl.setValue('');
    }
    this.params[type] = '*';
  }
}
