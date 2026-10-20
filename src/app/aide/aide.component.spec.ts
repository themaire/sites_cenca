import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { AideComponent } from './aide.component';
import { DocCategory, DocumentationService } from '../services/documentation.service';
import { LoginService } from '../login/login.service';

describe('AideComponent', () => {
  let component: AideComponent;
  let fixture: ComponentFixture<AideComponent>;
  let mockDocumentationService: jasmine.SpyObj<DocumentationService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;
  let router: Router;

  const categories: DocCategory[] = [
    {
      id: 'utilisateur',
      title: 'Documentation utilisateur',
      sections: [
        { id: 'index', title: 'Accueil', path: 'index.md', order: 1, published: true, requireAuth: false },
        { id: 'getting-started', title: 'Guide de démarrage', path: 'getting-started.md', order: 2, published: true, requireAuth: false }
      ]
    }
  ];

  beforeEach(async () => {
    mockDocumentationService = jasmine.createSpyObj('DocumentationService', [
      'getHierarchicalSections',
      'loadSectionContent'
    ]);
    mockDocumentationService.getHierarchicalSections.and.returnValue(of(categories));
    mockDocumentationService.loadSectionContent.and.returnValue(of('<h1>Documentation</h1><p>Contenu de test</p>'));

    mockLoginService = jasmine.createSpyObj('LoginService', ['user', 'getUsers']);
    mockLoginService.user.and.returnValue({ nom: 'Test', prenom: 'User', groups: [1] } as any);

    await TestBed.configureTestingModule({
      imports: [AideComponent, BrowserAnimationsModule],
      providers: [
        { provide: DocumentationService, useValue: mockDocumentationService },
        { provide: LoginService, useValue: mockLoginService },
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { params: of({ section: 'index' }), snapshot: { params: { section: 'index' } } } }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture = TestBed.createComponent(AideComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('charge les catégories puis la fiche demandée dans l\'URL', () => {
    fixture.detectChanges();
    expect(mockDocumentationService.getHierarchicalSections).toHaveBeenCalledWith(true);
    expect(component.categories.length).toBe(1);
    expect(mockDocumentationService.loadSectionContent).toHaveBeenCalledWith(categories[0].sections[0]);
    expect(component.currentContent).toContain('<h1>Documentation</h1>');
  });

  it('invite un visiteur non connecté à se connecter, sans charger de fiche', () => {
    mockLoginService.user.and.returnValue(null);
    fixture.detectChanges();
    expect(component.connecte).toBeFalse();
    expect(mockDocumentationService.getHierarchicalSections).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Se connecter');
  });

  it('affiche « Section introuvable » pour une fiche non accessible', () => {
    fixture.detectChanges();
    component.loadSection('fiche-admin');
    expect(component.currentContent).toContain('Section introuvable');
  });

  it('navigue vers une section', () => {
    component.navigateToSection(categories[0].sections[1]);
    expect(router.navigate).toHaveBeenCalledWith(['/aide', 'getting-started']);
  });

  it('should toggle sidenav', () => {
    const initialState = component.sidenavOpened;
    component.toggleSidenav();
    expect(component.sidenavOpened).toBe(!initialState);
  });
});
