import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar'; // Importer MatSnackBar
import { MapComponent } from '../../../map/map.component';

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { DetailSite } from '../../site-detail';
import { Commune } from './commune';
import { Conservateur, SitesService } from '../../sites.service';
import { FormService } from '../../../shared/services/form.service';
import { LoginService } from '../../../login/login.service';
import { SiteSelectLists, SiteSelectListsService } from '../../site-select-lists.service';
import { GeoService } from '../../../shared/services/geo.service';
import { AnnuaireService } from '../../../annuaire/annuaire.service';
import { AnnuaireFicheComponent } from '../../../annuaire/annuaire-fiche/annuaire-fiche.component';
import { SelectValue } from '../../../shared/interfaces/formValues';
import { FormButtonsComponent } from '../../../shared/form-buttons/form-buttons.component';
// import { UniqueSelectionDispatcher } from '@angular/cdk/collections';

@Component({
  selector: 'app-detail-infos',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    FormButtonsComponent,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MapComponent,
    MatTooltipModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatButtonModule,
  ],
  templateUrl: './detail-infos.component.html',
  styleUrls: ['./detail-infos.component.scss'], // Attention ici c'était styleUrl sans 's'
})
export class DetailInfosComponent implements OnChanges, OnInit {
  @Input() inputDetail?: DetailSite;
  isEditMode: boolean = false;

  // Communes du site (esp.localisations), enregistrées immédiatement à chaque ajout/retrait
  communesSite: Commune[] = [];
  // Référentiel IGN des communes de Champagne-Ardenne, chargé une seule fois
  private static readonly DEPARTEMENTS_CA = '08,10,51,52';
  private static communesCA?: Promise<Commune[]>;
  private communesCA: Commune[] = [];
  filteredCommunes: Commune[] = [];
  // Recherche seulement : l'autocomplete y écrit l'objet choisi avant que onCommuneSelected() ne le vide
  communeCtrl = new FormControl<string | Commune>('');
  communesEnCours: boolean = false;

  // Conservateurs bénévoles du site (sitcenca.conservateurs), enregistrés immédiatement comme les communes
  conservateursSite: Conservateur[] = [];
  // Contacts de l'annuaire proposés, ceux étiquetés "Conservateur bénévole" (CB) en premier
  private annuaires: (Conservateur & { estCB: boolean })[] = [];
  // Liste déroulante en deux groupes : conservateurs bénévoles (étiquette CB) puis autres contacts
  filteredCB: Conservateur[] = [];
  filteredAutres: Conservateur[] = [];
  // Dernier texte tapé : l'autocomplete remplace la valeur du contrôle par l'option choisie
  saisieConservateur: string = '';
  readonly CREER_CONSERVATEUR = '__creer__';
  conservateurCtrl = new FormControl<string | Conservateur>('');
  conservateursEnCours: boolean = false;
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  form: FormGroup;
  initialFormValues!: FormGroup; // Propriété pour stocker les valeurs initiales du formulaire
  isMobile: boolean = false;

  // Listes des selects, chargées une fois (voir SiteSelectListsService)
  lists: SiteSelectLists = {
    salaries: [],
    bassinsAgence: [],
    regroupements: [],
    typesEspace: [],
    typesOuverture: [],
    typesSite: [],
  };
  // Responsables éligibles, plus le responsable actuel du site s'il ne l'est plus (sinon le select l'afficherait vide)
  responsables: SelectValue[] = [];

  constructor(
    private sitesService: SitesService,
    private formService: FormService,
    private fb: FormBuilder,
    private breakpointObserver: BreakpointObserver,
    private snackBar: MatSnackBar,
    private loginService: LoginService,
    private selectLists: SiteSelectListsService,
    private geoService: GeoService,
    private annuaireService: AnnuaireService,
    private dialog: MatDialog,
    private overlay: Overlay
  ) {
    this.form = this.fb.group({
      // Initialiser le formulaire avec des contrôles vides
      uuid_espace: [''],
      uuid_site: [''],
      nom: ['', Validators.required],
      code: ['', Validators.required],
      surface: ['', Validators.required],
      responsable: ['', Validators.required],
      typ_site: ['', Validators.required],
      validite: ['', Validators.required],
      prem_ctr: ['', Validators.required],
      ref_public: [''],
      typ_espace: [''],
      bassin_agence: [''],
      zh: [''],
      id_mnhn: [''],
      ref_fcen: [''],
      rgpt: [''],
      parties_gerees: ['']
    });
  }

  ngOnInit() {
    this.selectLists.load$().subscribe((lists) => {
      this.lists = lists;
      this.updateResponsables();
    });

    this.chargerCommunesCA();
    this.communeCtrl.valueChanges.subscribe((value) => {
      this.refreshFilteredCommunes(typeof value === 'string' ? value : value?.nom || '');
    });

    this.chargerAnnuaires();
    this.conservateurCtrl.valueChanges.subscribe((value) => {
      if (typeof value === 'string' && value !== this.CREER_CONSERVATEUR) this.saisieConservateur = value;
      this.refreshFilteredConservateurs(this.saisieConservateur);
    });

    // Détecter si c'est la version mobile
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.isMobile = result.matches;
      });
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (this.inputDetail !== undefined) {
      this.form.patchValue({
        uuid_espace: this.inputDetail.uuid_espace,
        uuid_site: this.inputDetail.uuid_site,
        nom: this.inputDetail.nom,
        code: this.inputDetail.code,
        surface: this.inputDetail.surface,
        responsable: this.inputDetail.responsable,
        typ_site: this.inputDetail.typ_site,
        validite: this.inputDetail.validite,
        prem_ctr: this.inputDetail.prem_ctr,
        ref_public: this.inputDetail.ref_public,
        typ_espace: this.inputDetail.typ_espace,
        bassin_agence: this.inputDetail.bassin_agence,
        zh: this.inputDetail.zh,
        id_mnhn: this.inputDetail.id_mnhn,
        ref_fcen: this.inputDetail.ref_fcen,
        rgpt: this.inputDetail.rgpt,
        parties_gerees: this.inputDetail.parties_gerees,
      });

      this.updateResponsables();

      // Stocker les valeurs initiales du formulaire
      this.initialFormValues = this.form.getRawValue();

      if (changes['inputDetail']) {
        this.chargerCommunesSite(this.inputDetail.uuid_site);
        this.chargerConservateursSite(this.inputDetail.uuid_site);
      }
    }
  }

  // --- Communes du site ---

  private chargerCommunesSite(uuid_site: string): void {
    this.sitesService.getCommunesSite(uuid_site).subscribe({
      next: (communes) => {
        this.communesSite = [...communes].sort((a, b) => (a.nom ?? '').localeCompare(b.nom ?? ''));
        this.refreshFilteredCommunes();
      },
      error: (error) => {
        this.communesSite = [];
        console.error('Erreur lors du chargement des communes du site', error);
      },
    });
  }

  private chargerCommunesCA(): void {
    DetailInfosComponent.communesCA ??= this.geoService
      .apiGeoCommunesUrl(DetailInfosComponent.DEPARTEMENTS_CA)
      .then((communes) => communes.map((c) => ({ insee: c.insee, nom: c.nom })))
      .catch((error) => {
        DetailInfosComponent.communesCA = undefined; // nouvel essai au prochain affichage
        console.error('Erreur lors du chargement des communes IGN', error);
        return [];
      });
    DetailInfosComponent.communesCA.then((communes) => {
      this.communesCA = communes;
      this.refreshFilteredCommunes();
    });
  }

  /** Minuscules sans accents, pour chercher "chalons" et trouver "Châlons-en-Champagne" */
  private normaliser(texte: string): string {
    return texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  /** Propose les communes (nom ou code INSEE) non encore rattachées au site, limité à 50 résultats */
  private refreshFilteredCommunes(filtre: string = ''): void {
    const deja = new Set(this.communesSite.map((c) => c.insee));
    const recherche = this.normaliser(filtre.trim());
    this.filteredCommunes = this.communesCA
      .filter((c) => !deja.has(c.insee) && (this.normaliser(c.nom).includes(recherche) || c.insee.startsWith(recherche)))
      .slice(0, 50);
  }

  displayCommune(commune?: Commune): string {
    return commune ? commune.nom : '';
  }

  onCommuneSelected(event: MatAutocompleteSelectedEvent): void {
    const commune = event.option.value as Commune;
    this.communeCtrl.setValue('', { emitEvent: false });
    if (!this.inputDetail || this.communesSite.some((c) => c.insee === commune.insee)) return;

    this.communesEnCours = true;
    this.sitesService.addCommuneSite(this.inputDetail.uuid_site, commune.insee).subscribe({
      next: () => {
        this.communesSite = [...this.communesSite, commune].sort((a, b) => a.nom.localeCompare(b.nom));
        this.refreshFilteredCommunes();
        this.communesEnCours = false;
        this.snackBar.open(`${commune.nom} rattachée au site`, 'Fermer', { duration: 3000 });
      },
      error: (error) => {
        this.communesEnCours = false;
        this.snackBar.open(error?.error?.message || `Impossible de rattacher ${commune.nom}`, 'Fermer', { duration: 5000 });
      },
    });
  }

  removeCommune(commune: Commune): void {
    if (!this.inputDetail) return;

    this.communesEnCours = true;
    this.sitesService.removeCommuneSite(this.inputDetail.uuid_site, commune.insee).subscribe({
      next: () => {
        this.communesSite = this.communesSite.filter((c) => c.insee !== commune.insee);
        const filtre = this.communeCtrl.value;
        this.refreshFilteredCommunes(typeof filtre === 'string' ? filtre : '');
        this.communesEnCours = false;
        this.snackBar.open(`${commune.nom} retirée du site`, 'Fermer', { duration: 3000 });
      },
      error: (error) => {
        this.communesEnCours = false;
        this.snackBar.open(error?.error?.message || `Impossible de retirer ${commune.nom}`, 'Fermer', { duration: 5000 });
      },
    });
  }

  // --- Conservateurs bénévoles du site ---

  private chargerConservateursSite(uuid_site: string): void {
    this.sitesService.getConservateursSite(uuid_site).subscribe({
      next: (conservateurs) => {
        this.conservateursSite = [...conservateurs].sort((a, b) => (a.nom ?? '').localeCompare(b.nom ?? ''));
        this.refreshFilteredConservateurs();
      },
      error: (error) => {
        this.conservateursSite = [];
        console.error('Erreur lors du chargement des conservateurs du site', error);
      },
    });
  }

  private async chargerAnnuaires(): Promise<void> {
    try {
      const contacts = await this.annuaireService.getAnnuaires();
      this.annuaires = contacts
        // Une fiche sans nom ne peut pas être proposée (et ferait échouer le tri)
        .filter((c) => c.validite !== false && !!c.nom?.trim())
        .map((c) => ({
          uuid_ann: c.uuid_ann,
          nom: c.nom,
          telephone: c.telephone,
          mail: c.mail,
          adresse: c.adresse,
          estCB: (c.etiquettes ?? []).some((e) => e.typ_etiquette === 'CB'),
        }))
        .sort((a, b) => a.nom.localeCompare(b.nom));
      this.refreshFilteredConservateurs();
      this.cdr.detectChanges();
    } catch (error) {
      console.error("Erreur lors du chargement de l'annuaire", error);
    }
  }

  /** Contacts non encore conservateurs du site : toute la liste sans saisie, filtrée par nom sinon */
  private refreshFilteredConservateurs(filtre: string = ''): void {
    const deja = new Set(this.conservateursSite.map((c) => c.uuid_ann));
    const recherche = this.normaliser(filtre.trim());
    const proposes = this.annuaires.filter((c) => !deja.has(c.uuid_ann) && this.normaliser(c.nom).includes(recherche));
    this.filteredCB = proposes.filter((c) => c.estCB);
    this.filteredAutres = proposes.filter((c) => !c.estCB);
  }

  displayConservateur(conservateur?: Conservateur): string {
    return conservateur ? conservateur.nom : '';
  }

  /** Affichage en lecture seule : noms séparés par des virgules */
  libelleCommunes(): string {
    return this.communesSite.map((c) => c.nom).join(', ');
  }

  libelleConservateurs(): string {
    return this.conservateursSite.map((c) => c.nom).join(', ');
  }

  /** Infobulle en lecture seule : coordonnées de chaque conservateur */
  contactsConservateurs(): string {
    return this.conservateursSite
      .map((c) => [c.nom, this.contactConservateur(c)].filter(Boolean).join(' : '))
      .join(' | ');
  }

  /** Infobulle d'un conservateur : téléphone, mail et adresse s'ils sont connus */
  contactConservateur(conservateur: Conservateur): string {
    return [conservateur.telephone, conservateur.mail, conservateur.adresse?.replace(/\|/g, ', ')]
      .filter(Boolean)
      .join(' · ');
  }

  onConservateurSelected(event: MatAutocompleteSelectedEvent): void {
    this.conservateurCtrl.setValue('', { emitEvent: false });
    if (event.option.value === this.CREER_CONSERVATEUR) {
      this.openConservateurQuickCreate();
      return;
    }
    const { estCB, ...conservateur } = event.option.value as Conservateur & { estCB: boolean };
    this.saisieConservateur = '';
    this.refreshFilteredConservateurs();
    this.rattacherConservateur(conservateur);
  }

  /**
   * Crée un contact absent de l'annuaire (fiche annuaire en création rapide, pré-remplie avec
   * le texte tapé et le type "Particulier"), puis le rattache directement comme conservateur.
   */
  openConservateurQuickCreate(): void {
    const dialogRef = this.dialog.open(AnnuaireFicheComponent, {
      data: { nomPrefill: this.saisieConservateur.trim(), typPersonnePrefill: 'PART', quickCreate: true },
      minWidth: '50vw',
      maxWidth: '95vw',
      height: '70vh',
      maxHeight: '90vh',
      hasBackdrop: true,
      backdropClass: 'custom-backdrop-administratif',
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });

    dialogRef.afterClosed().subscribe((result?: Conservateur) => {
      if (!result?.uuid_ann) return;
      const conservateur: Conservateur = {
        uuid_ann: result.uuid_ann,
        nom: result.nom,
        telephone: result.telephone,
        mail: result.mail,
        adresse: result.adresse,
      };
      this.annuaires = [...this.annuaires, { ...conservateur, estCB: false }];
      this.conservateurCtrl.setValue('', { emitEvent: false });
      this.saisieConservateur = '';
      this.rattacherConservateur(conservateur);
    });
  }

  private rattacherConservateur(conservateur: Conservateur): void {
    if (!this.inputDetail || this.conservateursSite.some((c) => c.uuid_ann === conservateur.uuid_ann)) return;

    this.conservateursEnCours = true;
    this.sitesService.addConservateurSite(this.inputDetail.uuid_site, conservateur.uuid_ann).subscribe({
      next: () => {
        this.conservateursSite = [...this.conservateursSite, conservateur].sort((a, b) => a.nom.localeCompare(b.nom));
        // Le backend pose l'étiquette CB au rattachement : on la reflète dans la liste proposée
        const contact = this.annuaires.find((c) => c.uuid_ann === conservateur.uuid_ann);
        if (contact) contact.estCB = true;
        this.refreshFilteredConservateurs();
        this.conservateursEnCours = false;
        this.snackBar.open(`${conservateur.nom} ajouté(e) comme conservateur`, 'Fermer', { duration: 3000 });
      },
      error: (error) => {
        this.conservateursEnCours = false;
        this.snackBar.open(error?.error?.message || `Impossible d'ajouter ${conservateur.nom}`, 'Fermer', { duration: 5000 });
      },
    });
  }

  removeConservateur(conservateur: Conservateur): void {
    if (!this.inputDetail) return;

    this.conservateursEnCours = true;
    this.sitesService.removeConservateurSite(this.inputDetail.uuid_site, conservateur.uuid_ann).subscribe({
      next: () => {
        this.conservateursSite = this.conservateursSite.filter((c) => c.uuid_ann !== conservateur.uuid_ann);
        const filtre = this.conservateurCtrl.value;
        this.refreshFilteredConservateurs(typeof filtre === 'string' ? filtre : '');
        this.conservateursEnCours = false;
        this.snackBar.open(`${conservateur.nom} retiré(e) des conservateurs`, 'Fermer', { duration: 3000 });
      },
      error: (error) => {
        this.conservateursEnCours = false;
        this.snackBar.open(error?.error?.message || `Impossible de retirer ${conservateur.nom}`, 'Fermer', { duration: 5000 });
      },
    });
  }

  private updateResponsables(): void {
    const actuel = this.inputDetail?.responsable;
    this.responsables = this.lists.salaries.filter((s) => s.is_ope || s.cd_type === actuel);
  }

  get isEditAllowed(): boolean {
    return this.loginService.isEdit();
  }

  toggleEditMode(): void {
    if (!this.isEditMode && !this.isEditAllowed) {
      return;
    }
    this.isEditMode = this.formService.simpleToggle(this.isEditMode); // Changer le mode du booleen
    this.formService.toggleFormState(this.form, this.isEditMode, this.initialFormValues); // Changer l'état du formulaire
  }

  getInvalidFields(): string[] {
    return this.formService.getInvalidFields(this.form);
  }

  isFormChanged(): boolean {
    // Vérifie si le formulaire a été modifié
    return JSON.stringify(this.form.value) !== JSON.stringify(this.initialFormValues);
  }

  onUpdate(): void {
    // Mettre à jour le formulaire

    const updateObservable = this.formService.putBdd('update', 'espace_site', this.form, this.isEditMode, this.snackBar, this.inputDetail!.uuid_site, this.initialFormValues);
    // S'abonner à l'observable

    if (updateObservable) {
      updateObservable.subscribe(
        (result) => {
          this.isEditMode = result.isEditMode;
          this.initialFormValues = this.form.getRawValue();
          // Répercute la saisie sur le site affiché (autres onglets)
          Object.assign(this.inputDetail!, this.initialFormValues);
          // putBdd() désactive le formulaire après sauvegarde (grisé Material) : ici la lecture
          // seule est assurée par l'attribut inert du template, on réactive donc les champs.
          this.form.enable({ emitEvent: false });
          console.log('Formulaire mis à jour avec succès:', result.formValue);
        },
        (error) => {
          console.error('Erreur lors de la mise à jour du formulaire', error);
        }
      );
    }
  }
}
