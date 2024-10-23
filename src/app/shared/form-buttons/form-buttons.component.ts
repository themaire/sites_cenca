import { ChangeDetectorRef, EventEmitter, Output, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-form-buttons',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, MatIcon],
  templateUrl: './form-buttons.component.html',
  styleUrl: './form-buttons.component.scss'
})
export class FormButtonsComponent {
  @Input() iconName: string = 'save';  // Valeur par défaut pour voir si c'est vide
  @Input() isFormValid!: boolean;
  @Input() isActive!: boolean;

  @Output() toggleAddingOperation = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<void>();

  constructor(private cdr: ChangeDetectorRef) {}
  
  public tooltip: string = "";

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isFormValid']) {
      console.log('isFormValid has changed:', changes['isFormValid'].currentValue);  // Vérifie la réception de isFormValid
      this.cdr.detectChanges();  // Forcer la détection des changements
    }

    if (changes['isActive']) {
      console.log('isActive has changed:', changes['isActive'].currentValue);
      this.cdr.detectChanges();  // Forcer la détection des changements immédiatement
    }
  }

  onToggleAction(): void {
    this.toggleAddingOperation.emit();
  }

  onSave(): void {
    this.onSubmit.emit();
  }
}