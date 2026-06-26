import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Selector } from '../../../shared/interfaces/selector';
import { DocplanService } from '../docplan.service';
import { EcgPickerComponent } from '../ecg-picker/ecg-picker.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-docplan-research',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './docplan-research.component.html',
  styleUrl: './docplan-research.component.scss',
})
export class DocplanResearchComponent implements OnInit {
  private params: Record<string, string> = {
    annee_deb: '*',
    localisation: '*',
    typ_document: '*',
    actuel: '*',
  };

  public selectors: Selector[] = [];
  private research: DocplanService = inject(DocplanService);
  private dialog: MatDialog = inject(MatDialog);

  public selectorsError: boolean = false;

  constructor(private router: Router) {
    this.research.getSelectors()
      .then((selectors: Selector[]) => {
        const order = ['localisation', 'annee_deb', 'typ_document', 'actuel'];
        this.selectors = selectors.slice().sort((a, b) => {
          const aIndex = order.indexOf(a.name);
          const bIndex = order.indexOf(b.name);
          const safeA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
          const safeB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
          return safeA - safeB;
        });
      })
      .catch((err) => {
        console.error('Impossible de charger les sélecteurs docplan (pgestion/selectors)', err);
        this.selectorsError = true;
      });
  }

  ngOnInit() {}

  selectionSelectors($event: any, selector: string) {
    const optionText = $event.value.name;

    if (selector === optionText) {
      this.params[selector] = '*';
    } else {
      this.params[selector] = optionText;
    }
  }

  docplanSelection() {
    this.router.navigate([
      '/docplan',
      {
        outlets: {
          liste: [
            'filtre',
            this.params['annee_deb'],
            this.params['localisation'].split(' - ')[0],
            this.params['typ_document'],
            this.params['actuel'],
          ],
        },
      },
    ]);
  }

  openEcgManager(): void {
    this.dialog.open(EcgPickerComponent, {
      minWidth: '550px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      hasBackdrop: true,
    });
  }
}
