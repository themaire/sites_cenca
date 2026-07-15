import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChiroService } from '../../services/chiro.service';
import { CommuneIgnService, CommuneIGN } from '../../services/commune-ign.service';
import { CreateSite } from '../../interfaces/site-chiro';
import { Typologies } from '../../interfaces/observation';
import { MapComponent } from '../../../map/map.component';

@Component({
  selector: 'app-formulaire-site',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule,
    MatDatepickerModule, MatFormFieldModule, MatIconModule, MatInputModule,
    MatNativeDateModule, MatProgressSpinnerModule, MatSelectModule,
    MatSnackBarModule, MatTooltipModule,
    MapComponent,
  ],
  templateUrl: './formulaire-site.component.html',
  styleUrl: './formulaire-site.component.scss',
})
export class FormulaireNouveauSiteComponent implements OnInit {
  form: FormGroup;
  typologies?: Typologies;
  loading = true;
  saving = false;

  // Cascade département → commune
  readonly departements = this.communeIgnService.departements;
  selectedDepartement = '';
  communesIGN: CommuneIGN[] = [];
  loadingCommunes = false;

  // Localisation
  locMode: 'carte' | 'xy' | 'aucune' = 'aucune';
  isPickingMode = false;
  pickedLat?: number;
  pickedLng?: number;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private chiroService: ChiroService,
    private communeIgnService: CommuneIgnService,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      code: ['', Validators.required],
      nom: ['', Validators.required],
      insee: ['', Validators.required],
      nature: [null],
      definition: [null],
      configuration: [null],
      habitat: [null],
      periode: [null],
      localisation: [''],
      x_lambert: [null],
      y_lambert: [null],
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
    });
  }

  ngOnInit() {
    this.chiroService.getTypologies().then(t => {
      this.typologies = t;
      this.loading = false;
    });
  }

  async onDepartementChange(code: string) {
    this.selectedDepartement = code;
    this.form.patchValue({ insee: '' });
    this.communesIGN = [];
    if (!code) return;
    this.loadingCommunes = true;
    this.communesIGN = await this.communeIgnService.getCommunesByDepartement(code);
    this.loadingCommunes = false;
  }

  get hasProtection() { return this.form.get('protection')?.value === true; }

  onLocModeChange(mode: 'carte' | 'xy' | 'aucune') {
    this.locMode = mode;
    if (mode !== 'carte') {
      this.isPickingMode = false;
      this.pickedLat = undefined;
      this.pickedLng = undefined;
    }
    if (mode !== 'xy') {
      this.form.patchValue({ x_lambert: null, y_lambert: null });
    }
  }

  togglePickingMode() {
    this.isPickingMode = !this.isPickingMode;
  }

  onPointPicked(coords: { lat: number; lng: number }) {
    this.pickedLat = coords.lat;
    this.pickedLng = coords.lng;
  }

  clearPoint() {
    this.pickedLat = undefined;
    this.pickedLng = undefined;
    this.isPickingMode = false;
  }

  onSubmit() {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    const val = this.form.value;
    const data: CreateSite = {
      code: val.code,
      nom: val.nom,
      insee: val.insee,
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
      // Localisation géographique selon le mode
      ...(this.locMode === 'carte' && this.pickedLat !== undefined
        ? { lat: this.pickedLat, lng: this.pickedLng }
        : {}),
      ...(this.locMode === 'xy' && val.x_lambert && val.y_lambert
        ? { x_lambert: Number(val.x_lambert), y_lambert: Number(val.y_lambert) }
        : {}),
    };
    this.chiroService.createSite(data).subscribe({
      next: (res) => {
        this.snackBar.open('Site créé avec succès', 'Fermer', { duration: 3000 });
        this.router.navigate(['/chiro/site', res.id_site]);
      },
      error: (err) => {
        console.error('[FormulaireNouveauSite]', err);
        this.snackBar.open('Erreur lors de la création du site', 'Fermer', { duration: 4000 });
        this.saving = false;
      },
    });
  }

  annuler() { this.router.navigate(['/chiro/sites']); }

  private formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
