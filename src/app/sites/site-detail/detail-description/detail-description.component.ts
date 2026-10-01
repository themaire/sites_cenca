import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar'; // Importer MatSnackBar e

import { DetailSite } from '../../site-detail';
import { SitesService, UrlCheck } from '../../sites.service';
import { FormService } from '../../../shared/services/form.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { LoginService } from '../../../login/login.service';
import { SiteSelectListsService } from '../../site-select-lists.service';
import { SelectValue } from '../../../shared/interfaces/formValues';
import { FormButtonsComponent } from '../../../shared/form-buttons/form-buttons.component';

type LinkStatus = 'vide' | 'verif' | 'ok' | 'ko' | 'inconnu';

@Component({
  selector: 'app-detail-description',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormButtonsComponent,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './detail-description.component.html',
  styleUrl: './detail-description.component.scss',
})
export class DetailDescriptionComponent implements OnInit, OnChanges {
  @Input() inputDetail?: DetailSite; // Le site selectionné pour voir son détail
  form: FormGroup;

  // Variable pour activer/désactiver le mode édition (pilotée par app-form-buttons)
  isEditMode: boolean = false;
  isMobile: boolean = false;

  typesOuverture: SelectValue[] = [];

  // État des liens en consultation : 'ok' (répond), 'ko' (ne répond pas), 'inconnu' (test impossible), 'vide'
  linkStatus: Record<'url_cen' | 'url_mnhn', LinkStatus> = { url_cen: 'vide', url_mnhn: 'vide' };
  // Cause affichée sous un lien cassé (utile quand un collègue décrit ce qu'il voit à l'écran)
  linkCause: Record<'url_cen' | 'url_mnhn', string> = { url_cen: '', url_mnhn: '' };

  initialFormValues: any; // Valeurs initiales du formulaire, restaurées à l'annulation

  private snackBar = inject(MatSnackBar); // Injecter MatSnackBar

  constructor(
    private sitesService: SitesService,
    private formService: FormService,
    private fb: FormBuilder,
    private breakpointObserver: BreakpointObserver,
    private loginService: LoginService,
    private selectLists: SiteSelectListsService
  ) {
    // Seuls les champs affichés dans ce composant : putBdd envoie tout le formulaire au backend.
    this.form = this.fb.group({
      description_site: [''],
      sensibilite: [false, Validators.required],
      remq_sensibilite: [''],
      typ_ouverture: [''],
      url_cen: [''],
      url_mnhn: [''],
    });
  }

  ngOnInit() {
    this.selectLists.load$().subscribe((lists) => {
      this.typesOuverture = lists.typesOuverture;
    });

    // "Description sensibilité" n'a de sens que pour un site sensible : verrouillée (readonly dans
    // le template) et vidée quand on décoche le toggle.
    this.form.get('sensibilite')?.valueChanges.subscribe((sensible) => {
      if (!sensible) this.form.get('remq_sensibilite')?.setValue('');
    });

    // Détecter si c'est la version mobile
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.isMobile = result.matches;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.inputDetail) {
      this.form.patchValue({
        description_site: this.inputDetail.description_site,
        sensibilite: this.inputDetail.sensibilite,
        remq_sensibilite: this.inputDetail.remq_sensibilite,
        typ_ouverture: this.inputDetail.typ_ouverture,
        url_cen: this.inputDetail.url_cen,
        url_mnhn: this.inputDetail.url_mnhn,
      });
      this.initialFormValues = this.form.getRawValue();
      this.checkLinks();
    }
  }

  /** Lien affichable : ajoute https:// si aucun schéma n'est saisi (sinon le href serait relatif). */
  href(url?: string | null): string {
    const u = (url ?? '').trim();
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(u) ? u : `https://${u}`;
  }

  private causeLabel(check: UrlCheck): string {
    if (check.status) return `code HTTP ${check.status}`;
    return check.message || 'aucune réponse du serveur (introuvable ou délai dépassé)';
  }

  private checkLinks(): void {
    for (const champ of ['url_cen', 'url_mnhn'] as const) {
      const url = ((this.inputDetail?.[champ] as string | undefined) ?? '').trim();
      if (!url) {
        this.linkStatus[champ] = 'vide';
        continue;
      }
      this.linkStatus[champ] = 'verif';
      this.sitesService.checkUrl(this.href(url)).subscribe((check) => {
        // Ignore une réponse tardive si le lien a été modifié entre-temps
        if (((this.inputDetail?.[champ] as string | undefined) ?? '').trim() === url) {
          this.linkStatus[champ] = check.etat;
          this.linkCause[champ] = this.causeLabel(check);
        }
      });
    }
  }

  get isEditAllowed(): boolean {
    return this.loginService.isEdit();
  }

  // Appelé par app-form-buttons (crayon et croix d'annulation)
  toggleEditMode() {
    if (!this.isEditMode && !this.isEditAllowed) {
      return;
    }
    this.isEditMode = this.formService.simpleToggle(this.isEditMode);
    if (!this.isEditMode) {
      this.form.patchValue(this.initialFormValues);
    }
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
          // Répercute la saisie sur le site affiché (liens, autres onglets)
          Object.assign(this.inputDetail!, this.initialFormValues);
          // putBdd() désactive le formulaire après sauvegarde (grisé Material) : ici la lecture
          // seule est assurée par l'attribut inert du template, on réactive donc les champs.
          this.form.enable({ emitEvent: false });
          this.checkLinks();
          console.log('Formulaire mis à jour avec succès:', result.formValue);
        },
        (error) => {
          console.error('Erreur lors de la mise à jour du formulaire', error);
        }
      );
    }
  }
}
