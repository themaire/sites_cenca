import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { SitesService } from '../../../sites.service';
import { Selector } from '../../../selector';

// Formulaire de recherche
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
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-projets-search',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatIconModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './projets-search.component.html',
  styleUrl: './projets-search.component.scss',
})
export class ProjetsSearchComponent implements OnInit {
  private params: any = {
    annee: '*',
    responsable: '*',
    statut: '*',
    generation: '*',
  };

  public selectors: Selector[] = [];
  research: SitesService = inject(SitesService);

  constructor(private router: Router) {
    // TODO: Adapter pour récupérer les sélecteurs spécifiques aux projets
    this.research.getSelectors('projets').then((selectors: Selector[]) => {
        this.selectors = selectors;
        // Pas pertinent (commenté le 20/11/2025): Filtrer pour ne garder que les sélecteurs pertinents pour les projets
        //   this.selectors = selectors.filter(s => 
        //     ['responsable', 'statut'].includes(s.name.toLowerCase())
        //   );
    });
  }

  ngOnInit() {
    // Initialisation si nécessaire
  }

  stringChange(event: Event) {
    const newValue = (event.target as HTMLInputElement).value;
    const fieldName = (event.target as HTMLInputElement).id;

    if (newValue !== '') {
      this.params[fieldName] = encodeURIComponent(newValue);
    } else {
      this.params[fieldName] = '*';
    }
  }

  selectionSelectors($event: any, selector: any) {
    const optionValue = $event.value.name;

    if (selector === optionValue) {
      // Réinitialiser à '*' si on sélectionne l'option par défaut
      this.params[selector] = '*';
    } else {
      this.params[selector] = encodeURIComponent(optionValue);
    }
  }

  projetSelection() {
    // Navigation vers le outlet avec les paramètres de filtre
    this.router.navigate([
      '/sites/detail',
      {
        outlets: {
          listeProjets: [
            'filtre',
            this.params.annee,
            this.params.responsable,
            this.params.statut,
            this.params.generation,
          ],
        },
      },
    ]);
  }

  // FormControl pour l'année
  anneeFormControl = new FormControl('', [
    Validators.minLength(4),
    Validators.maxLength(4),
    Validators.pattern('^[0-9]{4}$'),
  ]);

  // Méthode pour réinitialiser les champs
  clearField(fieldType: string) {
    if (fieldType === 'annee') {
      this.anneeFormControl.setValue('');
    }
    this.params[fieldType] = '*';
  }
}
