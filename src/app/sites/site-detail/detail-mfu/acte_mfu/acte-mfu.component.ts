import { Component, OnInit, ChangeDetectorRef, inject, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { MomentDateAdapter, provideMomentDateAdapter } from '@angular/material-moment-adapter';

import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';

import { map } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Overlay } from '@angular/cdk/overlay';

import { FormButtonsComponent } from '../../../../shared/form-buttons/form-buttons.component';
import { MatDialog, MatDialogRef, MatDialogModule, MatDialogContent, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AttachActeSiteDialogComponent } from './attach-acte-site-dialog.component';

import { ActeLite } from '../acte';
import { SitesService } from '../../../sites.service';
import { ActeService } from '../acte.service';
import { FormService } from '../../../../shared/services/form.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { LoginService } from '../../../../login/login.service';
import { SelectValue } from '../../../../shared/interfaces/formValues';
import { ParcelleMfuComponent } from './parcelle-mfu/parcelle-mfu.component';

export const MY_DATE_FORMATS = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: { dateInput: 'DD/MM/YYYY', monthYearLabel: 'MMM YYYY', dateA11yLabel: 'DD/MM/YYYY', monthYearA11yLabel: 'MMMM YYYY' },
};

@Component({
  selector: 'app-acte-mfu',
  standalone: true,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    provideMomentDateAdapter(),
  ],
  imports: [
    FormButtonsComponent,
    CommonModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatTooltipModule,
    MatDialogContent,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ParcelleMfuComponent,
  ],
  templateUrl: './acte-mfu.component.html',
  styleUrl: './acte-mfu.component.scss'
})
export class ActeMfuComponent implements OnInit, OnDestroy {
  private _adapter = inject(DateAdapter);
  private dialogData = inject(MAT_DIALOG_DATA);
  private readonly openedSiteUuid = String((this.dialogData as any)?.currentSiteUuid || '');
  acteLite!: ActeLite;
  // UUID resolu pour gerer les cas ou le dialogue est ouvert avec des donnees partielles.
  resolvedActeUuid = '';
  isLoading = true;
  loadingDelay = 400;
  
  newMfu = false;
  isEditMfu = false;
  
  mfuForm!: FormGroup;
  isFormValid = false;
  initialFormValues!: any;
  originalFormValues!: any;
  private formStatusSubscription: Subscription | null = null;
  // Liste des sites rattaches affichee en chips sous le formulaire.
  attachedSiteChips: Array<{ uuid_site: string; nom_site: string; removable: boolean }> = [];
  isLoadingAttachedSites = false;
  
  typeActeList: SelectValue[] = [];
  typeProprioList: SelectValue[] = [];

  stepperOrientation = inject(BreakpointObserver).observe('(min-width: 800px)').pipe(map(({ matches }) => matches ? 'horizontal' : 'vertical'));

  constructor(
    public formService: FormService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ActeMfuComponent>,
    private sitesService: SitesService,
    private acteService: ActeService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private loginService: LoginService,
    private overlay: Overlay
  ) {
    this.acteLite = this.dialogData;
    this.resolvedActeUuid = this.acteLite?.uuid_acte || '';
  }

  async ngOnInit() {
    await this.loadSelectValues();

    if (this.acteLite?.uuid_acte) {
      try {
        setTimeout(async () => {
          const result = await this.fetch('mfu', this.acteLite.uuid_acte);
          if (result) {
            this.mfuForm = this.formService.newMfuForm(result);
            this.resolvedActeUuid = result?.uuid_acte || this.acteLite?.uuid_acte || '';
            this.initialFormValues = { ...this.mfuForm.getRawValue() };
            this.originalFormValues = { ...this.initialFormValues };
            this.isEditMfu = false;
            this.setBooleanControlsEnabled(false);
            await this.loadAttachedSites();
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        }, this.loadingDelay);
      } catch (error) {
        console.error('Erreur:', error);
        this.isLoading = false;
      }
    } else {
      this.newMfu = true;
      this.isEditMfu = true;
      this.mfuForm = this.formService.newMfuForm(null as any);
      this.mfuForm.patchValue({ site: this.acteLite.site, typ_mfu: 'MFU' });
      this.initialFormValues = { ...this.mfuForm.getRawValue() };
      this.originalFormValues = { ...this.initialFormValues };
      this.isLoading = false;
    }
  }

  async loadSelectValues() {
    this.formService.getSelectValues$('sites/selectvalues=sitcenca.typ_mfu').subscribe(v => this.typeActeList = v || []);
    this.formService.getSelectValues$('sites/selectvalues=sitcenca.typ_proprietaires').subscribe(v => this.typeProprioList = v || []);
  }

  async fetch(table: 'mfu', uuid: string): Promise<any> {
    const subroute = `mfu/uuid=${uuid}/full`;
    return await this.sitesService.getActeFull(subroute);
  }

  ngOnDestroy() {
    if (this.formStatusSubscription) {
      this.formStatusSubscription.unsubscribe();
    }
  }

  private setBooleanControlsEnabled(enabled: boolean): void {
    const tacitRecControl = this.mfuForm?.get('tacit_rec');
    const validiteControl = this.mfuForm?.get('validite');

    if (!tacitRecControl || !validiteControl) {
      return;
    }

    if (enabled) {
      tacitRecControl.enable({ emitEvent: false });
      validiteControl.enable({ emitEvent: false });
    } else {
      tacitRecControl.disable({ emitEvent: false });
      validiteControl.disable({ emitEvent: false });
    }
  }

  getLibelle(cd_type: string, list: SelectValue[]) {
    return list.find(t => t.cd_type === cd_type)?.libelle || '';
  }

  toggleEditMfu(event?: String): void {
    // Pour un nouvel acte, l'annulation ferme la dialog sans sauvegarder
    if (this.newMfu) {
      this.dialogRef.close();
      return;
    }

    if (event === 'cancel') {
      // Active temporairement les booleans pour reappliquer les valeurs
      this.setBooleanControlsEnabled(true);
      
      this.mfuForm.patchValue(this.originalFormValues);
      
      this.isEditMfu = false;
      
        // Désactive les booléens en mode consultation
          // Désactiver uniquement si ce n'est pas une création
          if (!this.newMfu) {
            this.setBooleanControlsEnabled(false);
          }
    } else {
      this.isEditMfu = !this.isEditMfu;
      if (this.isEditMfu) {
        this.mfuForm.enable();
      } else {
        // Active temporairement pour reappliquer les valeurs initiales
        this.setBooleanControlsEnabled(true);
        
        this.mfuForm.patchValue(this.originalFormValues);
        
        // Revenir en mode consultation
        this.setBooleanControlsEnabled(false);
      }
    }
    this.cdr.detectChanges();
  }


  onSubmit() {
    if (!this.mfuForm?.valid) {
      this.snackBar.open('Formulaire invalide', 'OK');
      return;
    }

    const hasChanges = JSON.stringify(this.mfuForm.getRawValue()) !== JSON.stringify(this.originalFormValues);
    if (!hasChanges) {
      this.snackBar.open('Aucune donnée modifiée', 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-info'],
      });

      // En edition, revenir simplement a la vue consultation.
      if (this.isEditMfu && !this.newMfu) {
        this.toggleEditMfu('cancel');
      }
      return;
    }

    const formValue = this.mfuForm.getRawValue();
    const obs = this.newMfu ? this.acteService.insertActe(formValue) : this.acteService.updateActe(this.resolvedActeUuid, formValue);

    obs.subscribe({
      next: (res) => {
        if (res?.success) {
          this.snackBar.open('Sauvegardé', 'OK', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(res?.message || 'Erreur', 'OK', { duration: 3000 });
        }
      },
      error: () => this.snackBar.open('Erreur', 'OK', { duration: 3000 })
    });
  }

  deleteItemConfirm() {
    this.confirmationService.confirm('Suppression', 'Supprimer ?', 'delete').subscribe(ok => {
      if (ok) {
        this.acteService.deleteActe(this.resolvedActeUuid).subscribe({
          next: (res) => {
            if (res?.success) {
              this.snackBar.open('Supprimé', 'OK', { duration: 3000 });
              this.dialogRef.close(true);
            }
          }
        });
      }
    });
  }

  openAttachSiteDialog(): void {
    // Ouvre un dialogue pour rattacher l'acte courant a un autre site.
    if (!this.resolvedActeUuid || this.newMfu) {
      this.snackBar.open('Enregistrez d\'abord l\'acte avant de le rattacher.', 'OK', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(AttachActeSiteDialogComponent, {
      width: '520px',
      panelClass: 'attach-site-dialog-panel',
      autoFocus: false,
      restoreFocus: false,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      data: {
        acteUuid: this.resolvedActeUuid,
        currentSiteUuid: this.mfuForm?.get('site')?.value || this.acteLite.site,
      },
    });

    dialogRef.afterClosed().subscribe((linked) => {
      if (linked) {
        this.snackBar.open('Rattachement effectué.', 'OK', { duration: 3000 });
        this.loadAttachedSites();
      }
    });
  }

  private async loadAttachedSites(): Promise<void> {
    if (!this.resolvedActeUuid) {
      this.attachedSiteChips = [];
      return;
    }

    this.isLoadingAttachedSites = true;
    try {
      const rows = await this.acteService.getActesMultiSitesLite();
      const current = rows.find((row: any) => row?.uuid_acte === this.resolvedActeUuid);
      this.attachedSiteChips = this.extractSiteChips(current);
    } catch (error) {
      console.warn('Impossible de charger les sites rattaches de l\'acte.', error);
      this.attachedSiteChips = [];
    } finally {
      this.isLoadingAttachedSites = false;
      this.cdr.detectChanges();
    }
  }

  removeAttachedSite(chip: { uuid_site: string; nom_site: string; removable: boolean }): void {
    if (!chip?.removable || !chip?.uuid_site || !this.resolvedActeUuid || this.sameUuid(chip.uuid_site, this.getCurrentSiteUuid())) {
      return;
    }

    this.confirmationService
      .confirm('Détacher ce site', `Détacher le site "${chip.nom_site}" de cet acte ?`, 'delete')
      .subscribe((ok) => {
        if (!ok) {
          return;
        }

        this.acteService.detachActeFromSite(this.resolvedActeUuid, chip.uuid_site, this.getCurrentSiteUuid()).subscribe({
          next: (res) => {
            if (res?.success) {
              this.snackBar.open('Site détaché de l\'acte.', 'OK', { duration: 3000 });
              this.loadAttachedSites();
            } else {
              this.snackBar.open(res?.message || 'Impossible de détacher le site.', 'OK', { duration: 3000 });
            }
          },
          error: () => this.snackBar.open('Erreur lors du détachement.', 'OK', { duration: 3000 })
        });
      });
  }

  getActeHeaderLabel(): string {
    if (this.attachedSiteChips.length > 1) {
      return 'Multi-sites';
    }

    return this.acteLite?.nom || '';
  }

  private getCurrentSiteUuid(): string {
    return String(this.openedSiteUuid || this.mfuForm?.get('site')?.value || this.acteLite?.site || '');
  }

  private sameUuid(left: string, right: string): boolean {
    return String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase();
  }

  private extractSiteChips(row: any): Array<{ uuid_site: string; nom_site: string; removable: boolean }> {
    const details = Array.isArray(row?.sites_associes_details) ? row.sites_associes_details : [];
    const currentSiteUuid = this.getCurrentSiteUuid();

    if (details.length > 0) {
      return details
        .filter((site: any) => !!site?.uuid_site && !!site?.nom_site)
        .map((site: any) => ({
          uuid_site: String(site.uuid_site),
          nom_site: String(site.nom_site),
          removable: details.length > 1 && !this.sameUuid(site.uuid_site, currentSiteUuid),
        }));
    }

    const names = String(row?.sites_associes ?? '')
      .split('|')
      .map((name: string) => name.trim())
      .filter((name: string) => !!name);

    return names.map((name) => ({
      uuid_site: '',
      nom_site: name,
      removable: false,
    }));
  }

}
