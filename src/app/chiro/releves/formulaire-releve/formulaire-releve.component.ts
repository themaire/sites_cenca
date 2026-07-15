import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChiroService } from '../../services/chiro.service';
import { CommuneIgnService, CommuneIGN } from '../../services/commune-ign.service';
import { ListSiteChiro } from '../../interfaces/site-chiro';
import { MapComponent } from '../../../map/map.component';
import { DialogSelectSiteComponent } from './dialog-select-site.component';

@Component({
  selector: 'app-formulaire-releve',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatCardModule, MatDatepickerModule, MatDialogModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatNativeDateModule,
    MatProgressSpinnerModule, MatSelectModule, MatSnackBarModule,
    MapComponent,
  ],
  templateUrl: './formulaire-releve.component.html',
  styleUrl: './formulaire-releve.component.scss',
})
export class FormulaireReleveComponent implements OnInit {
  form!: FormGroup;
  sites: ListSiteChiro[] = [];
  loading = true;
  saving = false;

  readonly departements = this.communeIgnService.departements;
  selectedDepartement = '';
  communesIGN: CommuneIGN[] = [];
  loadingCommunes = false;

  selectedSite?: ListSiteChiro;
  showLocalisation = false;
  pickedPoint?: { lat: number; lng: number };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private chiroService: ChiroService,
    private communeIgnService: CommuneIgnService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  async ngOnInit() {
    this.form = this.fb.group({
      date_releve: [null, Validators.required],
      insee: ['', Validators.required],
      site: [null],
      observateur_cite: [''],
      x: [null],
      y: [null],
      commentaire: [''],
    });

    this.sites = await this.chiroService.getSites().catch(err => {
      console.error('[FormulaireReleve]', err);
      return [];
    });

    const siteId = this.route.snapshot.queryParamMap.get('site');
    if (siteId) {
      const site = this.sites.find(s => s.id_site === Number(siteId));
      if (site) await this.preselectSite(site);
    }

    this.loading = false;
  }

  async onDepartementChange(code: string) {
    this.selectedDepartement = code;
    this.communesIGN = [];
    this.form.patchValue({ insee: '' });
    if (!code) return;
    this.loadingCommunes = true;
    this.communesIGN = await this.communeIgnService.getCommunesByDepartement(code);
    this.loadingCommunes = false;
  }

  ouvrirDialogSite() {
    this.dialog.open(DialogSelectSiteComponent, {
      data: { sites: this.sites },
      width: '440px',
    }).afterClosed().subscribe(async (site: ListSiteChiro | undefined) => {
      if (site) await this.preselectSite(site);
    });
  }

  private async preselectSite(site: ListSiteChiro) {
    this.selectedSite = site;
    this.form.patchValue({ site: site.id_site });

    if (site.insee) {
      const deptCode = site.insee.substring(0, 2);
      if (deptCode !== this.selectedDepartement) {
        this.selectedDepartement = deptCode;
        this.loadingCommunes = true;
        this.communesIGN = await this.communeIgnService.getCommunesByDepartement(deptCode);
        this.loadingCommunes = false;
      }
      this.form.patchValue({ insee: site.insee });
    }
  }

  get initialMarker(): { lat: number; lng: number; label: string } | undefined {
    if (!this.selectedSite?.wgs84_x || !this.selectedSite?.wgs84_y) return undefined;
    return {
      lat: this.selectedSite.wgs84_y,
      lng: this.selectedSite.wgs84_x,
      label: 'Position du site',
    };
  }

  toggleLocalisation() {
    this.showLocalisation = !this.showLocalisation;
  }

  onPointPicked(point: { lat: number; lng: number }) {
    this.pickedPoint = point;
  }

  onSubmit() {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    const val = this.form.value;
    const data = {
      date_releve: this.formatDate(val.date_releve),
      insee: val.insee,
      site: val.site || null,
      observateur_cite: val.observateur_cite || null,
      x: this.pickedPoint ? null : (val.x || null),
      y: this.pickedPoint ? null : (val.y || null),
      lat: this.pickedPoint?.lat,
      lng: this.pickedPoint?.lng,
      commentaire: val.commentaire || null,
    };
    this.chiroService.createReleve(data).subscribe({
      next: (res) => {
        this.snackBar.open('Relevé créé', 'Fermer', { duration: 3000 });
        this.router.navigate(['/chiro/releve', res.uuid_releve]);
      },
      error: (err) => {
        console.error('[FormulaireReleve]', err);
        this.snackBar.open('Erreur lors de la création', 'Fermer', { duration: 4000 });
        this.saving = false;
      },
    });
  }

  annuler() {
    this.router.navigate(['/chiro/releves']);
  }

  private formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
