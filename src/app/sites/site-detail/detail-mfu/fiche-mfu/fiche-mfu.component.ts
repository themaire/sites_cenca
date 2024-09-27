import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FicheMFU } from '../acte';
import {
  MatDialog,
  MatDialogModule,
  MatDialogTitle,
  MatDialogContent,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

@Component({
  selector: 'app-fiche-mfu',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './fiche-mfu.component.html',
  styleUrl: './fiche-mfu.component.scss',
})
export class FicheMfuComponent {
  public ficheMfu!: FicheMFU;

  constructor(@Inject(MAT_DIALOG_DATA) public data: FicheMFU) {
    this.ficheMfu = data;
  }
}
