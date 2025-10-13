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
            <h3 matSubheader>Sections</h3>
            <a mat-list-item 
               *ngFor="let section of sections" 
               (click)="navigateToSection(section)"
               [class.active]="currentSection?.id === section.id">
              <mat-icon matListIcon>description</mat-icon>
              <span matLine>{{ section.title }}</span>
            </a>
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
  sections: DocSection[] = [];
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
  ) {}

  ngOnInit() {
    // Vérifier si l'utilisateur est connecté
    const isAuthenticated = this.loginService.user() !== null && this.loginService.user() !== undefined;
    
    // Charger les sections dynamiquement selon l'authentification
    this.documentationService.getSections(isAuthenticated).subscribe(sections => {
      this.sections = sections;
    });
    
    // Écouter les changements de route
    this.route.params.subscribe(params => {
      const sectionId = params['section'] || 'index';
      this.loadSection(sectionId);
    });
  }

  loadSection(sectionId: string) {
    this.isLoading = true;
    
    this.documentationService.getSection(sectionId).subscribe({
      next: (section) => {
        if (!section) {
          this.router.navigate([this.baseRoute, 'index']);
          return;
        }
        
        this.currentSection = section;
        
        // Charger le contenu
        this.documentationService.getSectionContent(sectionId).subscribe({
          next: (content) => {
            this.currentContent = content;
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Erreur lors du chargement de la documentation:', error);
            this.currentContent = '<p>Erreur lors du chargement de la documentation.</p>';
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la section:', error);
        this.router.navigate([this.baseRoute, 'index']);
      }
    });
  }

  navigateToSection(section: DocSection) {
    this.router.navigate([this.baseRoute, section.id]);
  }

  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
  }
}