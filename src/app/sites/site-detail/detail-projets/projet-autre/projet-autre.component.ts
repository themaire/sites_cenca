import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SelectValue } from '../../../../shared/interfaces/formValues';
import { FormService } from '../../../../shared/services/form.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { LoginService } from '../../../../login/login.service';
import { FormButtonsComponent } from '../../../../shared/form-buttons/form-buttons.component';

import { ProjetsAutresService } from './projets-autres.service';
import { OperationAutreComponent } from './operation-autre/operation-autre.component';
import {
  Localisant,
  NomenclaturesAutres,
  OperationAutre,
  ProjetAutre,
  ProjetAutreBody,
  pipesVersSautsDeLigne,
} from './projets-autres';

/**
 * Fiche d'un projet « autre » (hors travaux, schéma opeautres) : en-tête éditable
 * puis liste des opérations (ajouter, modifier, dupliquer, supprimer).
 * Un seul formulaire pour tous les types : le type sert à préremplir et ordonner les listes.
 */
@Component({
  selector: 'app-projet-autre',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    FormButtonsComponent,
    OperationAutreComponent,
  ],
  templateUrl: './projet-autre.component.html',
  styleUrl: './projet-autre.component.scss',
})
export class ProjetAutreComponent implements OnInit, OnChanges, OnDestroy {
  /** Projet existant ; absent pour une création */
  @Input() uuidProj?: string;
  /** Type choisi dans la fiche projet parente lors d'une création */
  @Input() typProjet?: string;
  /** Site d'où l'on vient : localisation pré-remplie des nouvelles opérations */
  @Input() siteLocalisant: Localisant | null = null;

  /** Choix du type « travaux » pendant une création : la fiche parente reprend la main */
  @Output() typProjetChange = new EventEmitter<string>();
  /** Le projet a été supprimé : la fiche parente se ferme */
  @Output() supprime = new EventEmitter<void>();

  projet?: ProjetAutre;
  nomenclatures?: NomenclaturesAutres;
  salaries: SelectValue[] = [];

  form!: FormGroup;
  isLoading = true;
  isEditProjet = false;
  isSaving = false;
  erreurs: string[] = [];

  private projetSupprime = false;

  /** Opération en cours de saisie : undefined = aucune, null = nouvelle */
  operationEnCours: OperationAutre | null | undefined = undefined;

  constructor(
    private fb: FormBuilder,
    private projetsAutresService: ProjetsAutresService,
    private formService: FormService,
    private confirmationService: ConfirmationService,
    private snackbar: SnackbarService,
    private loginService: LoginService,
  ) {}

  get isEditAllowed(): boolean {
    return this.loginService.isEdit();
  }

  get isCreation(): boolean {
    return !this.projet;
  }

  private get cdSalarie(): string | null {
    return this.loginService.user()?.cd_salarie || null;
  }

  /** Collègues ayant la fiche ouverte dans Access (sans l'utilisateur connecté) */
  ouvertPar(projet: ProjetAutre | undefined = this.projet): { compte: string; nom: string }[] {
    return (projet?.ouvert_par ?? []).filter(o => o.compte !== this.cdSalarie);
  }

  get nomsOuvertPar(): string {
    return this.ouvertPar().map(o => o.nom || o.compte).join(', ');
  }

  /** Nom du projet sur une ligne pour le titre (les retours à la ligne sont stockés « | ») */
  get nomTitre(): string {
    return (this.projet?.nom ?? '').split('|').map(s => s.trim()).filter(Boolean).join(' – ');
  }

  get typesProjet(): SelectValue[] {
    return this.nomenclatures?.typ_projets ?? [];
  }

  async ngOnInit(): Promise<void> {
    this.form = this.fb.group({
      nom: ['', [Validators.required, Validators.maxLength(255)]],
      typ_projet: [this.typProjet ?? null, Validators.required],
      annee: [new Date().getFullYear(), [Validators.required, Validators.min(1990), Validators.max(2100)]],
      statut: ['En cours', Validators.required],
      responsable: [this.cdSalarie, Validators.required],
      programme: [null],
    });

    try {
      const [nomenclatures, salaries] = await Promise.all([
        this.projetsAutresService.getNomenclatures(),
        firstValueFrom(this.formService.getSelectValues$('sites/selectvalues=admin.salaries')).catch(() => [] as SelectValue[]),
      ]);
      this.nomenclatures = nomenclatures;
      this.salaries = salaries ?? [];

      if (this.uuidProj) {
        await this.chargerProjet();
      } else {
        this.isEditProjet = true;
      }
    } catch (error) {
      console.error('Erreur lors du chargement du projet autre', error);
      this.erreurs = error instanceof HttpErrorResponse
        ? this.projetsAutresService.erreursDe(error)
        : ['Impossible de charger le projet.'];
    }
    this.isLoading = false;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Type changé dans la fiche parente pendant une création
    if (changes['typProjet'] && !changes['typProjet'].firstChange && this.form && this.isCreation) {
      this.form.patchValue({ typ_projet: this.typProjet });
    }
  }

  ngOnDestroy(): void {
    // Fiche fermée (Échap, clic hors du dialogue) sur un projet vide : il sera introuvable depuis le site
    if (this.projet && !this.projet.operations.length && !this.projetSupprime) {
      this.snackbar.info(`Le projet « ${this.nomTitre} » n'a aucune opération : il n'apparaîtra pas dans la liste du site.`, 'Fermer', 8000);
    }
  }

  private async chargerProjet(): Promise<void> {
    this.projet = await this.projetsAutresService.getProjet(this.uuidProj!);
    this.remplirFormulaire();
  }

  private remplirFormulaire(): void {
    if (!this.projet) return;
    this.form.reset({
      nom: pipesVersSautsDeLigne(this.projet.nom),
      typ_projet: this.projet.typ_projet,
      annee: this.projet.annee,
      statut: this.projet.statut,
      responsable: this.projet.responsable,
      programme: this.projet.programme,
    });
  }

  // ── Libellés ────────────────────────────────────────────────────────────────

  libelle(cd_type: string | null | undefined, liste: SelectValue[] | undefined): string {
    if (!cd_type) return '';
    return liste?.find(v => v.cd_type === cd_type)?.libelle ?? cd_type;
  }

  multiligne(texte: string | null | undefined): string {
    return pipesVersSautsDeLigne(texte);
  }

  cheminAction(ope: OperationAutre): string {
    return ope.action_chemin?.map(n => n.libelle).join(' › ') || ope.action;
  }

  periode(ope: OperationAutre): string {
    if (!ope.date_deb_str && !ope.date_fin_str) return 'Dates non renseignées';
    if (ope.date_deb_str === ope.date_fin_str || !ope.date_fin_str) return 'Le ' + ope.date_deb_str;
    if (!ope.date_deb_str) return "Jusqu'au " + ope.date_fin_str;
    return `Du ${ope.date_deb_str} au ${ope.date_fin_str}`;
  }

  // ── En-tête du projet ───────────────────────────────────────────────────────

  onTypeChange(typ_projet: string): void {
    if (this.isCreation) this.typProjetChange.emit(typ_projet);
  }

  toggleEditProjet(): void {
    if (this.isEditProjet) this.remplirFormulaire(); // annulation : on revient aux valeurs enregistrées
    this.isEditProjet = !this.isEditProjet;
    this.erreurs = [];
  }

  private corpsProjet(): ProjetAutreBody {
    const v = this.form.getRawValue();
    return {
      nom: (v.nom ?? '').trim(),
      typ_projet: v.typ_projet,
      annee: Number(v.annee),
      statut: v.statut,
      responsable: v.responsable,
      programme: v.programme || null,
    };
  }

  async enregistrerProjet(): Promise<void> {
    if (this.isSaving) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.erreurs = ['Le nom, le type, l\'année, le statut et le responsable sont obligatoires.'];
      return;
    }
    this.erreurs = [];

    if (this.isCreation) {
      this.creerProjet();
    } else if (await this.confirmerSiOuvertDansAccess()) {
      this.modifierProjet();
    }
  }

  private creerProjet(): void {
    this.isSaving = true;
    this.projetsAutresService.createProjet(this.corpsProjet()).subscribe({
      next: res => {
        this.isSaving = false;
        this.projet = { ...res.projet, operations: res.projet.operations ?? [], ouvert_par: res.projet.ouvert_par ?? [] };
        this.uuidProj = res.uuid_proj;
        this.remplirFormulaire();
        this.isEditProjet = false;
        this.snackbar.success('Projet créé. Saisissez maintenant sa première opération.');
        // Enchaîner sur la saisie de la première opération (localisation du site pré-remplie)
        this.operationEnCours = null;
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving = false;
        this.erreurs = this.projetsAutresService.erreursDe(error);
      },
    });
  }

  /**
   * Relit ouvert_par juste avant l'enregistrement : si un collègue a ouvert la fiche dans Access
   * entre-temps, on redemande confirmation (on informe, on ne bloque jamais).
   */
  private async confirmerSiOuvertDansAccess(): Promise<boolean> {
    let relu: ProjetAutre;
    try {
      relu = await this.projetsAutresService.getProjet(this.projet!.uuid_proj);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.snackbar.error('Ce projet a été supprimé entre-temps.');
        this.projetSupprime = true;
        this.supprime.emit();
        return false;
      }
      return true; // relecture impossible : on n'empêche pas l'enregistrement
    }
    const avant = new Set(this.ouvertPar().map(o => o.compte));
    const nouveaux = this.ouvertPar(relu).filter(o => !avant.has(o.compte));
    this.projet!.ouvert_par = relu.ouvert_par;
    if (!nouveaux.length) return true;

    const noms = nouveaux.map(o => o.nom || o.compte).join(', ');
    const message = `Ce projet vient d'être ouvert en modification dans Access par <strong>${noms}</strong>.\n`
      + 'Vos modifications et les siennes peuvent s\'écraser. Enregistrer quand même ?';
    const reponse = await firstValueFrom(this.confirmationService.confirm('Fiche ouverte dans Access', message, 'confirm'));
    return reponse === true;
  }

  private modifierProjet(): void {
    this.isSaving = true;
    this.projetsAutresService.updateProjet(this.projet!.uuid_proj, this.corpsProjet()).subscribe({
      next: res => {
        this.isSaving = false;
        this.projet = {
          ...this.projet!,
          ...res.projet,
          operations: res.projet.operations ?? this.projet!.operations,
          ouvert_par: res.projet.ouvert_par ?? this.projet!.ouvert_par,
        };
        this.remplirFormulaire();
        this.isEditProjet = false;
        this.snackbar.success('Projet enregistré.');
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving = false;
        this.erreurs = this.projetsAutresService.erreursDe(error);
      },
    });
  }

  supprimerProjet(): void {
    if (!this.projet) return;
    const nb = this.projet.operations.length;
    const message = `Supprimer le projet <strong>${this.projet.nom}</strong> et ses ${nb} opération${nb > 1 ? 's' : ''} ?\n`
      + 'La suppression est enregistrée à votre nom dans l\'historique, avec une copie des données.';
    this.confirmationService.confirm('Suppression du projet', message, 'delete').subscribe(ok => {
      if (ok !== true) return;
      this.projetsAutresService.deleteProjet(this.projet!.uuid_proj).subscribe({
        next: res => {
          this.snackbar.success(`Projet supprimé (${res.operations_supprimees ?? nb} opération(s)).`);
          this.projetSupprime = true;
          this.supprime.emit();
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.snackbar.info('Ce projet avait déjà été supprimé.');
            this.projetSupprime = true;
            this.supprime.emit();
          } else {
            this.erreurs = this.projetsAutresService.erreursDe(error);
          }
        },
      });
    });
  }

  // ── Opérations ──────────────────────────────────────────────────────────────

  nouvelleOperation(): void {
    this.operationEnCours = null;
  }

  modifierOperation(ope: OperationAutre): void {
    this.operationEnCours = ope;
  }

  onOperationEnregistree(ope: OperationAutre): void {
    const operations = this.projet!.operations;
    const index = operations.findIndex(o => o.uuid_ope === ope.uuid_ope);
    this.projet!.operations = index >= 0
      ? operations.map(o => (o.uuid_ope === ope.uuid_ope ? ope : o))
      : [...operations, ope];
    this.operationEnCours = undefined;
    this.snackbar.success('Opération enregistrée.');
  }

  onOperationAnnulee(): void {
    this.operationEnCours = undefined;
    if (this.projet && !this.projet.operations.length) this.proposerSuppressionProjetVide();
  }

  /**
   * La liste des projets de la fiche site part des opérations : un projet sans opération
   * n'y apparaît pas et ne peut plus être rouvert depuis le site. On propose de le supprimer.
   */
  private proposerSuppressionProjetVide(): void {
    const message = `Le projet <strong>${this.nomTitre}</strong> n'a aucune opération : `
      + 'il n\'apparaîtra pas dans la liste des projets du site.\nLe supprimer ?';
    this.confirmationService.confirm('Projet sans opération', message, 'delete').subscribe(ok => {
      if (ok !== true) return;
      this.projetsAutresService.deleteProjet(this.projet!.uuid_proj).subscribe({
        next: () => {
          this.snackbar.success('Projet vide supprimé.');
          this.projetSupprime = true;
          this.supprime.emit();
        },
        error: (error: HttpErrorResponse) => (this.erreurs = this.projetsAutresService.erreursDe(error)),
      });
    });
  }

  /** Copie l'opération et toutes ses listes, puis l'ouvre pour ajuster les dates */
  dupliquerOperation(ope: OperationAutre): void {
    this.projetsAutresService.cloneOperation(ope.uuid_ope).subscribe({
      next: res => {
        this.projet!.operations = [...this.projet!.operations, res.operation];
        this.snackbar.info('Copie créée : ajustez ses dates puis enregistrez.');
        this.operationEnCours = res.operation;
      },
      error: (error: HttpErrorResponse) => {
        this.erreurs = this.projetsAutresService.erreursDe(error);
        if (error.status === 404) this.rechargerProjet();
      },
    });
  }

  supprimerOperation(ope: OperationAutre): void {
    const message = `Supprimer l'opération <strong>${this.cheminAction(ope)}</strong> (${this.periode(ope).toLowerCase()}) ?\n`
      + 'La suppression est enregistrée à votre nom dans l\'historique, avec une copie des données.';
    this.confirmationService.confirm('Suppression de l\'opération', message, 'delete').subscribe(ok => {
      if (ok !== true) return;
      this.projetsAutresService.deleteOperation(ope.uuid_ope).subscribe({
        next: () => {
          this.projet!.operations = this.projet!.operations.filter(o => o.uuid_ope !== ope.uuid_ope);
          this.snackbar.success('Opération supprimée.');
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.snackbar.info('Cette opération avait déjà été supprimée : liste rechargée.');
            this.rechargerProjet();
          } else {
            this.erreurs = this.projetsAutresService.erreursDe(error);
          }
        },
      });
    });
  }

  private async rechargerProjet(): Promise<void> {
    try {
      await this.chargerProjet();
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.snackbar.info('Ce projet a été supprimé entre-temps.');
        this.projetSupprime = true;
        this.supprime.emit();
      }
    }
  }
}
