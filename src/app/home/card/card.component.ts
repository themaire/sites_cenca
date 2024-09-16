import { Component, input, Input } from '@angular/core';
import { MenuItem } from '../../menuItem';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  @Input() menuItem!: MenuItem;
  @Input() parentItem!: string;
  @Input() parentColor!: string;
}
