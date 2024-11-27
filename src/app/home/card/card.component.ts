import { Component, OnInit, Input } from '@angular/core';
import { MenuItem } from '../../menuItem';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent implements OnInit {
  @Input() menuItem!: MenuItem;
  @Input() parentItem!: string;
  @Input() parentColor!: string;
  @Input() route!: string;
  @Input() date!: Date;

  isNew: boolean = false;

  ngOnInit(): void {
    // Comparaison de la date de publication

    if (this.menuItem.date_added) {
      const publicationDate = new Date(this.menuItem.date_added);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      this.isNew = publicationDate > oneMonthAgo;
    }
  }
}
