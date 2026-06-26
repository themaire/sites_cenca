import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { DocPlanDetail, UniteGestion } from '../docplan';
import { SelectValue } from '../../../../shared/interfaces/formValues';

import { FormService } from '../../../../shared/services/form.service';
import { SitesService } from '../../../sites.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { LoginService } from '../../../../login/login.service';
import { FormButtonsComponent } from '../../../../shared/form-buttons/form-buttons.component';

import {
  MatDialogRef,
  MatDialogModule,
  MatDialogContent,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    MatTableModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './docplan-fiche.component.html',
  styleUrls: ['./docplan-fiche.component.scss'],
})
export class DocPlanFicheComponent implements OnInit, OnDestroy {
  docPlanDetail?: DocPlanDetail;
  unitesGestion: UniteGestion[] = [];
  ugDataSource!: MatTableDataSource<UniteGestion>;
  ugColumns: string[] = ['code', 'nom', 'surface', 'actions'];

  isNewDoc: boolean = false;
  isEditMode: boolean = false;
  isLoading: boolean = true;

  docPlanForm!: FormGroup;
  initialFormValues!: any;
  isFormValid: boolean = false;

  isAddingUG: boolean = false;
  ugForm!: FormGroup;

  typesDocument: SelectValue[] = [];

  actuelOptions: SelectValue[] = [
    { cd_type: 'Oui', libelle: 'Oui' },
    { cd_type: 'Non', libelle: 'Non' },
  ];

  private formStatusSub: Subscription | null = null;

  constructor(
    private dialogRef: MatDialogRef<DocPlanFicheComponent>,
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
        this.unitesGestion = await this.sitesService.getDocPlanUG(this.data.uuid_doc);
        this.ugDataSource = new MatTableDataSource(this.unitesGestion);

        this.docPlanForm = this.formService.newDocPlanForm(this.docPlanDetail, this.data.uuid_site);
        this.initialFormValues = this.docPlanForm.getRawValue();
        this.docPlanForm.disable();
      } catch (error) {
        console.error('Erreur chargement document planificateur', error);
      }
    } else {
      this.isNewDoc = true;
      this.isEditMode = true;
      this.docPlanForm = this.formService.newDocPlanForm(undefined, this.data.uuid_site);
      this.ugDataSource = new MatTableDataSource<UniteGestion>([]);
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

  // Gestion des unités de gestion

  startAddUG(): void {
    const uuid_doc = this.docPlanForm.get('uuid_doc')?.value;
    if (!uuid_doc) return;
    this.ugForm = this.formService.newUniteGestionForm(uuid_doc);
    this.isAddingUG = true;
  }

  cancelAddUG(): void {
    this.isAddingUG = false;
  }

  saveUG(): void {
    const ugData: UniteGestion = this.ugForm.value;
    this.sitesService.insertTable('docplan_unites_gestion', ugData).subscribe({
      next: () => {
        this.unitesGestion = [...this.unitesGestion, ugData];
        this.ugDataSource = new MatTableDataSource(this.unitesGestion);
        this.isAddingUG = false;
        this.snackBar.open("Unité de gestion ajoutée", 'Fermer', {
          duration: 3000,
          panelClass: ['snackbar-success'],
        });
      },
      error: (err) => console.error("Erreur lors de l'ajout de l'unité de gestion", err),
    });
  }

  deleteUG(ug: UniteGestion): void {
    this.confirmationService
      .confirm(
        'Suppression',
        `Supprimer l'unité de gestion "${ug.code || ug.nom}" ?<br><strong>Cette action est irréversible.</strong>`,
        'delete'
      )
      .subscribe((confirmed: boolean | string[]) => {
        if (!confirmed || Array.isArray(confirmed)) return;
        this.sitesService.deleteDocPlanUG(ug.uuid_ug).subscribe({
          next: () => {
            this.unitesGestion = this.unitesGestion.filter((u) => u.uuid_ug !== ug.uuid_ug);
            this.ugDataSource = new MatTableDataSource(this.unitesGestion);
            this.snackBar.open('Unité de gestion supprimée', 'Fermer', {
              duration: 3000,
              panelClass: ['snackbar-success'],
            });
          },
          error: (err: unknown) => console.error('Erreur suppression unité de gestion', err),
        });
      });
  }
}
