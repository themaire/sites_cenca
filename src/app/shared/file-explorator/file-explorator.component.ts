import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
  Input,
} from '@angular/core';
import { environment } from '../../../environments/environment';
import { MatIconModule } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import {
  Observable,
  BehaviorSubject,
  tap,
  catchError,
  lastValueFrom,
} from 'rxjs';
import { SafeResourceUrl } from '@angular/platform-browser';
import { DomSanitizer } from '@angular/platform-browser';
import { DocfileService } from '../services/docfile.service';
import { CommonModule, NgClass, NgIf, NgFor } from '@angular/common';
import { SelectValue } from '../interfaces/formValues';
import { HttpClient } from '@angular/common/http';
import { renderAsync } from 'docx-preview';
import { MatDialog } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { ImageViewComponent } from '../image-view/image-view.component';

export interface Folder {
  cd_type: number;
  path: string;
  name: string;
  numberElements?: number;
}
@Component({
  selector: 'app-file-explorator',
  standalone: true,
  imports: [
    MatListModule,
    NgClass,
    NgIf,
    NgFor,
    CommonModule,
    MatIconModule,
    MatButton,
  ],
  templateUrl: './file-explorator.component.html',
  styleUrl: './file-explorator.component.scss',
})
export class FileExploratorComponent {
  selectedFolder?: number;
  folders: Folder[] = [];
  galerie?: string[];
  doc_types?: SelectValue[];
  filePathList: string[] = [];
  @ViewChild('docxContainer', { static: false })
  docxContainer!: ElementRef<HTMLDivElement>;
  previewUrl?: SafeResourceUrl;
  isDocxView = false;
  pdfUrl?: string;
  imageUrl?: string;
  currentDocxUrl?: string;
  imagePathList?: string[];
  filesNames: string[][] = [];
  fileErrors: Record<string, string[]> = {};
  private foldersSubject = new BehaviorSubject<Folder[]>([]);
  folders$ = this.foldersSubject.asObservable();

  // Pour rappel activeUrl se termine par /
  // est en fonction si on est en dev Windows, dev Linux ou en prod Linux
  private activeUrl: string = environment.apiBaseUrl;

  separator: string = environment.pathSep;

  @Input() section!: number;
  @Input() referenceId!: number;
  constructor(
    public docfileService: DocfileService,
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private dialog: MatDialog,
    private overlay: Overlay,
    private cdr: ChangeDetectorRef
  ) {}
  async ngOnInit() {
    this.selectedFolder = undefined;
    this.galerie = undefined;
    this.previewUrl = undefined;
    this.filesNames = [];
    // Définir la catégorie de libellés de dossiers
    // 1 = pmfu
    const subroute = `sites/selectvalues=files.libelles/${this.section}`;
    try {
      // Attendre que les dossiers soient chargés
      const selectValues = await lastValueFrom(this.getFolders(subroute));
      this.doc_types = selectValues || [];
      console.log('Doc_types chargés:', this.doc_types);

      // Maintenant mettre à jour les counts
      this.updateFolderCounts();

      this.cdr.detectChanges();
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers', error);
    }
  }

  getFolders(subroute: string): Observable<SelectValue[] | undefined> {
    const url = `${this.activeUrl}${subroute}`;
    return this.http.get<SelectValue[]>(url).pipe(
      tap((selectValues) => {
        console.log(
          'Valeurs de la liste de dossiers récupérées avec succès:',
          selectValues
        );
        this.doc_types = selectValues || [];
      }),
      catchError((error) => {
        console.error(
          'Erreur lors de la récupération des valeurs de la liste déroulante',
          error
        );
        throw error;
      })
    );
  }

  onFolderClick(folder: Folder): void {
    this.selectedFolder = folder.cd_type;
    // Ajouter la classe CSS 'selected' à l'élément cliqué
    this.previewUrl = undefined;
    this.isDocxView = false;
    this.galerie = undefined;
    console.log('Dossier cliqué :', folder);
    try {
      this.docfileService.getFilesList(folder.cd_type, this.section, this.referenceId)
        .then(() => {
          this.filePathList = this.docfileService.filePathList;
          console.log('this.filePathList:', this.filePathList);
          const ext = this.filePathList[0]
            ? this.filePathList[0].split('.').pop()?.toLowerCase()
            : '';
          if (['png', 'jpg', 'jpeg'].includes(ext || '')) {
            this.getGalerie(this.filePathList);
          }
          this.cdr.detectChanges();
        });
    } catch (error) {
      console.error('Erreur lors du chargement des documents.', error);
    }
  }

  trackByFolder(index: number, folder: any) {
    return folder.cd_type; // id de type unique
  }

  deleteFile(doc_path: string, cd_type: number): void {
    console.log('suppression du fichier :' + doc_path);
    this.docfileService.docfiles.forEach((docfile: any) => {
      console.log('docfile:', docfile.doc_path);
      if (docfile.doc_path === doc_path) {
        // console.log('docfile:', docfile.doc_path);
        
        this.docfileService.deleteFile(docfile.doc_path).subscribe({
          next: (res) => {
            console.log('Suppression OK', res);
            this.updateFolderCounts();
            this.docfileService
              .getFilesList(
                cd_type,
                this.section,
                this.referenceId ? this.referenceId : undefined
              )
              .then(() => {
                this.filePathList = this.docfileService.filePathList;
              });
          },
          error: (err) => console.error('Erreur suppression', err),
        });

      }
    });
  }

  async updateFolderCounts() {
    console.log('this.doc_types:', this.doc_types);
    await this.docfileService.getFilesList(0, this.section, this.referenceId);
    const newFolders: Folder[] = await Promise.all(
      (this.doc_types || []).map(async (docType) => {
        const files = [];
        // Récupérer les fichiers du dossier courant dans le service
        this.docfileService.allFiles.forEach((file) => {
          if (file === Number(docType.cd_type)) {
            files.push(file);
          }
        });

        return {
          cd_type: Number(docType.cd_type),
          name: docType.libelle,
          path: docType.path ? docType.path : '',
          numberElements: files.length,
        };
      })
    );

    // Mettre à jour la propriété locale (pratique pour debug) et émettre
    this.folders = newFolders;
    this.foldersSubject.next(newFolders);

    // forcer la vue si nécessaire
    this.cdr.detectChanges();
  }

  getFileUrl(filename: string): string {
    console.log('filename de getFileUrl :' + filename);
    this.docfileService.docfiles.forEach((file: any) => {
      if (file.doc_path.split('/').pop() === filename.split('/').pop()) {
        console.log('file.doc_path:', file.doc_path);
        filename = 'files/photos/' +file.doc_path;
      }
    });
    console.log('filename:', filename);

    if (environment.windows) {
      // Si on est en dev Windows, on remplace les slashes par des backslashes
      filename = filename.split('/').join('\\');
    }
    return `${this.activeUrl}${filename}`;
  }

  openFile(filename: string): void {
    const ext = filename.split('.').pop()?.toLowerCase().trim();
    const url = this.getFileUrl(filename);
    this.isDocxView = false;
    this.previewUrl = undefined;
    this.pdfUrl = undefined;
    this.imageUrl = undefined;
    this.currentDocxUrl = undefined;
    switch (ext) {
      case 'pdf':
        this.pdfUrl = url; // string pour vérification
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        break;

      case 'doc':
      case 'docx':
        this.isDocxView = true;
        this.currentDocxUrl = url;
        this.renderDocx(url);
        break;

      default:
        window.open(url, '_blank');
    }
  }

  private async renderDocx(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();

      const container = this.docxContainer.nativeElement;
      if (!container) return;

      container.innerHTML = ''; // reset avant nouveau rendu

      await renderAsync(arrayBuffer, container, undefined, {
        className: 'docx',
        inWrapper: true,
        breakPages: true,
      });

      console.log('DOCX affiché');
    } catch (err) {
      console.error('Erreur affichage DOCX :', err);
    }
  }

  getGalerie(filePathList: string[]) {
    filePathList.forEach((path) => {
      // Url qui s'adapte en fonction de l'environnement Windows ou Linux
      // let url = `${this.activeUrl}picts/img?file=${path.split( environment.pathSep ).pop()}&width=200`;
      let url = `${this.activeUrl}picts/img?file=${path}&width=200`;
      filePathList.push(url);
    });
    console.log('filePathList après ajout des miniatures:', filePathList);
    this.galerie = filePathList.slice(filePathList.length / 2, undefined);
    console.log('this.galerie:', this.galerie);

    this.imagePathList = filePathList;
    console.log('imagePathList:', this.imagePathList);
  }

  /**
   * Ouvre une image dans un dialogue
   * @param imagePath imagePath sans sous dossier !!!!!!
   */
  openImage(imagePath: string) {
    console.log('openImage imagePath:', imagePath);
    const dialogRef = this.dialog.open(ImageViewComponent, {
      data: {
        images: this.imagePathList?.slice(0, this.imagePathList.length / 2),
        selected: imagePath,
      }, // <---------------- données injectée au composant
      minWidth: '70vw',
      maxWidth: '95vw',
      height: '95vh',
      maxHeight: '95vh',
      hasBackdrop: true, // Avec fond
      backdropClass: 'custom-backdrop-gerer', // Personnalisation du fond
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });
  }

  deleteImage(imagePath: string) {
    console.log('imagePath:', imagePath);
    this.filePathList.forEach((docfile: any) => {
      console.log('docfile:', docfile);
      if (docfile === imagePath) {
        this.docfileService.deleteFile(docfile).subscribe({
          next: (res) => {
            console.log('Suppression OK', res);
            this.updateFolderCounts();
            this.docfileService
              .getFilesList(
                this.selectedFolder as number,
                this.section,
                this.referenceId ? this.referenceId : undefined
              )
              .then(() => {
                this.filePathList = this.docfileService.filePathList;
                this.getGalerie(this.filePathList);
              });
          },
          error: (err) => console.error('Erreur suppression', err),
        });
      }
    });
  }

  colors = [
    '#f5fff7',
    '#e0de12',
    '#c1d112',
    '#4b6426', // verts
    '#fec700',
    '#b44917',
    '#63340d', // oranges
    '#8cd2f5',
    '#089cd9',
    '#495fa9', // bleus
    '#f8f4ba',
    '#f4ee92',
    '#ebe01f', // jaunes
    '#d0a9cf',
    '#bb7bb3',
    '#430035', // violets
    '#f8baba',
    '#f4a2a2', // rouges
  ];

  // fonction hash simple pour générer un index stable
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit int
    }
    return Math.abs(hash);
  }

  getColorForImage(image: string): string {
    const index = this.hashString(image) % this.colors.length;
    return this.colors[index];
  }

  getTextColor(bg: string): string {
    const c = bg.substring(1); // enlève le "#"
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 150 ? '#000' : '#fff';
  }

  downloadDocx(): void {
    if (!this.currentDocxUrl) return;
    
    const link = document.createElement('a');
    link.href = this.currentDocxUrl;
    link.download = this.currentDocxUrl.split(this.separator).pop() || 'document.docx';
    link.click();
  }
}
