import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Overlay } from '@angular/cdk/overlay';
import { Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';

import { SelectValue } from '../../../../../shared/interfaces/formValues';
import { AnnuaireService } from '../../../../../annuaire/annuaire.service';
import { AnnuaireLite } from '../../../../../annuaire/interfaces/annuaire';
import { AnnuaireFicheComponent } from '../../../../../annuaire/annuaire-fiche/annuaire-fiche.component';
import { ProjetsAutresService } from '../projets-autres.service';
import {
  ActionAutre,
  CATEGORIES_LOCALISANTS,
  CibleNomenclature,
  CibleOperation,
  IndicateurOperation,
  IntervenantOperation,
  Localisant,
  NomenclaturesAutres,
  OperationAutre,
  OperationAutreBody,
  USAGES_PAR_TYPE,
  pipesVersSautsDeLigne,
} from '../projets-autres';

export const DATE_FORMATS_OPE_AUTRE = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

type FamilleCibles = 'publics' | 'ecologiques' | 'autres';

/**
 * Formulaire d'une opération d'un projet « autre » (sensibilisation, étude, police...).
 * Ordre de saisie repris de l'interface Access : action en cascade, dates, localisations,
 * cibles, indicateurs, intervenants, puis détail et mode d'intervention.
 */
@Component({
  selector: 'app-operation-autre',
  standalone: true,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    provideMomentDateAdapter(DATE_FORMATS_OPE_AUTRE),
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
  ],
  templateUrl: './operation-autre.component.html',
  styleUrl: './operation-autre.component.scss',
})
export class OperationAutreComponent implements OnInit, OnDestroy {
  /** Opération à modifier ; null pour une nouvelle opération */
  @Input() operation: OperationAutre | null = null;
  @Input({ required: true }) uuidProj!: string;
  @Input({ required: true }) typProjet!: string;
  @Input({ required: true }) nomenclatures!: NomenclaturesAutres;
  /** Site d'où le projet est ouvert : pré-rempli dans les localisations d'une nouvelle opération */
  @Input() siteLocalisant: Localisant | null = null;

  @Output() enregistree = new EventEmitter<OperationAutre>();
  @Output() annulee = new EventEmitter<void>();

  readonly categories = CATEGORIES_LOCALISANTS;

  form!: FormGroup;
  isLoading = true;
  isSaving = false;
  erreurs: string[] = [];

  // Action en trois listes en cascade
  arbre: ActionAutre[] = [];
  /** Action plus profonde que 3 niveaux (données historiques) : conservée tant qu'on ne touche pas aux listes */
  private actionProfonde: string | null = null;
  private actionCheminProfond: string = '';

  // Listes rattachées à l'opération
  localisations: Localisant[] = [];
  cibles: CibleOperation[] = [];
  indicateurs: IndicateurOperation[] = [];
  intervenants: IntervenantOperation[] = [];

  // Ajout d'une localisation : catégorie puis lieu
  catLocCtrl = new FormControl<string>('SITE CENCA');
  lieuCtrl = new FormControl<string | Localisant>('');
  lieuxProposes: Localisant[] = [];
  rechercheLieuEnCours = false;

  // Ajout d'une cible
  familleCibles: FamilleCibles = 'publics';
  cibleCtrl = new FormControl<string | null>(null);
  cibleDetailCtrl = new FormControl<string>({ value: '', disabled: true });
  groupesEcologiques: { groupe: CibleNomenclature; cibles: CibleNomenclature[] }[] = [];

  // Ajout d'un indicateur
  indicateurCtrl = new FormControl<string | null>(null);
  evaluationCtrl = new FormControl<string>({ value: '', disabled: true });

  // Ajout d'un intervenant : type de contact, contact, rôle
  typPersonnes: SelectValue[] = [];
  typPersonneCtrl = new FormControl<string | null>(null);
  contactCtrl = new FormControl<string | AnnuaireLite>('');
  contactsProposes: AnnuaireLite[] = [];
  roleCtrl = new FormControl<string | null>(null);

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private projetsAutresService: ProjetsAutresService,
    private annuaireService: AnnuaireService,
    private dialog: MatDialog,
    private overlay: Overlay,
  ) {}

  get isNouvelle(): boolean {
    return !this.operation?.uuid_ope;
  }

  async ngOnInit(): Promise<void> {
    const ope = this.operation;
    const chemin = ope?.action_chemin ?? [];

    this.form = this.fb.group({
      niveau1: [chemin[0]?.cd_action ?? null],
      niveau2: [{ value: chemin[1]?.cd_action ?? null, disabled: !chemin[0] }],
      niveau3: [{ value: chemin[2]?.cd_action ?? null, disabled: !chemin[1] }],
      date_deb: [ope?.date_deb ? moment(ope.date_deb, 'YYYY-MM-DD') : null],
      date_fin: [ope?.date_fin ? moment(ope.date_fin, 'YYYY-MM-DD') : null],
      detail: [pipesVersSautsDeLigne(ope?.detail)],
      typ_interv: [ope?.typ_interv ?? null],
      com_interv: [pipesVersSautsDeLigne(ope?.com_interv)],
    });

    if (chemin.length > 3) {
      this.actionProfonde = ope!.action;
      this.actionCheminProfond = chemin.slice(3).map(n => n.libelle).join(' > ');
    }

    if (ope) {
      this.localisations = [...ope.localisations];
      this.cibles = ope.cibles.map(c => ({ ...c, detail: c.detail ? pipesVersSautsDeLigne(c.detail) : c.detail }));
      this.indicateurs = [...ope.indicateurs];
      this.intervenants = [...ope.intervenants];
    } else if (this.siteLocalisant) {
      // Créé depuis une fiche site : le site est la première localisation
      this.localisations = [this.siteLocalisant];
    }

    this.ecouterSaisies();

    // Valeurs proposées en premier selon le type de projet
    const usage = USAGES_PAR_TYPE[this.typProjet];
    this.familleCibles = usage?.cibles ?? 'publics';
    if (this.isNouvelle && usage) this.choisirIndicateur(usage.indicateur);
    this.groupesEcologiques = this.grouperCiblesEcologiques(this.nomenclatures.cibles.ecologiques);

    try {
      [this.arbre, this.typPersonnes] = await Promise.all([
        this.projetsAutresService.getActions(this.typProjet),
        this.annuaireService.getTypPersonnes().catch(() => [] as SelectValue[]),
      ]);
    } catch (error) {
      console.error("Erreur lors du chargement de l'arbre des actions", error);
      this.erreurs = ["Impossible de charger la liste des actions."];
    }
    this.isLoading = false;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private ecouterSaisies(): void {
    // Autocomplétion des lieux dans la catégorie choisie
    this.subscriptions.add(
      this.lieuCtrl.valueChanges.pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap(valeur => {
          const q = typeof valeur === 'string' ? valeur.trim() : '';
          if (q.length < 2) return of([] as Localisant[]);
          this.rechercheLieuEnCours = true;
          return this.projetsAutresService.getLocalisants(q, this.catLocCtrl.value).pipe(catchError(() => of([] as Localisant[])));
        })
      ).subscribe(lieux => {
        this.lieuxProposes = lieux;
        this.rechercheLieuEnCours = false;
      })
    );
    this.subscriptions.add(this.catLocCtrl.valueChanges.subscribe(() => {
      this.lieuCtrl.setValue('');
      this.lieuxProposes = [];
    }));

    // Le détail d'une cible n'est saisissable qu'une fois la cible choisie
    this.subscriptions.add(this.cibleCtrl.valueChanges.subscribe(valeur => {
      if (valeur) this.cibleDetailCtrl.enable(); else { this.cibleDetailCtrl.reset(''); this.cibleDetailCtrl.disable(); }
    }));
    // Idem pour la valeur d'un indicateur
    this.subscriptions.add(this.indicateurCtrl.valueChanges.subscribe(valeur => {
      if (valeur) this.evaluationCtrl.enable(); else { this.evaluationCtrl.reset(''); this.evaluationCtrl.disable(); }
    }));

    // Contacts de l'annuaire filtrés par type et par nom
    this.subscriptions.add(
      this.contactCtrl.valueChanges.pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap(valeur => {
          const q = typeof valeur === 'string' ? valeur.trim() : '';
          if (q.length < 2 && !this.typPersonneCtrl.value) return of([] as AnnuaireLite[]);
          return this.annuaireService.getAnnuaires({ q: q || undefined, typ_personne: this.typPersonneCtrl.value || undefined, validite: true })
            .catch(() => [] as AnnuaireLite[]);
        })
      ).subscribe(contacts => (this.contactsProposes = contacts.slice(0, 100)))
    );
    this.subscriptions.add(this.typPersonneCtrl.valueChanges.subscribe(() => this.contactCtrl.setValue('')));
  }

  // ── Action en cascade ───────────────────────────────────────────────────────

  get branchesConseillees(): ActionAutre[] {
    return this.arbre.filter(a => a.conseillee);
  }

  get autresBranches(): ActionAutre[] {
    return this.arbre.filter(a => !a.conseillee);
  }

  get niveau2Options(): ActionAutre[] {
    return this.arbre.find(a => a.cd_action === this.form.get('niveau1')?.value)?.enfants ?? [];
  }

  get niveau3Options(): ActionAutre[] {
    return this.niveau2Options.find(a => a.cd_action === this.form.get('niveau2')?.value)?.enfants ?? [];
  }

  /** L'action enregistrée est la plus profonde renseignée */
  get actionChoisie(): string | null {
    const { niveau1, niveau2, niveau3 } = this.form.getRawValue();
    return this.actionProfonde ?? niveau3 ?? niveau2 ?? niveau1 ?? null;
  }

  /** Commentaire d'aide du nœud le plus profond choisi */
  get commentaireAction(): string | null {
    const n1 = this.arbre.find(a => a.cd_action === this.form.get('niveau1')?.value);
    const n2 = n1?.enfants.find(a => a.cd_action === this.form.get('niveau2')?.value);
    const n3 = n2?.enfants.find(a => a.cd_action === this.form.get('niveau3')?.value);
    return (n3 ?? n2 ?? n1)?.commentaire ?? null;
  }

  get libelleActionProfonde(): string {
    return this.actionCheminProfond;
  }

  /** Changer un niveau vide les niveaux inférieurs */
  onNiveauChange(niveau: 1 | 2): void {
    this.actionProfondeEffacee();
    const n2 = this.form.get('niveau2')!;
    const n3 = this.form.get('niveau3')!;
    if (niveau === 1) {
      n2.reset(null);
      if (this.niveau2Options.length) n2.enable(); else n2.disable();
    }
    n3.reset(null);
    if (this.niveau3Options.length) n3.enable(); else n3.disable();
  }

  actionProfondeEffacee(): void {
    this.actionProfonde = null;
    this.actionCheminProfond = '';
  }

  // ── Localisations ───────────────────────────────────────────────────────────

  afficherLieu = (lieu: Localisant | string | null): string => (typeof lieu === 'string' ? lieu : lieu?.libelle ?? '');

  ajouterLieu(event: MatAutocompleteSelectedEvent): void {
    const lieu = event.option.value as Localisant;
    if (!this.localisations.some(l => l.cd_localisation === lieu.cd_localisation)) {
      this.localisations = [...this.localisations, lieu];
    }
    this.lieuCtrl.setValue('');
    this.lieuxProposes = [];
  }

  retirerLieu(lieu: Localisant): void {
    this.localisations = this.localisations.filter(l => l.cd_localisation !== lieu.cd_localisation);
  }

  // ── Cibles ──────────────────────────────────────────────────────────────────

  private grouperCiblesEcologiques(cibles: CibleNomenclature[]): { groupe: CibleNomenclature; cibles: CibleNomenclature[] }[] {
    const groupes = new Map<string, { groupe: CibleNomenclature; cibles: CibleNomenclature[] }>();
    for (const cible of cibles) {
      const code = cible.groupe ?? cible.cd_type ?? '';
      if (!groupes.has(code)) {
        const tete = cibles.find(c => c.cd_type === code) ?? { cd_type: code, libelle: code };
        groupes.set(code, { groupe: tete, cibles: [] });
      }
      groupes.get(code)!.cibles.push(cible);
    }
    return [...groupes.values()];
  }

  get ciblesFamille(): CibleNomenclature[] {
    return this.familleCibles === 'ecologiques' ? this.nomenclatures.cibles.ecologiques
      : this.familleCibles === 'autres' ? this.nomenclatures.cibles.autres
      : this.nomenclatures.cibles.publics;
  }

  onFamilleCiblesChange(famille: FamilleCibles): void {
    this.familleCibles = famille;
    this.cibleCtrl.reset(null);
  }

  libelleCible(typ_cible: string): string {
    const toutes = [...this.nomenclatures.cibles.publics, ...this.nomenclatures.cibles.ecologiques, ...this.nomenclatures.cibles.autres];
    return toutes.find(c => c.cd_type === typ_cible)?.libelle ?? typ_cible;
  }

  cibleDejaPresente(typ_cible: string): boolean {
    return this.cibles.some(c => c.typ_cible === typ_cible);
  }

  ajouterCible(): void {
    const typ_cible = this.cibleCtrl.value;
    if (!typ_cible || this.cibleDejaPresente(typ_cible)) return;
    const detail = (this.cibleDetailCtrl.value ?? '').trim();
    this.cibles = [...this.cibles, { typ_cible, libelle: this.libelleCible(typ_cible), detail: detail || null }];
    this.cibleCtrl.reset(null);
  }

  retirerCible(cible: CibleOperation): void {
    this.cibles = this.cibles.filter(c => c !== cible);
  }

  // ── Indicateurs ─────────────────────────────────────────────────────────────

  private choisirIndicateur(cd_type: string): void {
    if (this.nomenclatures.indicateurs.some(i => i.cd_type === cd_type)) this.indicateurCtrl.setValue(cd_type);
  }

  libelleIndicateur(typ_indicateur: string): string {
    return this.nomenclatures.indicateurs.find(i => i.cd_type === typ_indicateur)?.libelle ?? typ_indicateur;
  }

  ajouterIndicateur(): void {
    const typ_indicateur = this.indicateurCtrl.value;
    const evaluation = (this.evaluationCtrl.value ?? '').toString().trim();
    if (!typ_indicateur || !evaluation) return;
    this.indicateurs = [...this.indicateurs, { typ_indicateur, libelle: this.libelleIndicateur(typ_indicateur), evaluation }];
    this.indicateurCtrl.reset(null);
  }

  retirerIndicateur(indicateur: IndicateurOperation): void {
    this.indicateurs = this.indicateurs.filter(i => i !== indicateur);
  }

  // ── Intervenants ────────────────────────────────────────────────────────────

  afficherContact = (contact: AnnuaireLite | string | null): string => (typeof contact === 'string' ? contact : contact?.nom ?? '');

  libelleRole(typ_role: string): string {
    return this.nomenclatures.roles.find(r => r.cd_type === typ_role)?.libelle ?? typ_role;
  }

  get contactChoisi(): AnnuaireLite | null {
    const valeur = this.contactCtrl.value;
    return valeur && typeof valeur !== 'string' ? valeur : null;
  }

  intervenantDejaPresent(): boolean {
    const contact = this.contactChoisi;
    return !!contact && this.intervenants.some(i => i.intervenant === contact.uuid_ann && i.typ_role === this.roleCtrl.value);
  }

  ajouterIntervenant(): void {
    const contact = this.contactChoisi;
    const typ_role = this.roleCtrl.value;
    if (!contact || !typ_role || this.intervenantDejaPresent()) return;
    this.intervenants = [...this.intervenants, {
      intervenant: contact.uuid_ann,
      nom: contact.nom,
      typ_role,
      role_libelle: this.libelleRole(typ_role),
    }];
    this.contactCtrl.setValue('');
    this.roleCtrl.reset(null);
  }

  retirerIntervenant(intervenant: IntervenantOperation): void {
    this.intervenants = this.intervenants.filter(i => i !== intervenant);
  }

  /** Création à la volée d'un contact dans l'annuaire, sélectionné ensuite automatiquement */
  nouveauContact(): void {
    const saisie = this.contactCtrl.value;
    const dialogRef = this.dialog.open(AnnuaireFicheComponent, {
      data: {
        nomPrefill: typeof saisie === 'string' ? saisie : '',
        typPersonnePrefill: this.typPersonneCtrl.value || undefined,
        quickCreate: true,
      },
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
    dialogRef.afterClosed().subscribe(result => {
      if (result?.uuid_ann) {
        this.contactCtrl.setValue({ uuid_ann: result.uuid_ann, nom: result.nom } as AnnuaireLite);
      }
    });
  }

  // ── Enregistrement ──────────────────────────────────────────────────────────

  /** Une ligne choisie mais pas encore ajoutée avec « Ajouter » est prise en compte à l'enregistrement */
  private ajouterSaisiesEnAttente(): void {
    if (this.cibleCtrl.value) this.ajouterCible();
    if (this.indicateurCtrl.value && this.evaluationCtrl.value) this.ajouterIndicateur();
    if (this.contactChoisi && this.roleCtrl.value) this.ajouterIntervenant();
  }

  private dateIso(valeur: Moment | null): string | null {
    return valeur && moment.isMoment(valeur) && valeur.isValid() ? valeur.format('YYYY-MM-DD') : null;
  }

  private construireCorps(): OperationAutreBody {
    const valeurs = this.form.getRawValue();
    return {
      action: this.actionChoisie!,
      date_deb: this.dateIso(valeurs.date_deb),
      date_fin: this.dateIso(valeurs.date_fin),
      detail: valeurs.detail?.trim() || null,
      typ_interv: valeurs.typ_interv || null,
      com_interv: valeurs.com_interv?.trim() || null,
      localisations: this.localisations.map(l => l.cd_localisation),
      cibles: this.cibles.map(c => ({ typ_cible: c.typ_cible, detail: c.detail?.trim() || null })),
      indicateurs: this.indicateurs.map(i => ({ typ_indicateur: i.typ_indicateur, evaluation: i.evaluation ?? '' })),
      intervenants: this.intervenants.map(i => ({ typ_role: i.typ_role, intervenant: i.intervenant })),
    };
  }

  private verifier(corps: OperationAutreBody): string[] {
    const erreurs: string[] = [];
    if (!corps.action) erreurs.push("L'action est obligatoire (au minimum le niveau 1).");
    if (corps.date_deb && corps.date_fin && corps.date_fin < corps.date_deb) {
      erreurs.push('La date de fin est antérieure à la date de début.');
    }
    if ((corps.detail?.length ?? 0) > 2000) erreurs.push('Le détail dépasse 2000 caractères.');
    if (this.indicateurCtrl.value && !this.evaluationCtrl.value) {
      erreurs.push(`Indicateur « ${this.libelleIndicateur(this.indicateurCtrl.value)} » choisi sans valeur.`);
    }
    if (this.contactChoisi && !this.roleCtrl.value) erreurs.push(`Intervenant « ${this.contactChoisi.nom} » choisi sans rôle.`);
    return erreurs;
  }

  enregistrer(): void {
    if (this.isSaving) return;
    this.ajouterSaisiesEnAttente();
    const corps = this.construireCorps();
    this.erreurs = this.verifier(corps);
    if (this.erreurs.length) return;

    this.isSaving = true;
    const requete = this.isNouvelle
      ? this.projetsAutresService.createOperation(this.uuidProj, corps)
      : this.projetsAutresService.updateOperation(this.operation!.uuid_ope, corps);

    requete.subscribe({
      next: res => {
        this.isSaving = false;
        this.enregistree.emit(res.operation);
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving = false;
        this.erreurs = this.projetsAutresService.erreursDe(error);
      },
    });
  }

  annuler(): void {
    this.annulee.emit();
  }
}
