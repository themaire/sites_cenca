import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChiroService } from '../../../services/chiro.service';
import { CommuneIgnService, CommuneIGN } from '../../../services/commune-ign.service';
import { DetailSiteChiro, UpdateSite } from '../../../interfaces/site-chiro';
import { Typologies } from '../../../interfaces/observation';
import { FormButtonsComponent } from '../../../../shared/form-buttons/form-buttons.component';
import { MapComponent } from '../../../../map/map.component';

@Component({
  selector: 'app-onglet-infos-site',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatCardModule, MatCheckboxModule, MatDatepickerModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatNativeDateModule,
    MatSelectModule, MatSnackBarModule, MatTooltipModule,
    FormButtonsComponent,
    MapComponent,
  ],
  templateUrl: './onglet-infos-site.component.html',
  styleUrl: './onglet-infos-site.component.scss',
})
export class OngletInfosSiteComponent implements OnChanges {
  @Input() site!: DetailSiteChiro;
  @Input() typologies?: Typologies;
  @Output() saved = new EventEmitter<void>();
  @Output() deleteRequested = new EventEmitter<void>();

  form?: FormGroup;
  isEditMode = false;
  isFormValid = false;
  saving = false;

  readonly departements = this.communeIgnService.departements;
  selectedDepartement = '';
  communesIGN: CommuneIGN[] = [];
  loadingCommunes = false;
  pickedPoint?: { lat: number; lng: number };

  constructor(
    private fb: FormBuilder,
    private chiroService: ChiroService,
    private communeIgnService: CommuneIgnService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['site'] && this.form) {
      this.form.patchValue(this.buildFormValue());
    }
  }

  get hasProtection() { return this.form?.get('protection')?.value === true; }

  get displayedGps(): { lat: number; lng: number } | undefined {
    if (this.pickedPoint) return this.pickedPoint;
    if (this.site.wgs84_x != null && this.site.wgs84_y != null) {
      return { lat: this.site.wgs84_y, lng: this.site.wgs84_x };
    }
    return undefined;
  }

  handleToggleAction(action: String) {
    if (action === 'cancel') {
      this.onCancel();
    } else {
      this.isEditMode = true;
      this.initForm();
    }
  }

  async onDepartementChange(code: string) {
    this.selectedDepartement = code;
    this.form?.patchValue({ insee: '' });
    this.communesIGN = [];
    if (!code) return;
    this.loadingCommunes = true;
    this.communesIGN = await this.communeIgnService.getCommunesByDepartement(code);
    this.loadingCommunes = false;
  }

  private buildFormValue() {
    return {
      code: this.site.code,
      nom: this.site.nom,
      nature: this.site.nature ?? null,
      definition: this.site.definition ?? null,
      configuration: this.site.configuration ?? null,
      habitat: this.site.habitat ?? null,
      periode: this.site.periode ?? null,
      localisation: this.site.localisation ?? '',
      proprietaire: this.site.proprietaire ?? '',
      type_proprietaire: this.site.type_proprietaire ?? '',
      contact: this.site.contact ?? '',
      accessibilite: this.site.accessibilite ?? false,
      protection: this.site.protection ?? false,
      date_protection: this.site.date_protection ? new Date(this.site.date_protection) : null,
      suivi_prc: this.site.suivi_prc ?? false,
      priorisation: this.site.priorisation ?? false,
      description: this.site.description ?? '',
      interet: this.site.interet ?? '',
      x_lambert: this.site.x_lambert ?? null,
      y_lambert: this.site.y_lambert ?? null,
      type_localisation: this.site.type_localisation?.toString() ?? null,
      pointage_loc: this.site.pointage_loc?.toString() ?? null,
      precision_loc: this.site.precision_loc?.toString() ?? null,
    };
  }

  private async initForm() {
    this.form = this.fb.group({
      code: ['', Validators.required],
      nom: ['', Validators.required],
      insee: [null],
      nature: [null],
      definition: [null],
      configuration: [null],
      habitat: [null],
      periode: [null],
      localisation: [''],
      proprietaire: [''],
      type_proprietaire: [''],
      contact: [''],
      accessibilite: [false],
      protection: [false],
      date_protection: [null],
      suivi_prc: [false],
      priorisation: [false],
      description: [''],
      interet: [''],
      x_lambert: [null],
      y_lambert: [null],
      type_localisation: [null],
      pointage_loc: [null],
      precision_loc: [null],
    });
    this.form.patchValue(this.buildFormValue());
    this.isFormValid = this.form.valid;
    this.form.statusChanges.subscribe(() => {
      this.isFormValid = this.form!.valid;
    });

    const insee = this.site.insees?.[0];
    if (insee) {
      const deptCode = insee.substring(0, 2);
      this.selectedDepartement = deptCode;
      this.loadingCommunes = true;
      this.communesIGN = await this.communeIgnService.getCommunesByDepartement(deptCode);
      this.loadingCommunes = false;
      this.form.patchValue({ insee });
    }
  }

  onSubmit() {
    if (!this.form || this.form.invalid || this.saving) return;
    this.saving = true;
    const val = this.form.value;
    const data: UpdateSite = {
      code: val.code,
      nom: val.nom,
      insee: val.insee || undefined,
      nature: val.nature || undefined,
      definition: val.definition || undefined,
      configuration: val.configuration || undefined,
      habitat: val.habitat ? Number(val.habitat) : undefined,
      periode: val.periode || undefined,
      localisation: val.localisation || undefined,
      proprietaire: val.proprietaire || undefined,
      type_proprietaire: val.type_proprietaire || undefined,
      contact: val.contact || undefined,
      accessibilite: val.accessibilite ?? false,
      protection: val.protection ?? false,
      date_protection: val.date_protection ? this.formatDate(val.date_protection) : undefined,
      suivi_prc: val.suivi_prc ?? false,
      priorisation: val.priorisation ?? false,
      description: val.description || undefined,
      interet: val.interet || undefined,
      // Priorité carte sur X/Y saisis manuellement
      lat: this.pickedPoint?.lat,
      lng: this.pickedPoint?.lng,
      x_lambert: this.pickedPoint ? undefined : (val.x_lambert || undefined),
      y_lambert: this.pickedPoint ? undefined : (val.y_lambert || undefined),
      type_localisation: val.type_localisation ? Number(val.type_localisation) : undefined,
      pointage_loc: val.pointage_loc ? Number(val.pointage_loc) : undefined,
      precision_loc: val.precision_loc ? Number(val.precision_loc) : undefined,
    };
    this.chiroService.updateSite(this.site.id_site, data).subscribe({
      next: () => {
        this.snackBar.open('Site mis à jour', 'Fermer', { duration: 3000 });
        this.saving = false;
        this.isEditMode = false;
        this.form = undefined;
        this.saved.emit();
      },
      error: (err) => {
        console.error('[OngletInfosSite] MAJ', err);
        this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 4000 });
        this.saving = false;
      },
    });
  }

  onPointPicked(point: { lat: number; lng: number }) {
    this.pickedPoint = point;
  }

  onCancel() {
    this.isEditMode = false;
    this.form = undefined;
    this.selectedDepartement = '';
    this.communesIGN = [];
    this.pickedPoint = undefined;
  }

  private formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
