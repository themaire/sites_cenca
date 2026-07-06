import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ListSiteChiro } from '../../interfaces/site-chiro';

@Component({
  selector: 'app-dialog-select-site',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatAutocompleteModule, MatButtonModule, MatDialogModule,
    MatFormFieldModule, MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Choisir un site</h2>
    <mat-dialog-content>
      <mat-form-field style="width: 100%; min-width: 340px">
        <mat-label>Rechercher par code ou nom</mat-label>
        <input matInput [(ngModel)]="searchText" [matAutocomplete]="auto"
               (ngModelChange)="filter()" placeholder="ex: CH51, Grotte…">
        <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayFn"
                          (optionSelected)="onSelect($event.option.value)">
          <mat-option *ngFor="let s of filtered" [value]="s">
            <span style="font-weight:500">{{ s.code }}</span>
            <span style="margin-left:8px;color:#666">{{ s.nom }}</span>
          </mat-option>
        </mat-autocomplete>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
    </mat-dialog-actions>
  `,
})
export class DialogSelectSiteComponent {
  sites: ListSiteChiro[];
  filtered: ListSiteChiro[];
  searchText = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) data: { sites: ListSiteChiro[] },
    private dialogRef: MatDialogRef<DialogSelectSiteComponent>,
  ) {
    this.sites = data.sites;
    this.filtered = [...data.sites];
  }

  filter() {
    const term = this.searchText.toLowerCase();
    this.filtered = term
      ? this.sites.filter(s =>
          s.nom.toLowerCase().includes(term) || s.code.toLowerCase().includes(term))
      : [...this.sites];
  }

  onSelect(site: ListSiteChiro) {
    this.dialogRef.close(site);
  }

  displayFn(site: ListSiteChiro | string): string {
    if (!site) return '';
    if (typeof site === 'string') return site;
    return `${site.code} — ${site.nom}`;
  }
}
