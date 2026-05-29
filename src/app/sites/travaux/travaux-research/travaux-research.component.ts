import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Selector } from '../../../shared/interfaces/selector';
import { TravauxService } from '../travaux.service';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-travaux-research',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './travaux-research.component.html',
  styleUrl: './travaux-research.component.scss',
})
export class TravauxResearchComponent implements OnInit {
  private params: Record<string, string> = {
    annee: '*',
    responsable: '*',
    localisation: '*',
    statut: '*',
  };

  public selectors: Selector[] = [];
  private research: TravauxService = inject(TravauxService);

  constructor(private router: Router) {
    this.research.getSelectors().then((selectors: Selector[]) => {
      const order = ['localisation', 'annee', 'responsable', 'statut'];
      this.selectors = selectors.slice().sort((a, b) => {
        const aIndex = order.indexOf(a.name);
        const bIndex = order.indexOf(b.name);
        const safeA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
        const safeB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
        return safeA - safeB;
      });
    });
  }

  ngOnInit() {}

  selectionSelectors($event: any, selector: string) {
    console.log('$event.value : ', $event.value);

    const optionText = $event.value.name;

    if (selector === optionText) {
      this.params[selector] = '*';
    } else {
      // Keep raw text; Angular router will handle URL encoding.
      this.params[selector] = optionText;
    }
  }

  travauxSelection() {
    this.router.navigate([
      '/travaux',
      {
        outlets: {
          liste: [
            'filtre',
            this.params['annee'],
            this.params['responsable'],
            // Pour la localisation on veut garder le code site en enlevant le nom du site apres ' - '
            this.params['localisation'].split(' - ')[0],
            this.params['statut'],
          ],
        },
      },
    ]);
  }
}
