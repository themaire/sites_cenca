import { ChangeDetectorRef, EventEmitter, Output, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

import { OperationLite } from '../../sites/site-detail/detail-projets/projet/operation/operations';

@Component({
  selector: 'app-form-buttons',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, MatIcon],
  templateUrl: './form-buttons.component.html',
  styleUrl: './form-buttons.component.scss'
})
export class FormButtonsComponent {
  @Input() icone!: string;  // Valeur par défaut pour voir si c'est vide
  @Input() isFormValid!: boolean;
  @Input() isAddActive: boolean = false;  // Valeur par défaut pour voir si c'est vide
  @Input() isEditActive: boolean = false;  // Valeur par défaut pour voir si c'est vide


  @Output() makeOperationForm = new EventEmitter<{ operation?: OperationLite; empty: boolean }>();
  @Output() toggleAction = new EventEmitter<String>(); // Est en fait onToggleEditMode() dans operation.component.ts
  @Output() onSubmit = new EventEmitter<String>();

  constructor(private cdr: ChangeDetectorRef) {}
  
  public tooltip: string = "";

  // Ces methodes sont appelées au travers des boutons du HTML
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isFormValid']) {
      console.log('isFormValid has changed:', changes['isFormValid'].currentValue);  // Vérifie la réception de isFormValid
      this.cdr.detectChanges();  // Forcer la détection des changements
    }

    if (changes['isAddActive']) {
      console.log('isAddActive du BOUTON has changed:', changes['isAddActive'].currentValue);
      this.cdr.detectChanges();  // Forcer la détection des changements immédiatement
    }

    if (changes['isEditActive']) {
    console.log('isEditActive du BOUTON has changed:', changes['isEditActive'].currentValue);
      this.cdr.detectChanges();  // Forcer la détection des changements immédiatement
    }
  }

  // Attention ici this.icone determine le comportement des methodes appelées !!!

  onToggleAction(): void {
    console.log('-----------------------!!!!!!!!!!!!--------onToggleAction dans le composant bouton');
    this.toggleAction.emit(this.icone); // Le nom de l'icon determine quel booléen est modifié
  }

  onCancelAction(): void {
    console.log('-----------------------!!!!!!!!!!!!--------onCancelAction dans le composant bouton');
    this.toggleAction.emit(); // Le nom de l'icon determine quel booléen est modifié
  }

  onSave(): void {
    console.log("Va utiliser this.onSubmit.emit('" + this.icone + "'); depuis le bouton sauvegarder");
    this.onSubmit.emit(this.icone);
  }
}