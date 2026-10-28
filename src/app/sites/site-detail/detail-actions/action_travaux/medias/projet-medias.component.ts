import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';

import { DocfileService } from '../../../../../shared/services/docfile.service';
import { FileExploratorComponent } from '../../../../../shared/file-explorator/file-explorator.component';

/**
 * Step "Médias" d'un projet de travaux : dépôt des photos avant / après travaux
 * et consultation via l'explorateur de fichiers.
 * Les types de médias viennent de files.libelles pour la section TRAVAUX (files.libelles_nom)
 * et les fichiers sont rattachés au projet par son uuid_proj (ref_id de files.docs).
 */
@Component({
  selector: 'app-projet-medias',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatListModule, FileExploratorComponent],
  templateUrl: './projet-medias.component.html',
  styleUrl: './projet-medias.component.scss',
})
export class ProjetMediasComponent implements OnInit, OnChanges {
  /** Section "travaux" de files.libelles_nom */
  static readonly SECTION_TRAVAUX = 3;
  readonly section = ProjetMediasComponent.SECTION_TRAVAUX;

  @Input({ required: true }) uuidProj!: string;
  /** Mode édition du formulaire projet : les zones de dépôt ne sont visibles qu'en édition */
  @Input() editMode = false;
  @ViewChild(FileExploratorComponent) fileExplorator?: FileExploratorComponent;

  docTypes: { cd_type: number; libelle: string; path: string; field: string }[] = [];
  docForm?: FormGroup;
  /** Fichiers en attente d'envoi : [nom du fichier, champ du type] */
  pendingFiles: [string, string][] = [];
  fileErrors: Record<string, string[]> = {};
  isUploading = false;

  private readonly allowedExtensions = ['.jpg', '.jpeg', '.png'];

  constructor(
    private docfileService: DocfileService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {}

  async ngOnInit() {
    await this.docfileService.loadDocTypes(this.section);
    this.docTypes = this.docfileService.getTypes();
    this.resetForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Sortie du mode édition sans sauvegarde (annulation) : on abandonne les photos en attente
    if (changes['editMode'] && !changes['editMode'].firstChange && !this.editMode) {
      this.resetForm();
    }
  }

  private resetForm() {
    const group: Record<string, any> = {};
    this.docTypes.forEach((type) => (group[type.field] = [null]));
    this.docForm = this.fb.group(group);
    this.pendingFiles = [];
  }

  get allowedAccept(): string {
    return this.allowedExtensions.join(',');
  }

  onFileSelected(event: Event, field: string) {
    const input = event.target as HTMLInputElement;
    this.addFiles(Array.from(input.files || []), field);
    input.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onFileDropped(event: DragEvent, field: string) {
    event.preventDefault();
    this.addFiles(Array.from(event.dataTransfer?.files || []), field);
  }

  private addFiles(files: File[], field: string) {
    const control = this.docForm?.get(field);
    if (!control) return;

    const accepted = files.filter((file) => {
      const ok = this.allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
      if (!ok) this.pushError(field, `${file.name} : format non autorisé`);
      return ok;
    });

    control.setValue([...(control.value || []), ...accepted]);
    accepted.forEach((file) => this.pendingFiles.push([file.name, field]));
  }

  private pushError(field: string, message: string) {
    this.fileErrors[field] = [...(this.fileErrors[field] || []), message];
    setTimeout(() => (this.fileErrors[field] = []), 3000);
  }

  removePendingFile([fileName, field]: [string, string]) {
    this.pendingFiles = this.pendingFiles.filter((f) => !(f[0] === fileName && f[1] === field));
    const control = this.docForm?.get(field);
    control?.setValue((control.value as File[] || []).filter((file) => file.name !== fileName));
  }

  pendingFor(field: string): [string, string][] {
    return this.pendingFiles.filter((f) => f[1] === field);
  }

  /**
   * Envoie les photos en attente. Appelée par la sauvegarde du formulaire projet.
   * @returns true si un envoi a été lancé, false s'il n'y avait rien à envoyer
   */
  uploadPending(): boolean {
    if (!this.docForm || this.pendingFiles.length === 0) return false;
    this.isUploading = true;
    // Le FormData est construit de façon synchrone : on peut vider la liste d'attente tout de suite
    const upload$ = this.docfileService.submitDocfiles(this.docForm, this.uuidProj);
    this.resetForm();
    upload$
      .pipe(finalize(() => (this.isUploading = false)))
      .subscribe((response) => {
        if (response.success) {
          this.snackBar.open('Photos enregistrées', 'Fermer', { duration: 3000, panelClass: ['snackbar-success'] });
          this.fileExplorator?.updateFolderCounts();
        } else {
          this.snackBar.open(response.message || "Erreur lors de l'envoi des photos", 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
        }
      });
    return true;
  }
}
