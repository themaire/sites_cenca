import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DocumentationService } from './documentation.service';
import { LoginService } from '../login/login.service';

describe('DocumentationService', () => {
  let service: DocumentationService;
  let httpMock: HttpTestingController;
  let mockLoginService: jasmine.SpyObj<LoginService>;

  const index = {
    categories: [
      {
        id: 'utilisateur',
        title: 'Documentation utilisateur',
        sections: [
          { id: 'index', title: 'Accueil', path: 'index.md', order: 1, published: true, requireAuth: false },
          { id: 'sites', title: 'Sites', path: 'sites.md', order: 2, published: true, requireAuth: true },
          { id: 'chiro', title: 'Chiro', path: 'chiro.md', order: 3, published: true, requireAuth: true, droit: 'chiro' },
          { id: 'brouillon', title: 'Brouillon', path: 'brouillon.md', order: 4, published: false, requireAuth: false }
        ]
      },
      {
        id: 'admin',
        title: 'Documentation administrateur',
        droit: 'admin',
        sections: [
          { id: 'auth', title: 'Auth', path: 'auth.md', order: 1, published: true, requireAuth: true }
        ]
      }
    ]
  };

  const droits = (admin: boolean, chiro: boolean) => {
    mockLoginService.isAdmin.and.returnValue(admin);
    mockLoginService.isChiro.and.returnValue(chiro);
  };

  const charger = (isAuthenticated: boolean, done: (ids: string[], cats: string[]) => void) => {
    service.getHierarchicalSections(isAuthenticated).subscribe(categories => {
      done(categories.flatMap(c => c.sections.map(s => s.id)), categories.map(c => c.id));
    });
    httpMock.expectOne('/assets/docs/index.hierarchical.json').flush(index);
  };

  beforeEach(() => {
    mockLoginService = jasmine.createSpyObj('LoginService', ['isAdmin', 'isCadre', 'isEdit', 'isChiro', 'isFoncier']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DocumentationService, { provide: LoginService, useValue: mockLoginService }]
    });
    service = TestBed.inject(DocumentationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('ne montre que les fiches publiques à un visiteur non connecté', () => {
    droits(false, false);
    charger(false, (ids, cats) => {
      expect(ids).toEqual(['index']);
      expect(cats).toEqual(['utilisateur']);
    });
  });

  it('masque les fiches à droit et non publiées à un utilisateur connecté sans droit', () => {
    droits(false, false);
    charger(true, ids => expect(ids).toEqual(['index', 'sites']));
  });

  it('montre la fiche chiro à un membre du groupe chiro, sans la documentation admin', () => {
    droits(false, true);
    charger(true, (ids, cats) => {
      expect(ids).toEqual(['index', 'sites', 'chiro']);
      expect(cats).not.toContain('admin');
    });
  });

  it("montre la documentation admin à un administrateur", () => {
    droits(true, true);
    charger(true, (ids, cats) => {
      expect(cats).toEqual(['utilisateur', 'admin']);
      expect(ids).toContain('auth');
    });
  });

  it('should load markdown file and convert to HTML', () => {
    service.loadMarkdownFile('test.md').subscribe(html => {
      expect(html).toContain('<h1>');
      expect(html).toContain('Test');
    });

    const req = httpMock.expectOne('/assets/docs/test.md');
    expect(req.request.method).toBe('GET');
    req.flush('# Test\nThis is a test.');
  });
});
