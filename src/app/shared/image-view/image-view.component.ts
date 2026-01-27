import { environment } from '../../../environments/environment';
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
  // Pour rappel activeUrl se termine par /
  // est en fonction si on est en dev Windows, dev Linux ou en prod Linux
  private activeUrl: string = environment.apiBaseUrl;

  images: string[];
  currentIndex: number = 0;
  constructor(
    public dialogRef: MatDialogRef<ImageViewComponent>,
    public loginService: LoginService,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: DialogData // Inject MAT_DIALOG_DATA to access the passed data
  ) {
    const baseUrl = this.activeUrl + 'files/photos/';
    // On adapte les chemins des images en fonction de l'environnement
    this.images = data.images.map((path) => baseUrl + path.split( environment.pathSep ).slice(-2).join( environment.pathSep )) || [];
    // Si une image est sélectionnée au départ
    data.selected = baseUrl + data.selected.split( environment.pathSep ).slice(-2).join( environment.pathSep );
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
