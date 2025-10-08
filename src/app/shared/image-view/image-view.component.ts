import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '../../../../node_modules/@angular/common';
import { LoginService } from '../../login/login.service';
import {MatIconModule} from '@angular/material/icon';
import {
  MatDialogRef,
  MatDialogModule,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

interface DialogData {
  images: string[];
  selected: string;
}
@Component({
  selector: 'app-image-view',
  standalone: true,
  imports: [MatDialogModule, CommonModule, MatIconModule],
  templateUrl: './image-view.component.html',
  styleUrl: './image-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageViewComponent {
  images: string[];
  currentIndex: number = 0;
  constructor(
    public dialogRef: MatDialogRef<ImageViewComponent>,
    public loginService: LoginService,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: DialogData // Inject MAT_DIALOG_DATA to access the passed data
  ) {
    this.images =
      data.images.map((path) => 'http://localhost:8887/app/' + path.split('\\').slice(-2).join('/')) || [];
    // Si une image est sélectionnée au départ
    data.selected = 'http://localhost:8887/app/' + data.selected.split('\\').slice(-2).join('/');
    this.currentIndex = this.images.indexOf(data.selected) || 0;
  }
  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.images.length - 1; // boucle sur la dernière
    }
  }

  next() {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0; // boucle sur la première
    }
  }
  saveImage(imagePath: string) {
    this.http.get(imagePath, { responseType: 'blob' }).subscribe((blob) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = imagePath.split('/').pop() || 'image';
    link.click();
    window.URL.revokeObjectURL(url);
  });
  }
  ngOnInit() {
    console.log(this.currentIndex);
    console.log(this.images);
  }
}
