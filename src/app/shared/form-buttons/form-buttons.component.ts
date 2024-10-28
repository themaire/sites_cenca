import { ChangeDetectorRef, EventEmitter, Output, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

// import { OperationLite } from '../../sites/site-detail/detail-projets/projet/operation/operations';

@Component({
  selector: 'app-form-buttons',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, MatIcon],
  templateUrl: './form-buttons.component.html',
  styleUrl: './form-buttons.component.scss'
})
export class FormButtonsComponent {
  @Input() iconName!: string;  // Valeur par défaut pour voir si c'est vide
  @Input() isFormValid!: boolean;
  @Input() isActive!: boolean;
  @Input() mode!: String;

  @Output() makeOperationForm = new EventEmitter<{ empty: boolean }>();
  @Output() toggleAction = new EventEmitter<void>(); // Est en fait onToggleEditMode() dans operation.component.ts
  @Output() toggleAction2 = new EventEmitter<void>(); // Est en fait onToggleEditMode() dans operation.component.ts
  @Output() onSubmit = new EventEmitter<void>();

  constructor(private cdr: ChangeDetectorRef) {}
  
  public tooltip: string = "";

  // Ces methodes sont appelées au travers des boutons du HTML
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isFormValid']) {
      console.log('isFormValid has changed:', changes['isFormValid'].currentValue);  // Vérifie la réception de isFormValid
      this.cdr.detectChanges();  // Forcer la détection des changements
    }

    if (changes['isActive']) {
      console.log('isActive du BOUTON has changed:', changes['isActive'].currentValue);
      this.cdr.detectChanges();  // Forcer la détection des changements immédiatement
    }

    if (changes['isAdding']) {
    console.log('isAdding du BOUTON has changed:', changes['isAdding'].currentValue);
      this.cdr.detectChanges();  // Forcer la détection des changements immédiatement
    }
  }

  onToggleAction(): void {
    console.log('-----------------------!!!!!!!!!!!!--------onToggleAction dans le composant bouton');
    console.log('onToggleAction called');
    this.toggleAction.emit();
    this.toggleAction2.emit();
  }

  onAddAction(): void {
    // OnToggleAction sert se servir de la fonction makeOperationForm de operation component
    console.log('-----------------------!!!!!!!!!!!!--------onAddAction');
    this.makeOperationForm.emit({ empty: true }); // On envoie un objet vide
  }

  onSave(): void {
    this.onSubmit.emit();
  }
}