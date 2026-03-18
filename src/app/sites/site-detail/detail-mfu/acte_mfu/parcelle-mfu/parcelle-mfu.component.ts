import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, ChangeDetectorRef, ViewChild, inject } from '@angular/core';



import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';

import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule, MatAutocomplete } from '@angular/material/autocomplete';
import { MatSortModule, MatSort } from '@angular/material/sort';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { Overlay } from '@angular/cdk/overlay';


import { Parcelle } from './parcelle';
import { ParcelleService } from './parcelle.service';
import { FormService } from '../../../../../shared/services/form.service';
import { ConfirmationService } from '../../../../../shared/services/confirmation.service';
import { SelectValue } from '../../../../../shared/interfaces/formValues';
import { FormButtonsComponent } from '../../../../../shared/form-buttons/form-buttons.component';

@Component({
  selector: 'app-parcelle-mfu',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatSortModule,
    MatTooltipModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    FormButtonsComponent,
  ],



  templateUrl: './parcelle-mfu.component.html',
  styleUrl: './parcelle-mfu.component.scss'
})
export class ParcelleMfuComponent implements OnInit, AfterViewInit {






@ViewChild(MatSort) sort!: MatSort;

  @Input() uuidActe: string = '';

  @Input() isEditModeParent: boolean = false;
  @Input() showAddForm: boolean = false;
  @Output() parcellesUpdated = new EventEmitter<void>();

  private cdr = inject(ChangeDetectorRef);
  private parcelleService = inject(ParcelleService);
  private formService = inject(FormService);
  private confirmationService = inject(ConfirmationService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private overlay = inject(Overlay);

  parcelles: Parcelle[] = [];
  dataSource = new MatTableDataSource<Parcelle>(this.parcelles);
  sortData(sortState: any) {

    if (sortState.direction) {
      this.parcelles.sort((a, b) => {
        const isAsc = sortState.direction === 'asc';
        switch (sortState.active) {
          case 'insee': return this.compare(a.insee || '', b.insee || '', isAsc);
          case 'prefix': return this.compare(a.prefix || '', b.prefix || '', isAsc);
          case 'section': return this.compare(a.section || '', b.section || '', isAsc);
          case 'numero': return this.compare(a.numero || 0, b.numero || 0, isAsc);
          case 'surface': return this.compare(a.surface || 0, b.surface || 0, isAsc);
          default: return 0;
        }
      });
      this.dataSource.data = this.parcelles;
    }
  }
  compare(a: number | string, b: number | string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }


  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }



  
  displayedColumns: string[] = ['insee', 'prefix', 'section', 'numero', 'surface', 'pour_partie', 'libelle_court', 'proprietaire', 'actions'];

  isAddMode = false;
  isEditModeLocal = false;
  parcelleForm!: FormGroup;
  editingParcelle: Parcelle | null = null;
  initialFormValues: any;

  typeProprioList: SelectValue[] = [];
  isLoading = false;

  departements = [
    { code: '08', nom: 'Ardennes' },
    { code: '10', nom: 'Aube' },
    { code: '51', nom: 'Marne' },
    { code: '52', nom: 'Haute-Marne' }
  ];

  isValidating = false;
  validationError = '';
  validationSuccess = '';

  communes: any[] = [];
  filteredCommunes: any[] = [];
  sections: string[] = [];
  numeros: any[] = [];
  filteredNumeros: any[] = [];
  codeParcelles: any[] = [];
  filteredCodeParcelles: any[] = [];
  codeParcelleFilter = '';

  isLoadingCommunes = false;
  isLoadingSections = false;
  isLoadingNumeros = false;
  isLoadingCodeParcelles = false;

  selectedDepartement = '';
  selectedCommune = '';
  selectedSection = '';
  
  maxSurface: number | null = null;

  communeMap: Map<string, string> = new Map();
  isLoadingCommunesGlobal = false;

  async ngOnInit() {
    await this.preloadCommunes();
    this.loadSelectValues();
    if (this.uuidActe) {
      this.loadParcelles();
    }
    if (this.showAddForm) {
      this.startAddMode();
    }
  }

  private async preloadCommunes() {
    this.isLoadingCommunesGlobal = true;
    try {
      const deptCodes = this.departements.map(dep => dep.code);
      for (const deptCode of deptCodes) {
        const communes = await this.parcelleService.getCommunesByDepartement(deptCode);
        communes.forEach(commune => {
          if (commune.code && commune.nom) {
            this.communeMap.set(commune.code, commune.nom);
          }
        });
      }
      console.log(`[ParcelleMfu] Preloaded ${this.communeMap.size} communes`);
    } catch (error) {
      console.error('Error preloading communes:', error);
    } finally {
      this.isLoadingCommunesGlobal = false;
    }
  }

getCommuneName(parcelle: any): string {
    if (parcelle.insee) return parcelle.insee;
    return '-';
  }
  
  getCommuneNameFull(parcelle: any): string {
    const insee = parcelle.insee || '';
    if (this.communeMap.has(insee)) {
      return this.communeMap.get(insee)!;
    }
    return insee || '-';
  }

  filterCommunes(event: any) {
    const filterValue = event.target.value.toLowerCase();
    this.filteredCommunes = this.communes.filter(com => 
      com.code.toLowerCase().includes(filterValue) || 
      (com.nom && com.nom.toLowerCase().includes(filterValue))
    );
    this.cdr.detectChanges();
  }

  filterNumeros(event: any) {
    const filterValue = event.target.value.toLowerCase();
    this.filteredNumeros = this.numeros.filter(num => 
      String(num.numero).toLowerCase().includes(filterValue)
    );
    this.cdr.detectChanges();
  }

  async onDepartementChange(departementCode: string) {
    this.selectedDepartement = departementCode;
    this.resetCascadeBelow('commune');
    
    this.isLoadingCommunes = true;
    this.communes = await this.parcelleService.getCommunesByDepartement(departementCode);
    this.isLoadingCommunes = false;
    this.cdr.detectChanges();
  }



  async onCommuneChange(communeCode: string) {
    console.log('[DEBUG onCommuneChange] Setting commune:', communeCode);
    this.selectedCommune = communeCode;
    this.parcelleForm.patchValue({ insee: communeCode });
    console.log('[DEBUG] Form INSEE après set:', this.parcelleForm.get('insee')?.value);
    this.resetCascadeBelow('section');
    
    this.isLoadingSections = true;
    await new Promise(resolve => setTimeout(resolve, 600));
    this.sections = await this.parcelleService.getSectionsByCommune(communeCode);
    this.isLoadingSections = false;
    this.cdr.detectChanges();
  }



  async onSectionChange(section: string) {
    this.selectedSection = section;
    this.resetCascadeBelow('numero');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    this.isLoadingNumeros = true;
    this.numeros = await this.parcelleService.getNumerosBySection(this.selectedCommune, section);
    this.isLoadingNumeros = false;
    this.cdr.detectChanges();
  }


  onNumeroChange(numero: string) {
    const selectedParcelle = this.numeros.find(n => n.numero === numero);
    
    if (selectedParcelle && this.parcelleForm) {
      this.maxSurface = selectedParcelle.contenance || null;
      this.parcelleForm.patchValue({ 
        numero: Number(selectedParcelle.numero),
        surface: (selectedParcelle.contenance || 0) / 10000,  // m² → ha
        code_parcelle: selectedParcelle.idu
      });
      this.validationSuccess = 'Parcelle sélectionnée';
    }
    this.cdr.detectChanges();
  }

  async loadParcelles() {
    this.isLoading = true;
    try {
      this.parcelles = await this.parcelleService.getParcellesByActe(this.uuidActe);
      this.dataSource.data = this.parcelles;
    } catch (error) {
      console.error('Erreur chargement parcelles:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  loadSelectValues() {
    this.formService.getSelectValues$('sites/selectvalues=sitcenca.typ_proprietaires').subscribe({
      next: (values) => this.typeProprioList = values || [],
      error: (err) => console.error('Erreur type_proprio:', err)
    });
  }


  startAddMode() {
    this.isAddMode = true;
    this.isEditModeLocal = false;
    this.editingParcelle = null;
    this.parcelleForm = this.formService.newParcelleForm();
    this.resetCascade();
    this.parcelleForm.patchValue({ acte_mfu: this.uuidActe, prefix: '000' });
    this.initialFormValues = { ...this.parcelleForm.getRawValue() };
    this.validationError = '';
    this.validationSuccess = '';
    this.isValidating = false;
    this.cdr.detectChanges();
  }


  cancelAddMode() {
    this.isAddMode = false;
    this.parcelleForm = null!;
    this.cdr.detectChanges();
  }

  async startEditMode(parcelle: Parcelle) {
    this.isEditModeLocal = true;
    this.isAddMode = false;
    this.editingParcelle = parcelle;
    this.parcelleForm = this.formService.newParcelleForm(parcelle);
    this.initialFormValues = { ...this.parcelleForm.getRawValue() };
    
    // Cascade pour précharger les listes et sélectionner les bons éléments
    await this.loadCascadeForEdit(parcelle);
    
    this.cdr.detectChanges();
  }

  private async loadCascadeForEdit(parcelle: Parcelle) {
    if (!parcelle.insee) return;
    
    // Extraire dept de INSEE (2 premiers chars)
    this.selectedDepartement = parcelle.insee.substring(0, 2);
    
    // Charger communes pour dept
    this.isLoadingCommunes = true;
    this.communes = await this.parcelleService.getCommunesByDepartement(this.selectedDepartement);
    this.isLoadingCommunes = false;
    
    // Définir commune
    this.selectedCommune = parcelle.insee;
    this.parcelleForm.patchValue({ insee: parcelle.insee });
    
    // Charger sections
    this.isLoadingSections = true;
    await new Promise(resolve => setTimeout(resolve, 600));
    this.sections = await this.parcelleService.getSectionsByCommune(this.selectedCommune);
    this.isLoadingSections = false;
    
    // Définir section
    this.selectedSection = parcelle.section || '';
    this.parcelleForm.patchValue({ section: this.selectedSection });
    
    // Charger numeros si section
    if (this.selectedSection) {
      this.isLoadingNumeros = true;
      this.numeros = await this.parcelleService.getNumerosBySection(this.selectedCommune, this.selectedSection);
      this.isLoadingNumeros = false;
      
      // Filtrer pour numero actuel
      const currentNumero = parcelle.numero;
      const selectedNum = this.numeros.find(n => n.numero == currentNumero);
      if (selectedNum) {
        this.parcelleForm.patchValue({ 
          numero: Number(selectedNum.numero),
          code_parcelle: selectedNum.idu,
          surface: (selectedNum.contenance || 0) / 10000
        });
      }
    }
    
    this.cdr.detectChanges();
  }



  cancelEditMode() {
    this.isEditModeLocal = false;
    this.editingParcelle = null;
    this.parcelleForm = null!;
    this.validationError = '';
    this.validationSuccess = '';
    this.cdr.detectChanges();
  }


  async validateParcelle(): Promise<boolean> {
    const formValue = this.parcelleForm.getRawValue();
    const { insee, section, numero } = formValue;
    
    console.log('[DEBUG validateParcelle] Raw form values:', formValue);
    console.log('[DEBUG] insee:', insee, 'section:', section, 'numero:', numero);
    
    if (!insee || !section || !numero) {
      this.validationError = `INSEE, section et numéro obligatoires (insee:"${insee}", section:"${section}", numero:${numero})`;
      return false;
    }

    
    this.isValidating = true;
    this.cdr.detectChanges();
    
    try {
      const normalizedSection = section.toUpperCase().padStart(2, '0').substring(0, 2);
      const normalizedNumero = String(numero).padStart(4, '0').substring(0, 4);
      
      const result = await this.parcelleService.validateParcelleExists(insee, normalizedSection, normalizedNumero);
      
      if (result?.exists) {
        const props = result.properties || {};
        if (!formValue.surface && props.contenance) {
          this.parcelleForm.patchValue({ surface: props.contenance / 10000 });
          this.validationSuccess = 'Surface du cadastre';
        } else {
          this.validationSuccess = 'Parcelle validée';
        }
        if (!formValue.code_parcelle && props.idu) {
          this.parcelleForm.patchValue({ code_parcelle: props.idu });
        }
        this.isValidating = false;
        return true;
      } else {
        this.validationError = "Parcelle inconnue au cadastre";
        this.isValidating = false;
        return false;
      }
    } catch (error: any) {
      console.error('Erreur validation:', error);
      this.validationError = 'Erreur validation';
      this.isValidating = false;
      return false;
    }
  }

  onSubmit() {
    if (!this.parcelleForm?.valid) {
      this.snackBar.open('Formulaire invalide', 'OK', { duration: 3000 });
      return;
    }


    const typProprietaire = this.parcelleForm.get('typ_proprietaire')?.value;
    console.log('[DEBUG] Type propriétaire sélectionné:', typProprietaire, 'Form valid:', this.parcelleForm.valid);

    if (!typProprietaire) {
      this.validationError = 'Type propriétaire obligatoire';
      return;
    }

    const currentValues = this.parcelleForm.getRawValue();
    if (JSON.stringify(currentValues) === JSON.stringify(this.initialFormValues)) {
      this.snackBar.open('Aucun changement', 'OK', { duration: 3000 });
      return;
    }

    this.validateParcelle().then((isValid: boolean) => {
      if (isValid) {
        this.submitParcelle(currentValues);
      }
    });
  }

  private submitParcelle(formValue: any) {
    const dataToSubmit = { ...formValue };
    delete dataToSubmit.libelle;
    delete dataToSubmit.libelle_court;

    const observable$ = this.isAddMode 
      ? this.parcelleService.insertParcelle(dataToSubmit)
      : this.parcelleService.updateParcelle(this.editingParcelle!.uuid_parcelle, dataToSubmit);

    observable$.subscribe({
      next: (response: any) => {
        if (response?.success) {
          this.snackBar.open('Parcelle sauvegardée', 'OK', { duration: 3000 });
          this.loadParcelles();
          this.isAddMode ? this.cancelAddMode() : this.cancelEditMode();
          this.parcellesUpdated.emit();
        } else {
          this.snackBar.open(response?.message || 'Erreur sauvegarde', 'OK', { duration: 3000 });
        }
      },
      error: (error: any) => {
        console.error('Erreur sauvegarde:', error);
        this.snackBar.open('Erreur sauvegarde', 'OK', { duration: 3000 });
      }
    });
  }

  deleteParcelle(parcelle: Parcelle): void {
    const message = `Supprimer "${parcelle.code_parcelle || 'cette parcelle'}" ?`;
    
    this.confirmationService.confirm('Supprimer parcelle', message, 'delete').subscribe(result => {
      if (result) {
        this.parcelleService.deleteParcelle(parcelle.uuid_parcelle).subscribe({
          next: (response: any) => {
            if (response?.success) {
              this.snackBar.open('Parcelle supprimée', 'OK', { duration: 3000 });
              this.loadParcelles();
              this.parcellesUpdated.emit();
            } else {
              this.snackBar.open(response?.message || 'Erreur suppression', 'OK', { duration: 3000 });
            }
          },
          error: (error: any) => {
            console.error('Erreur suppression:', error);
            this.snackBar.open('Erreur suppression', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  getLibelle(cd_type: string, list: SelectValue[] | undefined): string {
    if (!list) return '';
    const item = list.find((t: any) => t.cd_type === cd_type);
    return item?.libelle || cd_type;
  }

  getTypeProprioList(): SelectValue[] {
    return this.typeProprioList;
  }

  clearCascade(level: 'departement' | 'commune' | 'section' | 'numero') {
    switch (level) {
      case 'departement':
        this.selectedDepartement = '';
        this.parcelleForm?.patchValue({ insee: '' });
        this.resetCascade();
        break;
      case 'commune':
        this.selectedCommune = '';
        this.parcelleForm?.patchValue({ insee: '' });
        this.resetSectionDown()
        break;
      case 'section':
        this.selectedSection = '';
        this.parcelleForm?.patchValue({ section: '', numero: null, code_parcelle: '', surface: null });
        this.numeros = [];
        break;
      case 'numero':
        this.parcelleForm?.patchValue({ numero: null, code_parcelle: '', surface: null });
        break;
    }
    this.cdr.detectChanges();
  }

  private resetSectionDown() {
    this.selectedSection = '';
    this.sections = [];
    this.numeros = [];
    this.maxSurface = null;
    if (this.parcelleForm) {
      this.parcelleForm.patchValue({ section: '', numero: null, code_parcelle: '' });
    }
    console.log('[DEBUG resetSectionDown] Form INSEE après reset:', this.parcelleForm?.get('insee')?.value);
  }

  toggleEditParcelle(action: String): void {
    console.log('toggleEditParcelle:', action);
    
    if (action === 'cancel') {
      this.isAddMode ? this.cancelAddMode() : this.cancelEditMode();
    } else if (action === 'add') {
      this.startAddMode();
    }
  }


  private resetCascade() {
    this.resetCascadeBelow('commune');
  }







  private resetCascadeBelow(level: 'commune' | 'section' | 'numero') {
    // Toujours reset les champs en aval vers vide/null quel que soit le mode
    switch (level) {
      case 'commune':
        this.selectedCommune = '';
        this.selectedSection = '';
        this.communes = [];
        this.sections = [];
        this.numeros = [];
        this.maxSurface = null;
        if (this.parcelleForm) {
          this.parcelleForm.patchValue({ 
            insee: '', 
            section: '', 
            numero: null, 
            code_parcelle: '', 
            surface: null
          });
        }
        break;
      case 'section':
        this.selectedSection = '';
        this.sections = [];
        this.numeros = [];
        this.maxSurface = null;
        if (this.parcelleForm) {
          this.parcelleForm.patchValue({ 
            section: '', 
            numero: null, 
            code_parcelle: '', 
            surface: null
          });
        }
        break;
      case 'numero':
        this.numeros = [];
        this.maxSurface = null;
        if (this.parcelleForm) {
          this.parcelleForm.patchValue({ 
            numero: null, 
            code_parcelle: '' 
          });
        }
        break;
    }
    this.cdr.detectChanges();
  }




}



