import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, ChangeDetectorRef, ViewChild, inject } from '@angular/core';



import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';

import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule, MatAutocomplete } from '@angular/material/autocomplete';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { Overlay } from '@angular/cdk/overlay';


import { Parcelle } from './parcelle';
import { ParcelleService } from './parcelle.service';
import { FormService } from '../../../../../shared/services/form.service';
import { ConfirmationService } from '../../../../../shared/services/confirmation.service';
import { SelectValue } from '../../../../../shared/interfaces/formValues';
import { FormButtonsComponent } from '../../../../../shared/form-buttons/form-buttons.component';

function getFrenchPaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();

  paginatorIntl.itemsPerPageLabel = 'Elements par page';
  paginatorIntl.nextPageLabel = 'Page suivante';
  paginatorIntl.previousPageLabel = 'Page precedente';
  paginatorIntl.firstPageLabel = 'Premiere page';
  paginatorIntl.lastPageLabel = 'Derniere page';
  paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return `0 sur ${length}`;
    }

    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, length);

    return `${startIndex + 1} - ${endIndex} sur ${length}`;
  };

  return paginatorIntl;
}

@Component({
  selector: 'app-parcelle-mfu',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatIconModule,
    MatButtonModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    FormButtonsComponent,
  ],
  providers: [{ provide: MatPaginatorIntl, useFactory: getFrenchPaginatorIntl }],



  templateUrl: './parcelle-mfu.component.html',
  styleUrl: './parcelle-mfu.component.scss'
})
export class ParcelleMfuComponent implements OnInit, AfterViewInit {

@ViewChild(MatSort)
set sort(sort: MatSort) {
  this.dataSource.sort = sort;
}

@ViewChild(MatPaginator)
set paginator(paginator: MatPaginator) {
  this.dataSource.paginator = paginator;
}

  getParcellePageSizeOptions(): number[] {
    // Ajoute dynamiquement le total filtre dans les tailles de page.
    const totalFiltered = this.dataSource.filteredData.length;
    const total = totalFiltered > 0 ? totalFiltered : this.dataSource.data.length;
    const baseOptions = [10, 20, 50, 100, 200];
    const options = total > 0 ? [...baseOptions, total] : baseOptions;
    return Array.from(new Set(options)).sort((a, b) => a - b);
  }

  @Input() uuidActe: string = '';
  filterValue: string = '';

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

  ngAfterViewInit() {
    this.dataSource.sortingDataAccessor = (item: Parcelle, property: string): string | number => {
      switch (property) {
        case 'insee':
          return (this.getCommuneNameFull(item) || '').toLowerCase();
        case 'prefix':
          return item.prefix || '';
        case 'code_parcelle':
          return item.code_parcelle || '';
        case 'section':
          return item.section || '';
        case 'numero':
          return Number(item.numero ?? 0);
        case 'surface':
          return Number(item.surface ?? 0);
        case 'pour_partie':
          return String(item.pour_partie) === 'true' ? 1 : 0;
        case 'libelle_court':
          return (this.getLibelle(item.libelle_court, this.typeProprioList) || '').toLowerCase();
        case 'proprietaire':
          return (item.proprietaire || '').toLowerCase();
        default:
          return (item as any)[property] ?? '';
      }
    };

  }

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

  // Variable pour le filtre avec ngModel
  get ParcellesTotal(): number {
    return this.parcelles.length;
  }

  get ParcellesValides(): number {
    return this.parcelles.filter(parcelle => String(parcelle.validite) === 'true').length;
  }
  
  get ParcellesInvalides(): number {
    return this.parcelles.filter(parcelle => String(parcelle.validite) === 'false').length;
  }

// Appliquer le filtre
  applicationFiltre(): void {
    console.log("Filtre appliqué : ", this.filterValidite);
    this.updateTableFilter();
  }

  // Variable pour le filtre avec ngModel
  filterValidite: string = 'tous';
  
  displayedColumns: string[] = ['insee', 'prefix', 'code_parcelle', 'section', 'numero', 'surface', 'pour_partie', 'libelle_court', 'proprietaire', 'actions'];

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

  get isCascadeLoading(): boolean {
    return this.isLoadingSections || this.isLoadingNumeros;
  }

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

  applyFilter(value: string): void {
    this.filterValue = value;
    this.updateTableFilter();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private updateTableFilter(): void {
    this.dataSource.filterPredicate = (data: Parcelle, filter: string) => {
      const parsedFilter = JSON.parse(filter) as { validite: string; keyword: string };
      const validiteValue = String(data.validite);
      const keyword = parsedFilter.keyword || '';

      const matchesValidite =
        parsedFilter.validite === 'tous' ||
        (parsedFilter.validite === 'valide' && validiteValue === 'true') ||
        (parsedFilter.validite === 'invalide' && validiteValue === 'false');

      if (!matchesValidite) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const searchableText = [
        this.getCommuneNameFull(data),
        data.code_parcelle,
        data.prefix,
        data.section,
        data.numero,
        data.surface,
        data.proprietaire,
        this.getLibelle(data.libelle_court, this.typeProprioList),
        String(data.pour_partie) === 'true' ? 'oui' : 'non',
      ]
        .map((value) => String(value ?? '').toLowerCase())
        .join(' ');

      return searchableText.includes(keyword);
    };

    this.dataSource.filter = JSON.stringify({
      validite: this.filterValidite,
      keyword: this.filterValue.trim().toLowerCase(),
    });
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
    const com: any = {};
    com.nom = this.communeMap.get(parcelle.insee) || parcelle.insee || '-';
    return com.nom;
  }

  displayCommuneFn(code: string): string {
    return this.communeMap.get(code) || code || '';
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
    console.log('[DEBUG] Commune:', communeCode);
    this.selectedCommune = communeCode;
    this.parcelleForm.patchValue({ insee: communeCode });
    
    // Mise a jour en direct du code parcelle
    this.updateCodeParcelle();
    
    this.resetCascadeBelow('section');
    
    this.isLoadingSections = true;
    try {
      this.sections = await this.parcelleService.getSectionsByCommune(communeCode);
    } catch (error) {
      console.error('Sections failed:', error);
      this.sections = [];
    }
    this.isLoadingSections = false;
    this.cdr.detectChanges();
  }

  async onSectionChange(section: string) {
    if (this.isLoadingSections || !this.selectedCommune) return; // Evite les courses entre requetes
    
    this.selectedSection = section;
    
    // Mise a jour en direct du code parcelle
    this.updateCodeParcelle();
    
    this.resetCascadeBelow('numero');
    
    this.isLoadingNumeros = true;
    try {
      this.numeros = await this.parcelleService.getNumerosBySection(this.selectedCommune, section);
    } catch (error) {
      console.error('Numeros failed:', error);
      this.numeros = [];
    }
    this.isLoadingNumeros = false;
    this.cdr.detectChanges();
  }


  async onNumeroChange(numeroStr: string) {
    const numero = parseInt(numeroStr);
    console.log('[DEBUG] Numero selected:', numeroStr, '→', numero);
    
    // Mettre a jour le champ numero
    this.parcelleForm.patchValue({ numero });
    
    // Recuperer toutes les valeurs necessaires pour construire code_parcelle
    const insee = this.parcelleForm.get('insee')?.value as string;
    const prefix = this.parcelleForm.get('prefix')?.value as string || '000';
    const section = this.parcelleForm.get('section')?.value as string;
    
    console.log('[DEBUG code_parcelle] Form values:', {insee, prefix, section, numero});
    
    // Tous les champs sont requis pour generer un code parcelle fiable
    if (!insee || !prefix || !section || numero === undefined || Number.isNaN(numero)) {
      console.warn('[DEBUG] Missing fields for code_parcelle');
      this.validationError = 'Compléter INSEE + Préfixe + Section + Numéro';
      return;
    }
    
    // Format attendu : INSEE + PREFIX + SECTION + NUMERO
    const formattedNumero = String(numero).padStart(4, '0');
    const formattedSection = section.padStart(2, '0').toUpperCase();
    const codeParcelle = `${insee}${prefix}${formattedSection}${formattedNumero}`;
    
    console.log('[DEBUG] code_parcelle GENERATED:', codeParcelle);
    
    // Appliquer immediatement la valeur calculee
    this.parcelleForm.patchValue({ code_parcelle: codeParcelle });
    this.validationSuccess = `Code: ${codeParcelle}`;

    // Pré-remplir immédiatement la surface depuis la parcelle chargée en cascade.
    // Priorité: correspondance sur IDU/code parcelle, sinon section+numéro.
    const selectedNumero = this.numeros.find((item: any) => {
      const itemNumero = String(item?.numero ?? '').padStart(4, '0');
      const itemSection = String(item?.geojson?.properties?.section ?? section)
        .toUpperCase()
        .padStart(2, '0');
      const itemIdu = String(item?.idu ?? item?.geojson?.properties?.idu ?? '');
      return itemIdu === codeParcelle || (itemSection === formattedSection && itemNumero === formattedNumero);
    });

    const surfaceHaFromCascade = this.extractSurfaceHa(
      selectedNumero?.contenance,
      selectedNumero?.geojson?.properties?.contenance,
      selectedNumero?.geojson?.properties?.surface
    );
    if (surfaceHaFromCascade !== null) {
      this.parcelleForm.patchValue({ surface: surfaceHaFromCascade });
      this.validationSuccess = `Code: ${codeParcelle} | Surface: ${surfaceHaFromCascade.toFixed(4)} ha`;
    } else {
      const geojson = await this.parcelleService.getParcelleGeoJson(insee, formattedSection, formattedNumero);
      const surfaceHaFromGeojson = this.extractSurfaceHa(
        geojson?.properties?.contenance,
        geojson?.properties?.surface
      );
      if (surfaceHaFromGeojson !== null) {
        this.parcelleForm.patchValue({ surface: surfaceHaFromGeojson });
        this.validationSuccess = `Code: ${codeParcelle} | Surface: ${surfaceHaFromGeojson.toFixed(4)} ha`;
      }
    }
    
    // Validation IGN optionnelle en arriere-plan (sans bloquer l'interface)
    if (/^[0-9]{5}$/.test(insee)) {
      this.parcelleService.validateParcelleExists(insee, formattedSection, formattedNumero)
        .then(result => {
          if (result?.exists) {
            this.validationSuccess = `Code: ${codeParcelle} validé`;
            const surfaceHaFromValidation = this.extractSurfaceHa(result?.properties?.contenance);
            if (surfaceHaFromValidation !== null) {
              this.parcelleForm.patchValue({ surface: surfaceHaFromValidation });
            }
          }
        })
        .catch(() => {
          // En cas d'echec reseau, on conserve le code calcule localement
        });
    }
    
    this.cdr.detectChanges();
  }

  private extractSurfaceHa(...candidates: any[]): number | null {
    for (const candidate of candidates) {
      const value = Number(candidate);
      if (!Number.isFinite(value) || value <= 0) {
        continue;
      }

      // Valeurs cadastrales en m², conversion en hectares.
      // Si valeur faible, on la considère déjà en hectares.
      return value > 100 ? value / 10000 : value;
    }

    return null;
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

async refreshParcelles(): Promise<void> {
    if (this.uuidActe) {
      const subroute = `parcelles/acte/${this.uuidActe}`;
      console.log("Rafraîchissement de la liste des parcelles. UUID:", this.uuidActe);
      try {
        this.parcelles = await this.parcelleService.getParcellesByActe(this.uuidActe);
        this.dataSource.data = this.parcelles;
        // Configurer le filtre personnalisé
        this.dataSource.filterPredicate = (data: Parcelle, filter: string) => {
          const actuelValue = String(data.validite);
          if (filter === 'tous') {
            return true;
          }
          if (filter === 'valide') {
            return actuelValue === 'true';
          }
          if (filter === 'invalide') {
            return actuelValue === 'false';
          }
          return true;
        };
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Erreur lors du rafraîchissement des parcelles', error);
      }
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
    this.cdr.detectChanges();
  }

async startEditMode(parcelle: Parcelle) {
    this.isEditModeLocal = true;
    this.isAddMode = false;
    this.editingParcelle = parcelle;
    this.parcelleForm = this.formService.newParcelleForm(parcelle);
    if (!this.parcelleForm) {
      console.error('Form creation failed!');
      return;
    }
    this.initialFormValues = { ...this.parcelleForm.getRawValue() };
    
    // Reinitialiser les messages de validation
    this.validationError = '';
    this.validationSuccess = '';
    
    // Cascade pour précharger les listes et sélectionner les bons éléments
    await this.loadCascadeForEdit(parcelle);
    
    this.cdr.detectChanges();
  }

  private async loadCascadeForEdit(parcelle: Parcelle) {
    if (!parcelle.insee || !this.parcelleForm) return;

    // Réinitialiser les flags pour éviter de rester bloqué en "chargement"
    this.isLoadingSections = false;
    this.isLoadingNumeros = false;
    
    // Extraire dept de INSEE (2 premiers chars)
    this.selectedDepartement = parcelle.insee.substring(0, 2);
    
    // Charger communes pour dept
    this.isLoadingCommunes = true;
    try {
      this.communes = await this.parcelleService.getCommunesByDepartement(this.selectedDepartement);
      this.filteredCommunes = [...this.communes];
    } catch (error) {
      console.error('Chargement communes (edit) échoué:', error);
      this.communes = [];
      this.filteredCommunes = [];
    } finally {
      this.isLoadingCommunes = false;
    }
    
    // Définir commune
    this.selectedCommune = parcelle.insee;
    this.parcelleForm.patchValue({ insee: parcelle.insee });
    
    // Charger sections
    this.isLoadingSections = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      this.sections = await this.parcelleService.getSectionsByCommune(this.selectedCommune);
    } catch (error) {
      console.error('Chargement sections (edit) échoué:', error);
      this.sections = [];
    } finally {
      this.isLoadingSections = false;
    }
    
    // Définir section
    this.selectedSection = parcelle.section || '';
    this.parcelleForm.patchValue({ section: this.selectedSection });
    
    // Charger numeros si section
    if (this.selectedSection) {
      this.isLoadingNumeros = true;
      try {
        this.numeros = await this.parcelleService.getNumerosBySection(this.selectedCommune, this.selectedSection);
        this.filteredNumeros = [...this.numeros];
      } catch (error) {
        console.error('Chargement numéros (edit) échoué:', error);
        this.numeros = [];
        this.filteredNumeros = [];
      } finally {
        this.isLoadingNumeros = false;
      }
      
      // Filtrer pour numero actuel
      const currentNumero = parcelle.numero;
      const selectedNum = this.numeros.find(n => n.numero == currentNumero);
      if (selectedNum) {
        this.parcelleForm.patchValue({ 
          numero: Number(selectedNum.numero)
          // Ne pas ecraser automatiquement la surface en mode edition
        });
      } else if (currentNumero) {
        this.parcelleForm.patchValue({ numero: Number(currentNumero) });
      }
    } else {
      this.numeros = [];
      this.filteredNumeros = [];
      this.isLoadingNumeros = false;
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
    this.cdr.detectChanges(); // Force une double detection pour stabiliser les slide-toggle
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
        // Ne pas ecraser un code_parcelle deja saisi.
        // On le renseigne uniquement s'il est vide (mode ajout).
        if (!this.parcelleForm.get('code_parcelle')?.value && props.idu) {
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
    if (!typProprietaire) {
      this.validationError = 'Type propriétaire obligatoire';
      return;
    }

    const currentValues = this.parcelleForm.getRawValue();
    if (JSON.stringify(currentValues) === JSON.stringify(this.initialFormValues)) {
      this.snackBar.open('Aucun changement', 'OK', { duration: 3000 });
      return;
    }

    // En mode edition, on saute la validation cadastrale deja faite
    if (this.isEditModeLocal) {
      this.submitParcelle(currentValues);
      return;
    }

    // En mode ajout uniquement : valider la parcelle dans le cadastre
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
          setTimeout(() => {
            this.isAddMode ? this.cancelAddMode() : this.cancelEditMode();
          });
          this.parcellesUpdated.emit();
          this.cdr.detectChanges();
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

  private updateCodeParcelle() {
    const insee = this.parcelleForm.get('insee')?.value as string || '';
    const prefix = this.parcelleForm.get('prefix')?.value as string || '000';
    const section = this.parcelleForm.get('section')?.value as string || '';
    const numero = this.parcelleForm.get('numero')?.value as number;
    
    if (!insee || !prefix) return;
    
    let code = insee + prefix;
    
    if (section) code += section.padStart(2, '0').toUpperCase();
    if (numero !== undefined && numero !== null) code += String(numero).padStart(4, '0');
    
    console.log('[LIVE] code_parcelle =', code);
    this.parcelleForm.patchValue({ code_parcelle: code });
    this.validationSuccess = `Live généré: ${code}`;
    this.cdr.detectChanges();
  }

  private resetCascadeBelow(level: 'commune' | 'section' | 'numero') {
    console.log('[DEBUG] Reset level:', level);
    
    switch (level) {
      case 'commune':
        this.selectedCommune = '';
        this.selectedSection = '';
        this.sections = [];
        this.numeros = [];
        this.maxSurface = null;
        this.parcelleForm?.patchValue({ insee: '', section: '', numero: null, code_parcelle: '' });
        break;
      case 'section':
        this.selectedSection = '';
        this.sections = [];
        this.numeros = [];
        this.maxSurface = null;
        this.parcelleForm?.patchValue({ section: '', numero: null, code_parcelle: '' });
        break;
      case 'numero':
        this.numeros = [];
        this.maxSurface = null;
        this.parcelleForm?.patchValue({ numero: null, code_parcelle: '' });
        break;
    }
    this.validationSuccess = '';
    this.cdr.detectChanges();
  }




}



