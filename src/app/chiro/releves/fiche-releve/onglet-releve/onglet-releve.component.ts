import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { DetailReleve } from '../../../interfaces/releve';

@Component({
  selector: 'app-onglet-releve',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './onglet-releve.component.html',
  styleUrl: './onglet-releve.component.scss',
})
export class OngletReleveComponent {
  @Input() releve!: DetailReleve;
}
