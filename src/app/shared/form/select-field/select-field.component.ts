import { Component, Input, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, ControlContainer, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatInputModule],
  templateUrl: './select-field.component.html',
  styleUrls: ['./select-field.component.scss'],
})
export class SelectFieldComponent {
  @Input() label: string = '';
  @Input() controlName: string = '';
  @Input() options: any[] = [];
  @Input() valueKey: string = 'cd_type';
  @Input() displayKey: string = 'libelle';
  @Input() isEdit: boolean = true;

  constructor(@Optional() private controlContainer: ControlContainer) {}

  get control(): FormControl | null {
    if (!this.controlContainer || !this.controlName) return null;
    const parentForm = (this.controlContainer as any).control;
    if (!parentForm) return null;
    return parentForm.get(this.controlName) as FormControl;
  }

  getDisplayValue(): string {
    if (!this.control) return '';
    const val = this.control.value;
    if (val === null || val === undefined || val === '') return '';
    const found = (this.options || []).find(o => o && o[this.valueKey] == val);
    if (found) return found[this.displayKey] ?? String(val);
    return String(val);
  }
}
