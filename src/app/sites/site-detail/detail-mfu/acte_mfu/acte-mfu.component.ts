import { Component, OnInit, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
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

import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';

import { FormButtonsComponent } from '../../../../shared/form-buttons/form-buttons.component';
import { MatDialogRef, MatDialogModule, MatDialogContent, MAT_DIALOG_DATA } from '@angular/material/dialog';

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
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    AsyncPipe,
    ParcelleMfuComponent,
  ],
  templateUrl: './acte-mfu.component.html',
  styleUrl: './acte-mfu.component.scss'
})
export class ActeMfuComponent implements OnInit, OnDestroy {
  private _adapter = inject(DateAdapter);
  private dialogData = inject(MAT_DIALOG_DATA);
  acteLite!: ActeLite;
  isLoading = true;
  loadingDelay = 400;
  
  newMfu = false;
  isEditMfu = false;
  
  mfuForm!: FormGroup;
  isFormValid = false;
  initialFormValues!: any;
  originalFormValues!: any;
  private formStatusSubscription: Subscription | null = null;
  
  typeActeList: SelectValue[] = [];
  typeProprioList: SelectValue[] = [];

  stepperOrientation = inject(BreakpointObserver).observe('(min-width: 800px)').pipe(map(({ matches }) => matches ? 'horizontal' : 'vertical'));

  constructor(
    public formService: FormService,
    private dialogRef: MatDialogRef<ActeMfuComponent>,
    private sitesService: SitesService,
    private acteService: ActeService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private loginService: LoginService
  ) {
    this.acteLite = this.dialogData;
  }

  async ngOnInit() {
    await this.loadSelectValues();

    if (this.acteLite?.uuid_acte) {
      try {
        setTimeout(async () => {
          const result = await this.fetch('mfu', this.acteLite.uuid_acte);
          if (result) {
            this.mfuForm = this.formService.newMfuForm(result);
            this.initialFormValues = { ...this.mfuForm.getRawValue() };
            this.originalFormValues = { ...this.initialFormValues };
            this.isEditMfu = false;
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
      this.mfuForm.patchValue({ site: this.acteLite.site, typ_mfu: 'MFU', validite: true });
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
      // Enable temporairement pour patch
      this.mfuForm.get('tacit_rec')?.enable();
      this.mfuForm.get('validite')?.enable();
      
      this.mfuForm.patchValue(this.originalFormValues);
      
      this.isEditMfu = false;
      
      // Disable slide toggles in consult mode
      this.mfuForm.get('tacit_rec')?.disable();
      this.mfuForm.get('validite')?.disable();
    } else {
      this.isEditMfu = !this.isEditMfu;
      if (this.isEditMfu) {
        this.mfuForm.enable();
      } else {
        // Enable temp for patch
        this.mfuForm.get('tacit_rec')?.enable();
        this.mfuForm.get('validite')?.enable();
        
        this.mfuForm.patchValue(this.originalFormValues);
        
        // Disable
        this.mfuForm.get('tacit_rec')?.disable();
        this.mfuForm.get('validite')?.disable();
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
      this.snackBar.open('Aucun changement');
      return;
    }

    const formValue = this.mfuForm.getRawValue();
    const obs = this.newMfu ? this.acteService.insertActe(formValue) : this.acteService.updateActe(this.acteLite.uuid_acte!, formValue);

    obs.subscribe({
      next: (res) => {
        if (res?.success) {
          this.snackBar.open('Sauvegardé', 'OK');
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(res?.message || 'Erreur');
        }
      },
      error: () => this.snackBar.open('Erreur')
    });
  }

  deleteItemConfirm() {
    this.confirmationService.confirm('Suppression', 'Supprimer?', 'delete').subscribe(ok => {
      if (ok) {
        this.acteService.deleteActe(this.acteLite.uuid_acte!).subscribe({
          next: (res) => {
            if (res?.success) {
              this.snackBar.open('Supprimé');
              this.dialogRef.close(true);
            }
          }
        });
      }
    });
  }
}
