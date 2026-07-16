import { Component, Inject, ChangeDetectorRef, ViewChild, ElementRef} from '@angular/core';
import { CommonModule } from '../../../../../../node_modules/@angular/common';

import { MatDialogRef, MatDialogContent, MAT_DIALOG_DATA,} from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Overlay } from '@angular/cdk/overlay';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { TooltipPosition, MatTooltipModule } from '@angular/material/tooltip';

import { FilterByPipe } from '../../../../shared/pipes/filter-by.pipe';

import { ProjetMfu, ProjetsMfu, ParcellesSelected } from '../../foncier';
import { FoncierService } from '../../foncier.service';
import { HttpClient, HttpParams, HttpErrorResponse,} from '@angular/common/http';

import { SelectValue } from '../../../../shared/interfaces/formValues';
import { Commune, Communes } from '../../../../shared/interfaces/geo';
import { FormService } from '../../../../shared/services/form.service';
import { LoginService } from '../../../../login/login.service';
import { GeoService } from '../../../../shared/services/geo.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { DocfileService } from '../../../../shared/services/docfile.service';

import { FormButtonsComponent } from '../../../../shared/form-buttons/form-buttons.component';
import { FileExploratorComponent } from '../../../../shared/file-explorator/file-explorator.component';

import { FormControl, FormGroup, ReactiveFormsModule, FormsModule, Form } from '@angular/forms';

import { Subscription, lastValueFrom } from 'rxjs';

import { MatStepperModule, MatStepper, StepperOrientation,} from '@angular/material/stepper';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar'; // Importer MatSnackBar
import { MatDatepickerIntl, MatDatepickerModule,} from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS,} from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';

import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';

import { provideMomentDateAdapter } from '@angular/material-moment-adapter';

import { Observable, BehaviorSubject } from 'rxjs';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MapComponent } from '../../../../map/map.component';

import { ApiResponse } from '../../../../shared/interfaces/api';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

export interface Section {
  cd_type: number;
  name: string;
  numberElements?: number;
}
@Component({
  selector: 'app-detail-pmfu',
  standalone: true,
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'fr-FR'},
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    provideMomentDateAdapter(),
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: {displayDefaultIndicatorType: false},
    },
  ],
  imports: [
    CommonModule,
    FilterByPipe,
    FormButtonsComponent,
    FileExploratorComponent,
    ReactiveFormsModule,
    MatDialogContent,
    FormsModule,
    MatCheckboxModule,
    MatIconModule,
    MatTooltipModule,
    MatStepperModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatListModule,
    MapComponent,
    MatAutocompleteModule,
    MatChipsModule,
  ],
  templateUrl: './detail-pmfu.component.html',
  styleUrl: './detail-pmfu.component.scss',
})
export class DetailPmfuComponent {
  get anneeSignatureMin(): number {
    const debutValue = this.pmfuForm?.get('pmfu_annee_debut')?.value;
    const debut = debutValue === null || debutValue === '' ? null : Number(debutValue);
    if (debut === null || Number.isNaN(debut)) return 2024;
    return Math.max(2024, debut);
  }

  // Série de 6 getters pour obtenir les libellés des sélections multiples
  getFinancementsLibelles(): string {
    const values = this.pmfuForm?.get('pmfu_financements')?.value;
    if (!values || !Array.isArray(values) || values.length === 0) return '';
    return values
      .map(cd => this.formService.getLibelleByCdType(cd, this.typeFinancement))
      .filter(Boolean)
      .join(', ');
  }

  getAppuisLibelles(): string {
    const values = this.pmfuForm?.get('pmfu_appui')?.value;
    if (!values || !Array.isArray(values) || values.length === 0) return '';
    return values
      .map(cd => this.formService.getLibelleByCdType(cd, this.typebesoinAppuis))
      .filter(Boolean)
      .join(', ');
  }

  getAgencesLibelles(): string {
    const values = this.pmfuForm?.get('pmfu_agence')?.value;
    if (!values || !Array.isArray(values) || values.length === 0) return '';
    return values
      .map(cd => this.formService.getLibelleByCdType(cd, this.typeAgence))
      .filter(Boolean)
      .join(', ');
  }

  getProprietairesLibelles(): string {
    const values = this.pmfuForm?.get('pmfu_proprietaire')?.value;
    if (!values || !Array.isArray(values) || values.length === 0) return '';
    return values
      .map(cd => this.formService.getLibelleByCdType(cd, this.typeProprio))
      .filter(Boolean)
      .join(', ');
  }

  getEtapesLibelles(): string {
    const values = this.pmfuForm?.get('pmfu_proch_etape')?.value;
    if (!values || !Array.isArray(values) || values.length === 0) return '';
    return values
      .map(cd => this.formService.getLibelleByCdType(cd, this.typeProchEtape))
      .filter(Boolean)
      .join(', ');
  }

  getTerritoiresLibelles(): string {
    const values = this.pmfuForm?.get('pmfu_territoire')?.value;
    if (!values || !Array.isArray(values) || values.length === 0) return '';
    return values
      .map(cd => this.formService.getLibelleByCdType(cd, this.typeTerritoire))
      .filter(Boolean)
      .join(', ');
  }

  newPmfu: boolean = false;  
  pmfuForm!: FormGroup;
  initialFormValues!: ProjetMfu;
  isFormValid: boolean = false;
    
  salaries: SelectValue[] = [];
  cd_salarie: string | null = null; // Code salarié de l'utilisateur connecté
  gro_id: number | null = null; // Groupe de l'utilisateur connecté
  pmfuTitle: String = '';
  
  
  pmfu!: ProjetMfu;
  projetLite!: ProjetsMfu;
  isLoading: boolean = true;
  loadingDelay: number = 400;
  
  doc_types!: {cd_type: number, libelle: string, path: string, field: string}[];
  selectedFolder?: number;
  isDragging: boolean = false;
  isAddPmfu: boolean = false;
  isEditPmfu: boolean = false;
  
  docForm!: FormGroup;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('docxContainer', { static: false })
  docxContainer!: ElementRef<HTMLDivElement>;
  galerie?: string[];
  private formStatusSubscription: Subscription | null = null;
  folders: Section[] = [];
  filePathList: string[] = [];
  previewUrl?: SafeResourceUrl;
  isDocxView = false;
  pdfUrl?: string;
  imageUrl?: string;
  imagePathList?: string[];
  filesNames: string[][] = [];
  fileErrors: Record<string, string[]> = {};
  private foldersSubject = new BehaviorSubject<Section[]>([]);
  allowedTypes: Record<string, string[]> = {};
  folders$ = this.foldersSubject.asObservable();
  @ViewChild(FileExploratorComponent) fileExplorator!: FileExploratorComponent;
  @ViewChild(MapComponent) mapComponent!: MapComponent;
  @ViewChild('mfuStepper') mfuStepper!: MatStepper;
  
  communes: Commune[] = []; // Communes disponibles pour le département sélectionné
  // Typé string | Commune : le trigger d'autocomplete écrit temporairement l'objet Commune
  // sélectionné dans ce contrôle avant qu'onCommuneSelected() ne le réinitialise à ''.
  communeCtrl = new FormControl<string | Commune>('');
  isCommuneDisabled: boolean = true;
  filteredCommunes: Commune[] = []; // Communes proposées par l'autocomplete (déjà sélectionnées exclues)
  selectedCommunes: Commune[] = []; // Communes actuellement associées au projet MFU

  // Listes de choix du formulaire
  typeFinancement!: SelectValue[];
  typeAgence!: SelectValue[];
  typeActe!: SelectValue[];
  typeProprio!: SelectValue[];
  typebesoinAppuis!: SelectValue[];
  typeValidationCa!: SelectValue[];
  typePriorite!: SelectValue[];
  typeStatus!: SelectValue[];
  typeProchEtape!: SelectValue[];
  typeTerritoire!: SelectValue[];

  // Endpoints qui ont échoué lors du chargement des listes de choix
  failedSelects: string[] = [];

  // Helper pour charger un endpoint selectvalues et assigner sa valeur ou enregistrer l'échec
  private async loadAndAssign(endpoint: string, assign: (vals?: SelectValue[]) => void) {
    try {
      const selectValues = await lastValueFrom(this.formService.getSelectValues$(endpoint));
      console.log(`Liste de choix ${endpoint} récupérée avec succès :`, selectValues);
      assign(selectValues);
    } catch (error) {
      console.error(`Erreur lors de la récupération de la liste de choix ${endpoint}:`, error);
      this.failedSelects.push(endpoint);
    }
  }

  // Propriétés pour les sites CENCA
  afficherSitesCenca: boolean = false;
  afficherSitesCencaSites: boolean = false;
  
  // Parcelles selectionnées dans la carte
  // A chaque fois qu'une parcelle est selectionnée, cette liste est mise à jour en utilisant un emmeteur vers cette propriété ci-dessous
  parcellesSelected: ParcellesSelected[] = [];
  // Liste des parcelles initialement sélectionnées
  initialparcellesSelected: ParcellesSelected[] = [];
  parcellesInitialesBackup: ParcellesSelected[] = [];
  // Indique si le projet démarre avec des parcelles préchargées
  hasInitialParcelles: boolean = false;
  // Liste des parcelles ajoutées (modifiables par undo)
  parcellesAjoutees: ParcellesSelected[] = [];
  // Vouloir le controle d'ajout de parcelles sur la carte
  selectParcellesMode: boolean = true;
  // Poubelle des parcelles supprimées
  trashParcelle: ParcellesSelected[] = [];

  private snapshotFormValues<T>(values: T): T {
    try {
      return structuredClone(values);
    } catch {
      return JSON.parse(JSON.stringify(values));
    }
  }
  
  constructor(
    public docfileService: DocfileService,
    private confirmationService: ConfirmationService,
    public formService: FormService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private foncierService: FoncierService,
    private loginService: LoginService, // Inject LoginService
    private geoService: GeoService,
    private dialogRef: MatDialogRef<DetailPmfuComponent>,
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private overlay: Overlay,
    @Inject(MAT_DIALOG_DATA) public data: ProjetsMfu | number // Inject MAT_DIALOG_DATA to access the passed data
  ) {
    // Données en entrée provenant de la liste simple des projets tous confondus
    console.log('Données reçues dans le composant projet :', data);
    if (typeof data === 'object') {
      this.projetLite = data as ProjetsMfu;
      console.log(
        'ProjetLite reçu dans le composant projet :',
        this.projetLite
      );
    }
  }
  
  getDepartementLibelle(code: string): string {
    switch (code) {
      case '08': return 'Ardennes';
      case '10': return 'Aube';
      case '51': return 'Marne';
      case '52': return 'Haute-Marne';
      default: return code || '';
    }
  }

  async getCommunesFromDepartement(code: string): Promise<Communes[] | undefined> {
    const communesRaw = await this.geoService.apiGeoCommunesUrl(code);
    // Mapping Communes[] -> Commune[] (ajoute les propriétés manquantes si besoin)
    this.communes = communesRaw.map((item: any) => ({
      nom: item.nom,
      insee: item.code,
      population: item.population ?? 0,
      codeposte: item.codeposte ?? ''
    }));
    return this.communes;
  // Méthode d'affichage pour l'autocomplete commune
  }

  async getCommuneByInsee(insee: string): Promise<Commune | undefined> {
    return this.communes.find(commune => commune.insee === insee);
  }

  ngAfterViewInit() {
    // Abonnement à l'EventEmitter de suppression de parcelle côté carte
    if (this.mapComponent && this.mapComponent.parcelleRemoved) {
      this.mapComponent.parcelleRemoved.subscribe((idu: string) => this.onParcelleRemoved(idu));
    }
  }

  // Affichage du nom de la commune pour l'autocomplete
  displayCommune(commune?: Commune): string {
    return commune ? commune.nom : '';
  }

  /** Libellé des communes sélectionnées, pour l'affichage en lecture seule */
  getCommunesLibelle(): string {
    return this.selectedCommunes.map((c) => c.nom).join(', ');
  }

  /** Répercute selectedCommunes (source de vérité de l'UI) dans le formulaire réactif */
  private syncSelectedCommunesToForm(): void {
    this.pmfuForm.get('pmfu_commune_insee')?.setValue(this.selectedCommunes.map((c) => c.insee));
    this.pmfuForm.get('pmfu_commune_nom')?.setValue(this.selectedCommunes.map((c) => c.nom));
  }

  /** Recalcule la liste proposée par l'autocomplete (communes déjà sélectionnées exclues) */
  private refreshFilteredCommunes(filterValue: string = ''): void {
    const already = new Set(this.selectedCommunes.map((c) => c.insee));
    const lower = filterValue.toLowerCase();
    this.filteredCommunes = this.communes.filter(
      (commune) => !already.has(commune.insee) && commune.nom.toLowerCase().includes(lower)
    );
  }

  /**
   * Ajoute la commune choisie dans l'autocomplete à la liste des communes du projet
   */
  onCommuneSelected(event: MatAutocompleteSelectedEvent): void {
    const commune = event.option.value as Commune;
    if (!this.selectedCommunes.find((c) => c.insee === commune.insee)) {
      this.selectedCommunes = [...this.selectedCommunes, commune];
      this.syncSelectedCommunesToForm();
    }
    this.communeCtrl.setValue('', { emitEvent: false });
    this.refreshFilteredCommunes('');
  }

  /**
   * Retire une commune de la liste des communes du projet
   */
  removeCommune(commune: Commune): void {
    this.selectedCommunes = this.selectedCommunes.filter((c) => c.insee !== commune.insee);
    this.syncSelectedCommunesToForm();
    const ctrlValue = this.communeCtrl.value;
    this.refreshFilteredCommunes(typeof ctrlValue === 'string' ? ctrlValue : '');
  }

  /**
   * Réinitialise la liste des communes du projet
   */
  clearCommunes(): void {
    this.selectedCommunes = [];
    this.syncSelectedCommunesToForm();
    this.communeCtrl.setValue('', { emitEvent: false });
    this.refreshFilteredCommunes('');
  }

  async ngOnInit() {

    // Récuperer les listes de choix via helper (collecte des endpoints en échec)
    const subrouteTypfinancement = `sites/selectvalues=${'sitcenca.libelles'}/financement_agence`;
    const subrouteTypeAgence = `sites/selectvalues=${'sitcenca.libelles'}/financement_agence-agence`;
    const subrouteTypeActe = `sites/selectvalues=${'sitcenca.libelles'}/types_acte`;
    const subrouteTypeProprio = `sites/selectvalues=${'sitcenca.libelles'}/type_proprio`;
    const subrouteBesoinAppuis = `sites/selectvalues=${'sitcenca.libelles'}/besoin_appuis`;
    const subrouteValidationCa = `sites/selectvalues=${'sitcenca.libelles'}/validation_ca`;
    const subroutePriorite = `sites/selectvalues=${'sitcenca.libelles'}/priorite`;
    const subrouteStatus = `sites/selectvalues=${'sitcenca.libelles'}/status`;
    const subrouteProchaineEtape = `sites/selectvalues=${'sitcenca.libelles'}/prochaine_etape`;
    const subrouteTerritoire = `sites/selectvalues=${'sitcenca.libelles'}/territoire`;
    // Lancer les chargements et attendre qu'ils soient terminés pour pouvoir
    // afficher une alerte globale si certains endpoints ont échoué.
    const loaders = [
      this.loadAndAssign(subrouteTypfinancement, (vals) => (this.typeFinancement = vals || [])),
      this.loadAndAssign(subrouteTypeAgence, (vals) => (this.typeAgence = vals || [])),
      this.loadAndAssign(subrouteTypeActe, (vals) => (this.typeActe = vals || [])),
      this.loadAndAssign(subrouteTypeProprio, (vals) => (this.typeProprio = vals || [])),
      this.loadAndAssign(subrouteBesoinAppuis, (vals) => (this.typebesoinAppuis = vals || [])),
      this.loadAndAssign(subrouteValidationCa, (vals) => (this.typeValidationCa = vals || [])),
      this.loadAndAssign(subroutePriorite, (vals) => (this.typePriorite = vals || [])),
      this.loadAndAssign(subrouteStatus, (vals) => (this.typeStatus = vals || [])),
      this.loadAndAssign(subrouteProchaineEtape, (vals) => (this.typeProchEtape = vals || [])),
      this.loadAndAssign(subrouteTerritoire, (vals) => (this.typeTerritoire = vals || [])),
    ];
    await Promise.all(loaders);
    if (this.failedSelects.length > 0) {
      const msg = `Échec chargement listes: ${this.failedSelects.join(', ')}`;
      this.snackBar.open(msg, 'OK', { duration: 8000 });
      console.warn('Endpoints failed:', this.failedSelects);
    }




    // Initialisation du filtrage pour l'autocomplete commune
    // communeCtrl ne sert qu'à la recherche : la sélection ajoute la commune à selectedCommunes
    // (voir onCommuneSelected), qui est la source de vérité synchronisée vers pmfu_commune_insee/nom.
    this.communeCtrl.valueChanges.subscribe(value => {
      const filterValue = typeof value === 'string' ? value : (value as Commune)?.nom || '';
      this.refreshFilteredCommunes(filterValue);
    });

    await this.docfileService.loadDocTypes(1); // Le parametre 1 veut dire "documents de projet" c'est la clé primaire de la table des types de documents
    this.doc_types = this.docfileService.doc_types;
    this.initializeAllowedTypes();
    // Initialiser les valeurs du formulaire principal quand le composant a fini de s'initialiser
    this.cd_salarie = this.loginService.user()?.cd_salarie || null; // Code salarié de l'utilisateur connecté
    this.gro_id = Math.max(0, ...(this.loginService.user()?.groups ?? [0])) || null;

    // Récupérer les valeurs pour les selects
    // Récupérer les salariés pour créateur et responsable
    this.formService.getSelectValues$('sites/selectvalues=admin.salaries/')
      .subscribe((selectValues: SelectValue[] | undefined) => {
        this.salaries = selectValues || [];
        console.log('LISTE DE CHOIX this.salaries : ');
        console.log(this.salaries);
        // Filtrage en TypeScript (la syntaxe de pipe `| filterBy` n'est valide que dans les templates)
        const operationnels = (this.salaries || []).filter(s => Boolean((s as any).is_ope));
        console.log('LISTE DE CHOIX this.salaries (opérationnels filtrés) :', operationnels);
      });

    // Récupérer les données d'un projet ou créer un nouveau projet
    // this.projetLite est assigné dans le constructeur et vient de data (fenetre de dialogue)
    if (this.projetLite?.pmfu_id) {
      // Quand un ID est passé en paramètre
      try {
        // Simuler un délai artificiel
        setTimeout(async () => {
          // Accéder aux données du projet (va prendre dans le schema opegerer ou opeautre)

          // Accéder données du projet
          // Assigner l'objet projet directement et forcer le type Projet
          if (this.projetLite) {
            await this.setupPmfuForm();
          } else {
            // Défini un formulaire vide pour le projet MFU
            this.pmfuForm = this.formService.newPmfuForm();
            this.initialFormValues = this.snapshotFormValues(this.pmfuForm.getRawValue()); // Garder une copie des valeurs initiales du formulaire
            this.docForm = this.formService.newDocForm();

            // console.log(this.docForm);
            this.cdr.detectChanges();
          }
          // Souscrire aux changements du statut du formulaire principal (projetForm)
          this.formStatusSubscription = this.pmfuForm.statusChanges.subscribe(
            (status) => {
              this.isFormValid = this.pmfuForm.valid; // Mettre à jour isFormValid en temps réel
              this.cdr.detectChanges(); // Forcer la détection des changements dans le parent
            }
          );

          this.isLoading = false; // Le chargement est terminé
        }, this.loadingDelay);
      } catch (error) {
        console.error(
          'Erreur lors de la récupération des données du projet',
          error
        );
        this.isLoading = false; // Même en cas d'erreur, arrêter le spinner
        this.cdr.detectChanges();
      }

      //
      //// 
      ////// FIN DU CAS D'UN PROJET EXISTANT QUE L'ON CHARGE
    } else {
      // Projet neuf à créer
      console.log(
        'Nous avons visiblement un projet neuf à créer. Pas de pmfu_id dans this.projetLite.'
      );

      try {
        this.newPmfu = true;
        // Passer directement en mode edition
        this.isEditPmfu = true; // On est en mode édition

        // Créer un formulaire vide
        // Le form_group correspondant aux projet neuf à créer
        this.pmfuForm = this.formService.newPmfuForm(undefined, 0);
        // console.log('Formulaire de projet créé :', this.pmfuForm.value);

        // Marquer le champ comme touché pour déclencher la validation
        // this.pmfuForm.get('pmfu_commune')?.setValue('');
        // this.pmfuForm.get('pmfu_commune')?.markAsTouched();
        // this.pmfuForm.get('pmfu_commune')?.updateValueAndValidity();

        // DEBUG :
        // console.log('Formulaire projet MFU est valide ? :', this.pmfuForm.valid);
        // // Boucle sur les champs du formulaire et affiche ceux qui sont required avec leur valeur et type
        // for (let control in this.pmfuForm.controls) {
        //   const ctrl = this.pmfuForm.get(control);
        //   if (ctrl && ctrl.validator) {
        //     // Vérifie si le champ a le validateur required
        //     const validators = ctrl.validator({} as any);
        //     if (validators && validators['required'] !== undefined) {
        //       console.log(`Champ required : ${control} | valeur =`, ctrl.value, '| type =', typeof ctrl.value);
        //     }
        //   }
        // }

        // Le form_group correspondant aux documents
        this.docForm = this.formService.newDocForm();

        // Définir les valeurs par défaut pour créateur et responsable avec le salarié connecté actuellement
        this.formService
          .getSelectValues$('sites/selectvalues=admin.salaries/')
          .subscribe((selectValues: SelectValue[] | undefined) => {
            this.salaries = selectValues || [];
            this.pmfuForm.patchValue({
              pmfu_responsable: this.cd_salarie ? this.cd_salarie : '',
              pmfu_createur: this.cd_salarie,
            });
          });

        // console.log('Formulaire de projet créé avec succès :', this.pmfuForm.value);

        // Souscrire aux changements du statut du formulaire principal (pmfuForm)
        this.formStatusSubscription = this.pmfuForm.statusChanges.subscribe(
          (status) => {
            console.log('Formulaire projet MFU valide juste avant :', this.pmfuForm.valid);
            this.isFormValid = this.pmfuForm.valid; // Mettre à jour isFormValid en temps réel
            // console.log('Statut du formulaire principal :', status);
            // console.log("this.isFormValid = this.projetForm.valid :");
            // console.log(this.isFormValid + " = " + this.projetForm.valid);
            // console.log("isFormValid passé à l'enfant:", this.isFormValid);
            this.cdr.detectChanges(); // Forcer la détection des changements dans le parent
          }
        );

        this.isLoading = false; // Le chargement est terminé
      } catch (error) {
        console.error(
          'Erreur lors de la création du formulaire du nouveau projet.',
          error
        );
        this.isLoading = false; // Même en cas d'erreur, arrêter le spinner
        this.cdr.detectChanges();
      }

      // Souscrire dynamiquement au chargement des communes selon le département
      // Fait en sorte que si on change de département, la liste des communes se mette à jour
      const departementControl = this.pmfuForm.get('pmfu_dep') as FormControl;
      this.subscribeDepartementCommunes(departementControl);

      // FIN DU CAS D'UN PROJET NEUF
    }

    // LOGIQUE COMMUNE AUX DEUX CAS : PROJET EXISTANT OU NOUVEAU PROJET
  }

  /**
   * SUPER IMPORTANT POUR LE CHARGEMENT DYNAMIQUE DES COMMUNES
   * Décrit ce qu'il va se passer si l'utilisateur change le département dans le formulaire
   *
   * Souscrit aux changements du département, charge dynamiquement la liste des communes proposées
   * par l'autocomplete et active/désactive la saisie selon que le département est renseigné.
   * Peut être utilisé pour un nouveau formulaire ou un formulaire existant
   * @param departementControl FormControl du département
   */
  subscribeDepartementCommunes(departementControl: FormControl | null) {
    if (!departementControl) return;
    const loadCommunes = async (insee: string | null, resetSelection = true) => {
      this.isCommuneDisabled = !insee || !['08', '10', '51', '52'].includes(insee);

      if (insee) {
        const communesRaw = await this.geoService.apiGeoCommunesUrl(insee);
        this.communes = communesRaw.map((item: any) => ({
          nom: item.nom,
          insee: item.code,
          population: item.population ?? 0,
          codeposte: item.codeposte ?? ''
        }));
      } else {
        this.communes = [];
      }

      // Réinitialiser les communes sélectionnées uniquement si demandé (changement de département)
      if (resetSelection) {
        this.selectedCommunes = [];
        this.syncSelectedCommunesToForm();
        this.communeCtrl.setValue('', { emitEvent: false });
      }

      this.refreshFilteredCommunes('');
      this.cdr.detectChanges();
    };

    // Sur changement de département (interaction utilisateur), on recharge et on réinitialise les communes
    departementControl.valueChanges.subscribe((insee: string) => {
      void loadCommunes(insee, true);
    });

    // Si le contrôle département contient déjà une valeur (ouverture d'une fiche existante), charger immédiatement
    // sans réinitialiser les communes déjà associées au projet
    if (departementControl.value) {
      void loadCommunes(departementControl.value, false);
    }
  }

  /**
   * Configure le formulaire PMFU en récupérant les données du projet et en initialisant les formulaires
   * Met à jour le titre, le formulaire principal et le formulaire des documents
   * Initialise les dossiers de documents basés sur les types de documents disponibles
   * Utilise la détection des changements pour mettre à jour l'affichage
   * Gère les erreurs potentielles lors de la récupération des données
   */
  async setupPmfuForm() {
    try {
      // Récupération des données du projet
      this.pmfu = (await this.fetch(this.projetLite.pmfu_id)) as ProjetMfu;
      // Ne pas toucher à `pmfuForm` ici (il n'est pas encore initialisé)

      // Reconstruire les communes sélectionnées à partir des insee/noms stockés en parallèle
      const inseeList = Array.isArray(this.pmfu?.pmfu_commune_insee) ? this.pmfu.pmfu_commune_insee : [];
      const nomList = Array.isArray(this.pmfu?.pmfu_commune_nom) ? this.pmfu.pmfu_commune_nom : [];
      this.selectedCommunes = inseeList.map((insee, i) => ({
        insee,
        nom: nomList[i] || '',
        population: 0,
        codeposte: '',
      }));

      // Réaffecter le titre, formulaire, etc.
      this.updatePmfuTitle();

      // Créer les formulaires avec les données récupérées
      this.pmfuForm = this.formService.newPmfuForm(this.pmfu);
      this.initialFormValues = this.snapshotFormValues(this.pmfuForm.getRawValue());
      this.docForm = this.formService.newDocForm(this.pmfu);
      const typeToField: Record<string, number | undefined> = {
        '1': this.pmfu.photos_site_nb,
        '2': this.pmfu.projet_acte_nb,
        '3': this.pmfu.decision_bureau_nb,
        '4': this.pmfu.note_bureau_nb,
      };

      const newFolders: Section[] = (this.doc_types || []).map((docType) => ({
        cd_type: Number(docType.cd_type),
        name: docType.libelle,
        numberElements: typeToField[String(docType.cd_type)] ?? 0,
      }));

      // sauvegarde locale utile pour debug + émission
      this.folders = newFolders;
      this.foldersSubject.next(newFolders);

      // forcer la détection (surtout si tu as des zones OnPush)
      setTimeout(() => this.cdr.detectChanges(), 0);

      // Souscrire dynamiquement au chargement des communes selon le département
      // Fait en sorte que si on change de département, la liste des communes se mette à jour
      const departementControl = this.pmfuForm.get('pmfu_dep') as FormControl;
      this.subscribeDepartementCommunes(departementControl);

      console.log('setupPmfuForm terminé :', this.folders);
    } catch (error) {
      console.error('Erreur setupPmfuForm', error);
    }
  }

  /**
   * Configure le formulaire PMFU avec les données récupérées
   * Initialise le formulaire principal et le formulaire de documents
   * Met à jour le titre du projet et les parcelles sélectionnées
   * @return Promise<void>
   **/
  async fetch(pmfu_id: Number): Promise<ProjetMfu | undefined> {
    // Récupérer les données d'un projet à partir de son ID
    // @param : gestion ou autre pour que le back sache quelle table interroger
    // !! Le backend ne fera pas la meme requete SQL si on est en gestion ou autre
    // Il s'agira de deux schémas different où les données sont stockées

    const subroute = `pmfu/id=${pmfu_id}/full`; // Full puisque UN SEUL projet
    console.log('subroute dans fetch : ' + subroute);
    console.log("Récupération des données du projet avec l'ID du projet :" + pmfu_id);

    const pmfu = await this.foncierService.getProjetMfu(subroute);
    console.log('Données du projet récupérées :', pmfu);

    // Transformation du format PostgreSQL en tableau provenant de la base de données
    // Chaque élément est un idu éventuellement suffixé du flag pour-partie : "idu" ou "idu:1"
    pmfu.pmfu_parc_list_array = this.postgresArrayStringToArray(pmfu.pmfu_parc_list);
    // Récupérer les infos complètes des parcelles
    if (pmfu.pmfu_parc_list_array && pmfu.pmfu_parc_list_array.length > 0) {
      const pourPartieByIdu = new Map<string, boolean>();
      const idus = pmfu.pmfu_parc_list_array.map(entry => {
        const [idu, flag] = entry.split(':');
        pourPartieByIdu.set(idu, flag === '1');
        return idu; // Le backend attend des idus nus
      });
      this.foncierService.getParcellesInfosByIdus(idus).subscribe(
        (response) => {
          let selection: ParcellesSelected[] = [];
          if (response.success && Array.isArray(response.data)) {
            selection = response.data.map((p: ParcellesSelected) => ({
              ...p,
              bbox: typeof p.bbox === 'string' ? String(p.bbox).split(',').map(Number) : p.bbox,
              pour_partie: pourPartieByIdu.get(p.idu) ?? false
            }));
          }
          console.log('--------------------------->>>>');
          console.log('Parcelles sélectionnées après fetch :', selection);
          // Initialiser la sélection via la méthode dédiée
          this.onParcellesSelected(selection);

          // Sauvegarder une copie de la sélection initiale pour restauration si besoin
          this.parcellesInitialesBackup = selection.map(p => ({ ...p }));
        },
        (error) => {
          console.error('Erreur lors de la récupération des infos parcelles:', error);
          this.onParcellesSelected([]);
        }
      );
    } else {
      this.onParcellesSelected([]);
      console.log('--------------------------->>>>');
      console.log('Parcelles sélectionnées après fetch :', []);
    }
    
    return pmfu as ProjetMfu; // Retourner l'objet Projet complet
  }

  private defaultExtensions: Record<string, string[]> = {
    doc: ['.pdf', '.doc', '.docx'],
    image: ['.jpg', '.jpeg', '.png'],
  };

  /**
   * Gère le basculement entre le mode édition et le mode affichage du formulaire PMFU
   */
  toggleEditPmfu(): void {
    this.isEditPmfu = this.formService.simpleToggle(this.isEditPmfu); // Changer le mode du booleen

    // Gérer l'abonnement aux changements de statut du formulaire
    if (this.isEditPmfu) { // Si le mode édition est activé
      // À chaque entrée en édition, repartir d'un état propre
      this.initialparcellesSelected = this.parcellesInitialesBackup.map(p => ({ ...p }));
      this.parcellesAjoutees = [];
      this.parcellesSelected = this.parcellesInitialesBackup.map(p => ({ ...p }));
      // Souscrire aux changements du statut du formulaire principal (projetForm)
      this.formStatusSubscription = this.pmfuForm.statusChanges.subscribe(
        (status) => {
          this.isFormValid = this.pmfuForm.valid; // Mettre à jour isFormValid en temps réel
          this.cdr.detectChanges(); // Forcer la détection des changements dans le parent
        }
      );
    } else { // Si on quitte le mode édition
      this.parcellesSelected = this.parcellesInitialesBackup.map(p => ({ ...p }));
      this.parcellesAjoutees = [];
    }

    // Changer l'état du formulaire
    this.formService.toggleFormState(this.pmfuForm, this.isEditPmfu, this.initialFormValues);

    // Basculer la disponibilité de l'apparition du bouton d'ajout / suppression de parcelles dans la popup
    // quand on clic sur une parcelle sur la carte.
    // Forcer la mise à jour des popups de parcelles sur la carte
    if (this.mapComponent && typeof this.mapComponent.refreshParcellesPopups === 'function') {
      this.mapComponent.refreshParcellesPopups();
    }

    this.cdr.detectChanges(); // Forcer la détection des changements
  }

  /**
   * Gère la soumission du formulaire PMFU
   * Met à jour le formulaire, réinitialise les sélections de dossiers et de galerie
   * Envoie une requête PUT pour mettre à jour un projet existant uniquement si le formulaire a été modifié
   * ou si la liste de fichiers a changé
   */
  onSubmit(): void {
    const activeStepIndex = this.mfuStepper?.selectedIndex ?? 0;

    this.selectedFolder = undefined;
    this.galerie = undefined;
    this.filePathList = [];
    this.filesNames = [];
    // S'assurer que les parcelles sélectionnées sont bien synchronisées avant la comparaison
    this.syncParcellesToForm(this.parcellesSelected);
    if (!this.newPmfu) { // Si on ouvre un projet existant
      this.isLoading = true;
      setTimeout(async () => {
        console.log(
          "Modification d'un projet MFU existant",
          this.pmfuForm.value
        );

        let pmfu_id!: number;
        if (this.projetLite.pmfu_id !== undefined) {
          pmfu_id = this.projetLite.pmfu_id;
        } else if (this.pmfuForm.get('pmfu_id') !== null) {
          pmfu_id = this.pmfu.pmfu_id;
        }
        console.log('pmfu_id dans onSubmit() : ' + pmfu_id);
        const submitObservable = this.formService.putBdd(
          'update',
          'projets_mfu',
          this.pmfuForm,
          this.isEditPmfu,
          this.snackBar,
          pmfu_id.toString(),
          this.initialFormValues
        );
        // S'abonner à l'observable
        if (submitObservable) {
          submitObservable.subscribe(
            async (result) => {
              this.hasFiles();
              if (!this.docfileService.hasFiles && result.isEdited) {
                setTimeout(() => {
                  this.snackBar.open('Aucun fichier sélectionné', 'Fermer', {
                    duration: 3000,
                    panelClass: ['error-snackbar'],
                  });
                }, 1000);
              }

              // Mettre à jour les valeurs du formulaire avec les nouvelles données
              this.pmfu = result.formValue;
              this.isEditPmfu = result.isEditMode;
              this.initialFormValues = this.snapshotFormValues(result.formValue);

              // Nous venons de sauvegarder, les valeurs initiales deviennent les valeurs actuelles
              this.initialparcellesSelected = this.parcellesSelected.map(p => ({ ...p }));
              this.parcellesInitialesBackup = this.parcellesSelected.map(p => ({ ...p }));

              try {
                // on déclenche les uploads et on attend qu'ils soient terminés (ou échouent)
                await this.docfileService.handleDocfileSubmission(
                  this.docForm!,
                  this.fileInput,
                  this.pmfu.pmfu_id
                );
                if (this.fileExplorator) {
                  this.fileExplorator.updateFolderCounts();
                }
              } catch (err) {
                console.warn('Upload des fichiers échoué ou interrompu :', err);
                // gérer l'erreur si besoin (snackbar, etc.)
              }
              await this.setupPmfuForm();
              this.cdr.detectChanges();
              this.mfuStepper.selectedIndex = activeStepIndex;
              this.isFormValid = true;
              console.log('Projet mis à jour avec succès:', result.formValue);
            },
            (error) => {
              console.error(
                'Erreur lors de la mise à jour du formulaire',
                error
              );
            }
          );
        }
        this.isLoading = false;
      }, this.loadingDelay);
    } else if (this.newPmfu) {
      console.log(
        "Création d'un nouveau projet dans la BDD. this.newProjet = " +
          this.newPmfu
      );
      this.pmfuForm.value.pmfu_id = 0;

      console.log('pmfuForm avant envoi :');
      console.log(this.pmfuForm.value);
      const submitObservable = this.formService.putBdd(
        'insert',
        'projets_mfu',
        this.pmfuForm,
        this.isEditPmfu,
        this.snackBar
      );
      this.dialogRef.close(); // Fermer la fenêtre de dialogue immédiatement après la soumission

      // S'abonner à l'observable
      if (submitObservable) {
        submitObservable.subscribe(
          (result) => {
            this.isEditPmfu = result.isEditMode;
            this.initialFormValues = this.snapshotFormValues(result.formValue);
            this.newPmfu = false; // On n'est plus en mode création, donc maintenant le formulaire s'affiche normalement
            // Les steps du stepper sont affichés et apparaissent comme en mode consultation (edition)
            this.pmfu = result.formValue;
            this.cdr.detectChanges();
            // La liste des projets dans le composant parent sera mise à jour au moment de fermer la fenêtre de dialogue
            console.log(
              'Nouveau projet enregistré avec succès:',
              result.formValue
            );
            this.hasFiles();
            this.docfileService.handleDocfileSubmission(
              this.docForm!,
              this.fileInput,
              this.pmfu.pmfu_id
            );
          },
          (error) => {
            console.error('Erreur lors de la mise à jour du formulaire', error);
          }
        );
      }
    }
  }

  updatePmfuTitle() {
    this.pmfuTitle = this.pmfu.pmfu_nom;
  }

  /**
   * Transforme une chaîne de caractères au format PostgreSQL en tableau
   * @param str La chaîne de caractères à transformer
   * @returns Un tableau de chaînes de caractères
   */
  postgresArrayStringToArray(str?: string): string[] {
    console.log('postgresArrayStringToArray typeof:', typeof str, str);
    if (!str || str === '{}') return [];
    if (Array.isArray(str)) {
      return str;
    }
    if (typeof str === 'string') {
      return str.replace(/^{|}$/g, '').split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    return [];
  }

  /** 
   * Initialise allowedTypes en fonction des doc_types
   * Par défaut, les types contenant "photo" ou "image" sont considérés comme des images
   * Les autres types sont considérés comme des documents
   * Utilise defaultExtensions pour définir les extensions autorisées
   * Résultat stocké dans allowedTypes
  */
  initializeAllowedTypes(): void {
    this.allowedTypes = this.doc_types.reduce((acc, type) => {
      const name = type.field;
      const isImage =
        name.toLowerCase().includes('photo') ||
        name.toLowerCase().includes('image');
      acc[name] = isImage
        ? this.defaultExtensions['image']
        : this.defaultExtensions['doc'];
      return acc;
    }, {} as Record<string, string[]>);

    console.log('allowedTypes généré :', this.allowedTypes);
  }

  /**
   * Vérifie si le type de fichier est autorisé pour un champ donné
   * @param file Le fichier à vérifier
   * @param field Le nom du champ de formulaire
   * @return true si le type de fichier est autorisé, false sinon
   * Ajoute un message d'erreur dans fileErrors si le type n'est pas autorisé
   * Utilise allowedTypes pour déterminer les extensions autorisées
   */
  private isFileTypeAllowed(file: File, field: string): boolean {
    const exts = this.allowedTypes[field];
    // Vérifie si le type de fichier existe dans allowedTypes
    if (!exts) {
      console.warn(
        `Aucune règle trouvée pour ${field}. allowedTypes =`,
        this.allowedTypes
      );
      this.fileErrors[field] = this.fileErrors[field] || [];
      this.fileErrors[field].push('Type de fichier non reconnu.');
      return false;
    }

    const fileName = file.name.toLowerCase();
    const valid = exts.some((ext) => fileName.endsWith(ext));
    // Ajouter un message d'erreur si le fichier n'est pas autorisé
    if (!valid) {
      this.fileErrors[field] = this.fileErrors[field] || [];
      this.fileErrors[field].push("Le fichier n'est pas autorisé");
      setTimeout(() => {
        this.fileErrors[field] = [];
      }, 3000);
      console.log(this.fileErrors[field]);
    }

    return valid;
  }

  /**
   * Gère la sélection de fichiers via l'input de type file
   * @param event L'événement de sélection de fichiers
   * @param controlName Le nom du champ de formulaire associé à la sélection
   * Permet de sélectionner plusieurs fichiers à la fois
   * Vérifie le type de chaque fichier avant de l'ajouter au formulaire
   */
  onFileSelected(event: any, controlName: string) {
    const files: File[] = Array.from(event.target.files);

    files.forEach((file) => {
      if (!this.isFileTypeAllowed(file, controlName)) {
        console.warn(`Fichier refusé (${file.name}) pour ${controlName}`);
        return;
      }

      this.docfileService.onFileSelected(
        { target: { files: [file] } } as any,
        controlName,
        this.docForm!
      );

      this.filesNames.push([file.name, controlName]);
    });

    console.log(this.filesNames);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  /**
   * Gère le dépôt de fichiers via le glisser-déposer
   * @param event L'événement de glisser-déposer
   * @param field Le nom du champ de formulaire associé au dépôt
   * Permet de déposer plusieurs fichiers à la fois
   * Vérifie le type de chaque fichier avant de l'ajouter au formulaire
   */
  onFileDropped(event: DragEvent, field: string) {
    event.preventDefault();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const files = Array.from(event.dataTransfer.files);

      files.forEach((file) => {
        if (!this.isFileTypeAllowed(file, field)) {
          console.warn(`Fichier refusé (${file.name}) pour ${field}`);
          return;
        }

        this.onFileSelected({ target: { files: [file] } } as any, field);
      });

      event.dataTransfer.clearData();
    }
  }

  /**
   * Supprime un fichier déposé du formulaire et de la liste des fichiers
   * @param fileToRemove Un tableau contenant le nom du fichier et le nom du contrôle associé
   * Exemple : ['nom_du_fichier.ext', 'nom_du_controle']
   */
  removeDroppedFile(fileToRemove: [string, string]) {
    const controlName = fileToRemove[1];
    const fileName = fileToRemove[0];

    // Retirer le fichier de filesNames
    this.filesNames = this.filesNames.filter(
      (file) => !(file[0] === fileName && file[1] === controlName)
    );

    // Retirer le fichier du FormGroup
    const control = this.docForm.get(controlName);
    if (control && control.value) {
      const remainingFiles = (control.value as File[]).filter(
        (file: File) => file.name !== fileName
      );
      control.setValue(remainingFiles);
      control.updateValueAndValidity();
    }

    console.log('Fichier supprimé :', fileName);
  }

  /**
   * Soumet le formulaire des documents
   * Il s'agit d'un observable qui déclenche la soumission des fichiers
   * est utilisé dans onSubmit() pour gérer les uploads après la sauvegarde du formulaire principal
   * l'observable nous prévient quand la soumission est terminée
   * @returns le déclenchement de la soumission
   */
  submitDocfile(): Observable<ApiResponse> {
    return this.docfileService.submitDocfiles(
      this.docForm!,
      this.projetLite?.pmfu_id
    );
  }

  /**
   * Vérifie si au moins un fichier est présent dans le formulaire des documents
   * Met à jour la propriété hasFiles du service DocfileService
   * Affiche dans la console les valeurs actuelles du formulaire et le résultat de la vérification
   */
  hasFiles(): void {
    console.log('docForm.value =', this.docForm.value);
    const v = this.docForm.value || {};
    const types = this.docfileService.getTypeFields();

    const hasFiles = types.some((name) => {
      const val = v[name];
      return val !== undefined && val !== null && val.length > 0;
    });

    this.docfileService.hasFiles = hasFiles;
    console.log('this.docfileService.hasFiles =', hasFiles);
  }

  /**
   * Confirme et supprime un projet MFU
   * Utilise le service ConfirmationService pour afficher une boîte de dialogue de confirmation
   * Si l'utilisateur confirme, appelle le service FoncierService pour supprimer le projet MFU
   * Ferme la boîte de dialogue actuelle si la suppression réussit
   */
  deletePmfuConfirm(): void {
    const message = `Voulez-vous vraiment supprimer ce projet MFU?\n<strong>Cette action est irréversible.</strong>`;

    // Appel de la boîte de dialogue de confirmation
    this.confirmationService
      .confirm('Confirmation de suppression', message, 'delete')
      .subscribe((result) => {
        if (result) {
          // L'utilisateur a confirmé la suppression
          // Utiliser le service projetService pour supprimer l'élément
          this.foncierService
            .deletePmfu(this.pmfu.pmfu_id as number)
            .subscribe((success) => {
              if (success) {
                // success === true ici si la suppression a réussi on ferme la fenetre de dialogue
                this.isEditPmfu = false;
                this.dialogRef.close(); // Ferme la boîte de dialogue
              } else {
                // success === false ici si la suppression a échoué
                // On ne fait rien le service a déjà géré l'erreur en affichant un message snackbar d'erreur
              }
            });
        }
      });
  }

  /**
   * Active/désactive l'affichage des sites CENCA dynamiques
   */
  toggleSitesCenca(): void {
    console.log(`🌿 Sites CENCA dynamiques: ${this.afficherSitesCenca ? 'ACTIVÉS' : 'DÉSACTIVÉS'}`);
    
    // Communiquer avec la carte pour activer/désactiver le chargement dynamique
    if (this.mapComponent) {
      // Synchroniser avec le layer control
      this.mapComponent.synchronizeSitesCencaLayer(this.afficherSitesCenca);
      
      if (this.afficherSitesCenca) {
        console.log('✅ Les sites CENCA vont se charger automatiquement quand vous bougez la carte !');
        // Forcer un premier chargement
        setTimeout(() => {
          this.mapComponent.reloadSitesInCurrentView();
        }, 500);
      } else {
        console.log('❌ Chargement dynamique des sites CENCA désactivé');
      }
    } else {
      console.warn('⚠️ Composant carte non trouvé');
    }
  }

  /**
   * Active/désactive l'affichage des sites CENCA Sites (couche verte)
   */
  toggleSitesCencaSites(): void {
    console.log(`🟢 Sites CENCA Sites: ${this.afficherSitesCencaSites ? 'ACTIVÉS' : 'DÉSACTIVÉS'}`);
    
    // Communiquer avec la carte pour activer/désactiver le chargement dynamique
    if (this.mapComponent) {
      // Synchroniser avec le layer control
      this.mapComponent.synchronizeSitesCencaSitesLayer(this.afficherSitesCencaSites);
      
      if (this.afficherSitesCencaSites) {
        console.log('✅ Les sites CENCA Sites vont se charger automatiquement (couche verte) !');
        // Forcer un premier chargement
        setTimeout(() => {
          this.mapComponent.reloadSitesSitesInCurrentView();
        }, 500);
      } else {
        console.log('❌ Chargement dynamique des sites CENCA Sites désactivé');
      }
    } else {
      console.warn('⚠️ Composant carte non trouvé');
    }
  }

  /**
   * Gestionnaire pour la synchronisation des Sites CENCA depuis le layer control
   */
  onSitesCencaToggled(active: boolean): void {
    console.log(`🔄 Synchronisation des Sites CENCA depuis layer control: ${active}`);
    this.afficherSitesCenca = active;
  }

  /**
   * Gestionnaire pour la synchronisation des Sites CENCA Sites depuis le layer control
   */
  onSitesCencaSitesToggled(active: boolean): void {
    console.log(`🔄 Synchronisation des Sites CENCA Sites depuis layer control: ${active}`);
    this.afficherSitesCencaSites = active;
  }

  /**
   * Gestionnaire pour la synchronisation des Parcelles depuis le layer control
   */
  onParcellesToggled(active: boolean): void {
    console.log(`🗺️ Synchronisation des Parcelles Cadastrales depuis layer control: ${active}`);
    // Note: Les parcelles sont activées par défaut avec [chargerParcellesDynamiquement]="true"
    // Cette méthode permet de détecter les changements depuis le layer control
  }

  /**
   * Zoom sur la parcelle sélectionnée en utilisant sa bbox
   */
  zoomToParcelle(parcelle: ParcellesSelected) {
    if (parcelle.bbox && this.mapComponent && typeof this.mapComponent.zoomToBbox === 'function') {
      // Si bbox est une chaîne, convertir en tableau de nombres
      const bboxArray = (typeof parcelle.bbox === 'string')
        ? (parcelle.bbox as string).split(',').map(Number)
        : Array.isArray(parcelle.bbox)
          ? parcelle.bbox as number[]
          : [];
      this.mapComponent.zoomToBbox(bboxArray);
    } else {
      this.snackBar.open('Impossible de zoomer : bbox non disponible.', 'Fermer', { duration: 3000 });
    } 
  }

  onParcellesSelected(parcelles: ParcellesSelected[]) {
    // Tri par idu
    const sorted = [...parcelles].sort((a, b) => a.idu.localeCompare(b.idu));
    // Vérifier si la sélection a changé
    if (JSON.stringify(this.parcellesSelected) === JSON.stringify(sorted)) {
      // Même si la sélection est identique, on synchronise le formulaire
      // (utile si la carte a muté le tableau en place)
      this.parcellesSelected = sorted.map(p => ({ ...p }));
      this.syncParcellesToForm(this.parcellesSelected);
      return;
    }
    // Initialisation des parcelles préchargées au premier appel
    if (this.initialparcellesSelected.length === 0) {
      this.hasInitialParcelles = sorted.length > 0;
      this.initialparcellesSelected = sorted.map(p => ({ ...p })); // copie profonde
      this.parcellesAjoutees = [];
      this.parcellesSelected = this.initialparcellesSelected.map(p => ({ ...p })); // copie profonde
      this.syncParcellesToForm(this.parcellesSelected);
      return;
    }
    // Ajout incrémental : ne prendre que les nouveaux idu non présents dans initiales ni dans ajouts
    const nouveauxAjouts = sorted.filter(p =>
      !this.initialparcellesSelected.some(init => init.idu === p.idu) &&
      !this.parcellesAjoutees.some(aj => aj.idu === p.idu)
    );
    if (nouveauxAjouts.length > 0) {
      this.parcellesAjoutees = [...this.parcellesAjoutees, ...nouveauxAjouts];
    }
    // On retire les ajouts qui auraient été supprimés
    this.parcellesAjoutees = this.parcellesAjoutees.filter(aj => sorted.some(p => p.idu === aj.idu));
    this.parcellesSelected = [...this.initialparcellesSelected, ...this.parcellesAjoutees];
    // Synchroniser avec le formulaire si besoin :
    this.syncParcellesToForm(this.parcellesSelected);
    // Synchroniser la sélection sur la carte uniquement si elle a changé
    if (this.mapComponent && typeof this.mapComponent.setParcellesSelection === 'function') {
      this.mapComponent.setParcellesSelection(this.parcellesSelected);
    }
    // console.log('Parcelles sélectionnées mises à jour :', this.parcellesSelected);
    // console.log('Historique des parcelles :', this.parcellesHistory);
    // console.log('Index historique :', this.historyIndex);
    // console.log('Poubelle des parcelles :', this.trashParcelle);
    // console.log('Historique des suppressions :', this.trashHistory);
  }

  /** Encode une parcelle pour le champ pmfu_parc_list : "idu:1" si pour-partie, sinon l'idu nu.
   * L'absence de suffixe vaut false, ce qui garde les données existantes valides telles quelles. */
  private encodeParcelleEntry(parcelle: ParcellesSelected): string {
    return parcelle.pour_partie ? `${parcelle.idu}:1` : parcelle.idu;
  }

  private syncParcellesToForm(parcelles: ParcellesSelected[]): void {
    if (!this.pmfuForm) return;
    const ids = parcelles.map(p => this.encodeParcelleEntry(p));
    this.pmfuForm.patchValue({ pmfu_parc_list_array: ids });
    this.pmfuForm.get('pmfu_parc_list_array')?.markAsDirty();
    this.pmfuForm.get('pmfu_parc_list_array')?.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Coche/décoche le flag "pour partie" d'une parcelle sélectionnée.
   * Le flag est propagé aux listes initiales/ajoutées car leurs éléments sont des
   * copies distinctes : sans cela, la recomposition [...initiales, ...ajoutées]
   * effectuée au prochain événement carte écraserait le changement.
   */
  onPourPartieChange(parcelle: ParcellesSelected, checked: boolean): void {
    parcelle.pour_partie = checked;
    const initiale = this.initialparcellesSelected.find(p => p.idu === parcelle.idu);
    if (initiale) initiale.pour_partie = checked;
    const ajoutee = this.parcellesAjoutees.find(p => p.idu === parcelle.idu);
    if (ajoutee) ajoutee.pour_partie = checked;
    this.syncParcellesToForm(this.parcellesSelected);
    // Recolorer la parcelle sur la carte (jaune <-> violet) sans rechargement
    if (this.mapComponent && typeof this.mapComponent.setParcellesSelection === 'function') {
      this.mapComponent.setParcellesSelection(this.parcellesSelected);
    }
    if (this.mapComponent && typeof this.mapComponent.restyleParcellesSelection === 'function') {
      this.mapComponent.restyleParcellesSelection();
    }
  }

  // Supprimer une parcelle et l'ajouter à la poubelle
  removeParcelle(parcelle: ParcellesSelected | string) {
    console.log('[removeParcelle] Argument reçu :', parcelle, 'Type :', typeof parcelle);
    let parcelleObj: ParcellesSelected | undefined = undefined;
    if (typeof parcelle === 'string') {
      parcelleObj = this.parcellesSelected.find(p => p.idu === parcelle);
      if (!parcelleObj) {
        console.warn('[removeParcelle] Aucun objet trouvé pour idu:', parcelle);
        return;
      }
    } else {
      parcelleObj = parcelle;
    }
    console.log('[removeParcelle] Avant suppression:', {
      initialparcellesSelected: this.initialparcellesSelected,
      parcellesAjoutees: this.parcellesAjoutees,
      parcellesSelected: this.parcellesSelected,
      parcelleObj
    });
    // Ne jamais toucher au backup ici !
    // Retirer la parcelle des initiales courantes si elle y est
    this.initialparcellesSelected = this.initialparcellesSelected.filter(p => p.idu !== parcelleObj.idu);
    // Retirer la parcelle des ajouts si elle y est
    this.parcellesAjoutees = this.parcellesAjoutees.filter(p => p.idu !== parcelleObj.idu);
    // Reconstruire la sélection finale
    this.parcellesSelected = [...this.initialparcellesSelected, ...this.parcellesAjoutees];
    // Ajouter à la poubelle
    this.trashParcelle = [...this.trashParcelle, parcelleObj];
    console.log('[removeParcelle] Après suppression:', {
      initialparcellesSelected: this.initialparcellesSelected,
      parcellesAjoutees: this.parcellesAjoutees,
      parcellesSelected: this.parcellesSelected,
      parcelleObj
    });
    // Synchroniser avec le formulaire
    this.syncParcellesToForm(this.parcellesSelected);
    // Synchroniser la sélection sur la carte
    if (this.mapComponent && typeof this.mapComponent.setParcellesSelection === 'function') {
      this.mapComponent.setParcellesSelection(this.parcellesSelected);
    }
    // Forcer la détection de changement pour l'UI
    this.cdr.detectChanges();
  }

  // Synchronise la suppression d'une parcelle depuis la carte
  onParcelleRemoved(idu: string) {
    console.log('[onParcelleRemoved] idu reçu :', idu);
    const removed = this.parcellesSelected.find(p => p.idu === idu);
    console.log('[onParcelleRemoved] Parcelle trouvée :', removed);
    if (removed) {
      this.removeParcelle(removed);
    } else {
      console.warn('[onParcelleRemoved] Aucun objet trouvé pour idu:', idu);
    }
  }

}
