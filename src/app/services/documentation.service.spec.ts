import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DocumentationService } from './documentation.service';

describe('DocumentationService', () => {
  let service: DocumentationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DocumentationService]
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

  it('should return sections list', (done) => {
    service.getSections().subscribe(sections => {
      expect(sections).toBeInstanceOf(Array);
      expect(sections.length).toBeGreaterThan(0);
      done();
    });
  });

  it('should find section by id', (done) => {
    service.getSection('getting-started').subscribe(section => {
      expect(section).toBeDefined();
      expect(section?.id).toBe('getting-started');
      done();
    });
  });

  it('should filter sections by authentication status', (done) => {
    // Test avec utilisateur non connecté
    service.getSections(false).subscribe(sections => {
      expect(sections.length).toBe(2); // Seulement les sections publiques
      expect(sections.every(s => !s.requireAuth)).toBe(true);
      
      // Test avec utilisateur connecté
      service.getSections(true).subscribe(authenticatedSections => {
        expect(authenticatedSections.length).toBe(3); // Toutes les sections
        done();
      });
    });
  });

  it('should load markdown file and convert to HTML', () => {
    const mockMarkdown = '# Test\nThis is a test.';
    
    service.loadMarkdownFile('test.md').subscribe(html => {
      expect(html).toContain('<h1>');
      expect(html).toContain('Test');
    });

    const req = httpMock.expectOne('/assets/docs/test.md');
    expect(req.request.method).toBe('GET');
    req.flush(mockMarkdown);
  });
});