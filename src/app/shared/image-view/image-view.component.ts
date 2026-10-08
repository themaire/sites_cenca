import { environment } from '../../../environments/environment';
import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '../../../../node_modules/@angular/common';
import { LoginService } from '../../login/login.service';
import {MatIconModule} from '@angular/material/icon';
import {
  MatDialogRef,
  MatDialogModule,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { DocfileService } from '../services/docfile.service';

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

  // Zoom : clic sur l'image = taille réelle centrée sur le point cliqué, re-clic = image entière
  @ViewChild('frame') frame?: ElementRef<HTMLDivElement>;
  isZoomed = false;
  zoomedWidth = 0;
  isDragging = false;
  private dragStart?: { x: number; y: number; left: number; top: number };
  private hasDragged = false;
  constructor(
    public dialogRef: MatDialogRef<ImageViewComponent>,
    public loginService: LoginService,
    private http: HttpClient,
    private docfileService: DocfileService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: DialogData // Inject MAT_DIALOG_DATA to access the passed data
  ) {
    // data.images et data.selected sont des doc_path complets (ex: photos/travaux/avant/doc_xxx.jpeg)
    this.images = (data.images || []).map((path) => this.docfileService.getPhotoUrl(path));
    // Si une image est sélectionnée au départ
    this.currentIndex = Math.max(data.images?.indexOf(data.selected) ?? 0, 0);
  }
  prev() {
    this.resetZoom();
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.images.length - 1; // boucle sur la dernière
    }
  }

  next() {
    this.resetZoom();
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0; // boucle sur la première
    }
  }
  goTo(index: number) {
    this.resetZoom();
    this.currentIndex = index;
  }

  resetZoom() {
    this.isZoomed = false;
    this.isDragging = false;
  }

  /** Bascule entre l'image entière et l'image en taille réelle, en gardant le point cliqué sous le curseur */
  toggleZoom(event: MouseEvent) {
    // Un glisser-déplacer de l'image zoomée ne doit pas dézoomer
    if (this.hasDragged) {
      this.hasDragged = false;
      return;
    }
    if (this.isZoomed) {
      this.resetZoom();
      return;
    }

    const img = event.target as HTMLImageElement;
    const frame = this.frame?.nativeElement;
    if (!frame || !img.naturalWidth) return;

    // Zone réellement peinte de l'image (object-fit: contain laisse des bandes autour)
    const rect = img.getBoundingClientRect();
    const scale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
    const paintedW = img.naturalWidth * scale;
    const paintedH = img.naturalHeight * scale;
    const relX = Math.min(Math.max((event.clientX - rect.left - (rect.width - paintedW) / 2) / paintedW, 0), 1);
    const relY = Math.min(Math.max((event.clientY - rect.top - (rect.height - paintedH) / 2) / paintedH, 0), 1);

    // Taille réelle, ou x2 si la photo est à peine plus grande que le cadre
    this.zoomedWidth = Math.max(img.naturalWidth, paintedW * 2);
    const zoomedH = this.zoomedWidth * (img.naturalHeight / img.naturalWidth);
    this.isZoomed = true;
    this.cdr.detectChanges();

    const frameRect = frame.getBoundingClientRect();
    frame.scrollLeft = relX * this.zoomedWidth - (event.clientX - frameRect.left);
    frame.scrollTop = relY * zoomedH - (event.clientY - frameRect.top);
  }

  onMouseDown(event: MouseEvent) {
    if (!this.isZoomed || !this.frame) return;
    event.preventDefault(); // évite le glisser natif de l'image
    const frame = this.frame.nativeElement;
    this.dragStart = { x: event.clientX, y: event.clientY, left: frame.scrollLeft, top: frame.scrollTop };
    this.hasDragged = false;
  }

  onMouseMove(event: MouseEvent) {
    if (!this.dragStart || !this.frame) return;
    const dx = event.clientX - this.dragStart.x;
    const dy = event.clientY - this.dragStart.y;
    if (!this.hasDragged && Math.abs(dx) + Math.abs(dy) > 5) {
      this.hasDragged = true;
      this.isDragging = true;
    }
    if (this.hasDragged) {
      this.frame.nativeElement.scrollLeft = this.dragStart.left - dx;
      this.frame.nativeElement.scrollTop = this.dragStart.top - dy;
    }
  }

  onMouseUp() {
    this.dragStart = undefined;
    this.isDragging = false;
  }

  /** Sortie du cadre pendant un glisser : aucun clic ne suivra, on oublie le glisser */
  onMouseLeave() {
    this.onMouseUp();
    this.hasDragged = false;
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
