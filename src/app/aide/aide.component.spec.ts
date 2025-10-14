import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { AideComponent } from './aide.component';
import { DocumentationService } from '../services/documentation.service';
import { LoginService } from '../login/login.service';

describe('AideComponent', () => {
  let component: AideComponent;
  let fixture: ComponentFixture<AideComponent>;
  let mockDocumentationService: jasmine.SpyObj<DocumentationService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockDocumentationService = jasmine.createSpyObj('DocumentationService', [
      'getSections',
      'getSection',
      'getSectionContent'
    ]);
    
    mockLoginService = jasmine.createSpyObj('LoginService', ['user']);
    mockLoginService.user.and.returnValue({ nom: 'Test', prenom: 'User', cd_salarie: 'TEST', identifiant: 'test@example.com' });
    
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    mockActivatedRoute = {
      params: of({ section: 'index' })
    };

    // Configuration des mocks
    mockDocumentationService.getSections.and.returnValue(of([
      { id: 'index', title: 'Accueil', path: 'index.md', order: 1, published: true, requireAuth: false },
      { id: 'getting-started', title: 'Guide de démarrage', path: 'getting-started.md', order: 2, published: true, requireAuth: false }
    ]));
    
    mockDocumentationService.getSection.and.returnValue(of({
      id: 'index',
      title: 'Accueil',
      path: 'index.md',
      order: 1,
      published: true,
      requireAuth: false
    }));
    
    mockDocumentationService.getSectionContent.and.returnValue(
      of('<h1>Documentation</h1><p>Contenu de test</p>')
    );

    await TestBed.configureTestingModule({
      imports: [
        AideComponent,
        HttpClientTestingModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: DocumentationService, useValue: mockDocumentationService },
        { provide: LoginService, useValue: mockLoginService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AideComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load sections on init', () => {
    fixture.detectChanges();
    expect(mockDocumentationService.getSections).toHaveBeenCalled();
    expect(component.sections.length).toBe(2);
  });

  it('should load section content', () => {
    fixture.detectChanges();
    expect(mockDocumentationService.getSectionContent).toHaveBeenCalledWith('index');
    expect(component.currentContent).toContain('<h1>Documentation</h1>');
  });

  it('devrait naviguer vers une section', () => {
    const section = { id: 'test', title: 'Test', path: 'test.md', order: 1, published: true, requireAuth: false };
    component.navigateToSection(section);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/aide', 'getting-started']);
  });

  it('should toggle sidenav', () => {
    const initialState = component.sidenavOpened;
    component.toggleSidenav();
    expect(component.sidenavOpened).toBe(!initialState);
  });
});