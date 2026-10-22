import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DocumentationService, DocSection } from '../services/documentation.service';
import { DocCategory } from '../services/documentation.service';
import { LoginService } from '../login/login.service';

@Component({
  standalone: true,
  selector: 'app-aide',
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="documentation-container">
      <mat-toolbar color="primary">
        <button mat-icon-button (click)="toggleSidenav()">
          <mat-icon>menu</mat-icon>
        </button>
        <span>Aide</span>
        <span class="toolbar-spacer"></span>
        <span *ngIf="currentSection">{{ currentSection.title }}</span>
      </mat-toolbar>

      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav [opened]="sidenavOpened" mode="side" class="sidenav">
          <mat-nav-list>
            <ng-container *ngFor="let category of categories">
              <h3 matSubheader *ngIf="categories.length > 1">{{ category.title }}</h3>
              <a mat-list-item 
                 *ngFor="let section of category.sections" 
                 (click)="navigateToSection(section)"
                 [class.active]="currentSection?.id === section.id">
                <mat-icon matListIcon>description</mat-icon>
                <span matLine>{{ section.title }}</span>
              </a>
            </ng-container>
          </mat-nav-list>
        </mat-sidenav>

        <mat-sidenav-content class="content">
          <div class="content-wrapper">
            <div *ngIf="isLoading" class="loading-container">
              <mat-spinner></mat-spinner>
              <p>Chargement...</p>
            </div>
            
            <div *ngIf="!isLoading && !connecte" class="connexion-requise">
              <mat-icon>lock</mat-icon>
              <p>L'aide est réservée aux utilisateurs de l'application.</p>
              <a mat-flat-button color="primary" routerLink="/login" [queryParams]="{ returnUrl: router.url }">Se connecter</a>
            </div>

            <div *ngIf="!isLoading && connecte" 
                 class="markdown-content" 
                 (click)="onContentClick($event)"
                 [innerHTML]="currentContent">
            </div>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .documentation-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .sidenav h3[matSubheader] {
      margin-top: 5px;
      // font-weight: bold;
      height: 32px;
      line-height: 32px;
      display: block;
      padding-left: 0;
    }

    .toolbar-spacer {
      flex: 1 1 auto;
    }

    .sidenav-container {
      flex: 1;
    }

    .sidenav {
      width: 280px;
      border-right: 1px solid #e0e0e0;
    }

    .content {
      overflow-y: auto;
    }

    .content-wrapper {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
    }

    .markdown-content {
      line-height: 1.6;
    }

    .connexion-requise {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 48px;
      text-align: center;
    }

    .markdown-content :deep(h1) {
      color: #1976d2;
      border-bottom: 2px solid #e3f2fd;
      padding-bottom: 8px;
      margin-bottom: 24px;
    }

    .markdown-content :deep(h2) {
      color: #1976d2;
      margin-top: 32px;
      margin-bottom: 16px;
    }

    .markdown-content :deep(h3) {
      color: #424242;
      margin-top: 24px;
      margin-bottom: 12px;
    }

    .markdown-content :deep(code) {
      background-color: #f5f5f5;
      padding: 2px 4px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
    }

    .markdown-content :deep(pre) {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
    }

    .markdown-content :deep(blockquote) {
      border-left: 4px solid #2196f3;
      margin: 16px 0;
      padding: 8px 16px;
      background-color: #f3f9ff;
    }

    .markdown-content :deep(ul), 
    .markdown-content :deep(ol) {
      margin: 16px 0;
      padding-left: 24px;
    }

    .markdown-content :deep(li) {
      margin: 8px 0;
    }

    .active {
      background-color: #e3f2fd !important;
    }

    @media (max-width: 768px) {
      .sidenav {
        width: 100%;
      }
      
      .content-wrapper {
        padding: 16px;
      }
    }
  `]
})
export class AideComponent implements OnInit {
  categories: DocCategory[] = [];
  currentContent: string = '';
  currentSection: DocSection | null = null;
  isLoading = true; // vrai jusqu'à la vérification de la session, pour ne pas afficher le message de connexion à tort
  sidenavOpened = true;
  /** Toutes les fiches exigent une connexion : un visiteur anonyme ne voit qu'une invitation à se connecter. */
  connecte = false;
  baseRoute = '/aide'; // Toujours utiliser /aide
  
  constructor(
    private documentationService: DocumentationService,
    private route: ActivatedRoute,
    public router: Router,
    private loginService: LoginService
  ) {}
  
  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
  }

  ngOnInit() {
    this.loadCategoriesAndSection();
    // Écouter les changements de route
    this.route.params.subscribe(params => {
      const sectionId = params['section'];
      if (sectionId) {
        this.loadSection(sectionId);
      }
    });
  }

  /**
   * Charge les catégories/sections, réservées aux utilisateurs connectés incluses.
   *
   * /aide n'est pas protégée par isLoggedInGuard (documentation publique) : c'est
   * ce guard qui réhydrate normalement loginService.user() depuis le token via
   * getUsers(). Sans lui, arriver directement sur /aide/:section (nouvel onglet,
   * F5) laisse user() à `undefined` pour toujours, ce qui masque à tort les
   * sections requireAuth. On tente donc ici une réhydratation silencieuse,
   * sans redirection en cas d'échec, pour ne pas casser l'accès public.
   */
  private loadCategoriesAndSection(): void {
    const proceed = () => {
      const isAuthenticated = this.loginService.user() !== null && this.loginService.user() !== undefined;
      this.connecte = isAuthenticated;
      if (!isAuthenticated) {
        this.sidenavOpened = false;
        this.isLoading = false;
        return;
      }
      this.documentationService.getHierarchicalSections(isAuthenticated).subscribe(categories => {
        this.categories = categories;
        // Si on est sur /aide sans section, charger la section 'index' de la première catégorie
        const currentUrl = this.router.url;
        if (currentUrl === '/aide' && categories.length > 0 && categories[0].sections.length > 0) {
          this.loadSection(categories[0].sections[0].id);
        }
        // Charger la section si un paramètre section est présent dans l'URL
        const sectionId = this.route.snapshot.params['section'];
        if (sectionId) {
          this.loadSection(sectionId);
        }
      });
    };

    if (this.loginService.user() === undefined) {
      this.loginService.getUsers().subscribe({
        next: proceed,
        error: proceed, // Utilisateur anonyme ou token invalide : sections publiques quand même
      });
    } else {
      proceed();
    }
  }

  loadSection(sectionId: string) {
    this.isLoading = true;
    const isAuthenticated = this.loginService.user() !== null && this.loginService.user() !== undefined;
    // Si les catégories ne sont pas chargées, attendre
    if (!this.categories || this.categories.length === 0) {
      this.isLoading = false;
      return;
    }
    // Rechercher la section dans toutes les catégories
    let foundSection: DocSection | null = null;
    for (const category of this.categories) {
      const section = category.sections.find(s => s.id === sectionId);
      if (section) {
        foundSection = section;
        break;
      }
    }
    // Si la section n'est pas trouvée, ne pas rediriger, juste afficher un message
    if (!foundSection) {
      this.currentContent = '<p>Section introuvable.</p>';
      this.isLoading = false;
      return;
    }
    this.currentSection = foundSection;
    // Charger le contenu selon la source (backend ou markdown local)
    if (foundSection.backendUrl || foundSection.path) {
      this.documentationService.loadSectionContent(foundSection).subscribe({
        next: (content: string) => {
          this.currentContent = content;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement de la documentation:', error);
          this.currentContent = '<p>Erreur lors du chargement de la documentation.</p>';
          this.isLoading = false;
        }
      });
    } else {
      this.currentContent = '<p>Aucun contenu disponible pour cette section.</p>';
      this.isLoading = false;
    }
  }

  /**
   * Les liens entre fiches ([texte](/aide/<id>)) sont injectés par innerHTML :
   * sans interception, chaque clic rechargerait toute l'application.
   * Ctrl/Cmd/Maj + clic garde le comportement du navigateur (nouvel onglet).
   */
  onContentClick(event: MouseEvent) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    const lien = (event.target as HTMLElement).closest('a');
    const href = lien?.getAttribute('href');
    if (href && href.startsWith(this.baseRoute + '/')) {
      event.preventDefault();
      this.router.navigateByUrl(href);
    }
  }

  navigateToSection(section: DocSection) {
    // Naviguer vers la route de la section, le chargement se fait via l'abonnement à this.route.params
    this.router.navigate([this.baseRoute, section.id]);
  }
}