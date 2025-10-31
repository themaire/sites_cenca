import { environment } from '../../environments/environment';
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
              <h3 matSubheader *ngIf="userGroupId === 5">{{ category.title }}</h3>
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
            
            <div *ngIf="!isLoading" 
                 class="markdown-content" 
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
  private activeUrl: string = environment.apiBaseUrl;
  userGroupId: number = 0;
  categories: DocCategory[] = [];
  currentContent: string = '';
  currentSection: DocSection | null = null;
  isLoading = false;
  sidenavOpened = true;
  baseRoute = '/aide'; // Toujours utiliser /aide
  
  constructor(
    private documentationService: DocumentationService,
    private route: ActivatedRoute,
    private router: Router,
    private loginService: LoginService
  ) {
    this.userGroupId = this.loginService.user()?.gro_id ?? 0;
  }
  
  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
  }

  ngOnInit() {
    const isAuthenticated = this.loginService.user() !== null && this.loginService.user() !== undefined;
    // Charger les catégories et sections dynamiquement
    this.documentationService.getHierarchicalSections(isAuthenticated).subscribe(categories => {
      this.categories = categories;
      // Si on est sur /aide sans section, charger la section 'index' de la première catégorie
      const currentUrl = this.router.url;
      if (currentUrl === '/aide' && categories.length > 0 && categories[0].sections.length > 0) {
        this.loadSection(categories[0].sections[0].id);
      }
    });
    // Écouter les changements de route
    this.route.params.subscribe(params => {
      const sectionId = params['section'];
      if (sectionId) {
        this.loadSection(sectionId);
      }
    });
  }

  loadSection(sectionId: string) {
    this.isLoading = true;
    const isAuthenticated = this.loginService.user() !== null && this.loginService.user() !== undefined;
    // Rechercher la section dans toutes les catégories
    let foundSection: DocSection | null = null;
    for (const category of this.categories) {
      const section = category.sections.find(s => s.id === sectionId);
      if (section) {
        foundSection = section;
        break;
      }
    }
    if (!foundSection) {
      this.router.navigate([this.baseRoute, 'index']);
      return;
    }
    this.currentSection = foundSection;
    // Charger le contenu selon la source (backend ou markdown local)
    if (foundSection.backendUrl) {
      let url = foundSection.backendUrl;
      if (!/^https?:\/\//.test(url)) {
        url = this.activeUrl.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url);
      }
      this.documentationService['http'].get(url, { responseType: 'text' }).subscribe({
        next: (content: string) => {
          this.currentContent = content;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement de la documentation backend:', error);
          this.currentContent = '<p>Erreur lors du chargement de la documentation.</p>';
          this.isLoading = false;
        }
      });
    } else if (foundSection.path) {
      this.documentationService.loadMarkdownFile(foundSection.path).subscribe({
        next: (content: string) => {
          this.currentContent = content;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement du markdown:', error);
          this.currentContent = '<p>Erreur lors du chargement de la documentation.</p>';
          this.isLoading = false;
        }
      });
    } else {
      this.currentContent = '<p>Aucun contenu disponible pour cette section.</p>';
      this.isLoading = false;
    }
  }

  navigateToSection(section: DocSection) {
    this.router.navigate([this.baseRoute, section.id]);
  };
}