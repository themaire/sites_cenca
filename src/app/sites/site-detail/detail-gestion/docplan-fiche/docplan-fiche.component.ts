import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { DocPlanDetail, EntiteCoherente } from '../docplan';
import { SelectValue } from '../../../../shared/interfaces/formValues';

import { FormService } from '../../../../shared/services/form.service';
import { SitesService } from '../../../sites.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { LoginService } from '../../../../login/login.service';
import { FormButtonsComponent } from '../../../../shared/form-buttons/form-buttons.component';
import { EcgPickerComponent } from '../../../docplan/ecg-picker/ecg-picker.component';

import {
  MatDialogRef,
  MatDialogModule,
  MatDialogContent,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Overlay } from '@angular/cdk/overlay';

@Component({
  selector: 'app-docplan-fiche',
  standalone: true,
  imports: [
    CommonModule,
    FormButtonsComponent,
    MatDialogModule,
    MatDialogContent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './docplan-fiche.component.html',
  styleUrls: ['./docplan-fiche.component.scss'],
})
export class DocPlanFicheComponent implements OnInit, OnDestroy {
  docPlanDetail?: DocPlanDetail;
  ecgCourante?: EntiteCoherente;

  isNewDoc: boolean = false;
  isEditMode: boolean = false;
  isLoading: boolean = true;

  docPlanForm!: FormGroup;
  initialFormValues!: any;
  isFormValid: boolean = false;

  typesDocument: SelectValue[] = [];

  actuelOptions: SelectValue[] = [
    { cd_type: 'Oui', libelle: 'Oui' },
    { cd_type: 'Non', libelle: 'Non' },
  ];

  private formStatusSub: Subscription | null = null;

  constructor(
    private dialogRef: MatDialogRef<DocPlanFicheComponent>,
    private dialog: MatDialog,
    private overlay: Overlay,
    private sitesService: SitesService,
    private formService: FormService,
    private confirmationService: ConfirmationService,
    private snackBar: MatSnackBar,
    private loginService: LoginService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { uuid_doc?: string; uuid_site: string }
  ) {}

  get isAdmin(): boolean {
    return (this.loginService.user()?.gro_id ?? 0) > 2;
  }

  async ngOnInit() {
    this.formService
      .getSelectValues$('sites/selectvalues=docplan.typ_documents')
      .subscribe({
        next: (values: SelectValue[] | undefined) => (this.typesDocument = values || []),
        error: (err: unknown) => console.error('Erreur chargement types documents', err),
      });

    if (this.data.uuid_doc) {
      try {
        this.docPlanDetail = await this.sitesService.getDocPlanDetail(this.data.uuid_doc);
        this.docPlanForm = this.formService.newDocPlanForm(this.docPlanDetail, this.data.uuid_site);
        this.initialFormValues = this.docPlanForm.getRawValue();
        this.docPlanForm.disable();

        if (this.docPlanDetail.entite_coherente) {
          await this.loadEcgCourante(this.docPlanDetail.entite_coherente);
        }
      } catch (error) {
        console.error('Erreur chargement document planificateur', error);
      }
    } else {
      this.isNewDoc = true;
      this.isEditMode = true;
      this.docPlanForm = this.formService.newDocPlanForm(undefined, this.data.uuid_site);
    }

    this.formStatusSub = this.docPlanForm.statusChanges.subscribe(() => {
      this.isFormValid = this.docPlanForm.valid;
      this.cdr.detectChanges();
    });

    this.isLoading = false;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.formStatusSub?.unsubscribe();
  }

  private async loadEcgCourante(uuid_ecg: string): Promise<void> {
    try {
      const toutes = await this.sitesService.getEntitesCoherentes();
      this.ecgCourante = toutes.find(e => e.uuid_ecg === uuid_ecg);
    } catch (err) {
      console.error('Erreur chargement ECG courante', err);
    }
  }

  toggleEdit(): void {
    this.isEditMode = this.formService.simpleToggle(this.isEditMode);
    if (this.isEditMode) {
      this.docPlanForm.enable();
      if (!this.isAdmin) {
        this.docPlanForm.get('url')?.disable();
      }
    } else {
      this.docPlanForm.patchValue(this.initialFormValues);
      this.docPlanForm.disable();
    }
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    const mode = this.isNewDoc ? 'insert' : 'update';
    const uuid = this.isNewDoc ? undefined : this.docPlanDetail?.uuid_doc;

    const obs = this.formService.putBdd(
      mode,
      'docplan_documents',
      this.docPlanForm,
      this.isEditMode,
      this.snackBar,
      uuid,
      this.initialFormValues
    );

    if (obs) {
      obs.subscribe({
        next: (result: { isEditMode: boolean; formValue: any; skipped?: boolean }) => {
          this.isEditMode = result.isEditMode;
          if (!result.skipped) {
            this.initialFormValues = result.formValue;
            if (this.isNewDoc) {
              this.isNewDoc = false;
              this.docPlanDetail = result.formValue as DocPlanDetail;
            }
          }
          this.cdr.detectChanges();
        },
        error: (err: unknown) => console.error('Erreur sauvegarde document planificateur', err),
      });
    }
  }

  getTypDocLibelle(cd_type: string | null): string {
    if (!cd_type) return 'Non renseigné';
    return this.formService.getLibelleByCdType(cd_type, this.typesDocument) || cd_type;
  }

  // Gestion de l'entité cohérente de gestion

  openEcgPicker(): void {
    const dialogRef = this.dialog.open(EcgPickerComponent, {
      minWidth: '550px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      hasBackdrop: true,
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });

    dialogRef.afterClosed().subscribe((ecg: EntiteCoherente | undefined) => {
      if (ecg) {
        this.ecgCourante = ecg;
        this.docPlanForm.patchValue({ entite_coherente: ecg.uuid_ecg });
        this.cdr.detectChanges();
      }
    });
  }
}
