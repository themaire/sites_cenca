import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';

import { NewsComponent } from './news.component';
import { NewsService } from '../../shared/services/news.service';
import { News } from '../../shared/interfaces/news';

describe('NewsComponent', () => {
  let component: NewsComponent;
  let fixture: ComponentFixture<NewsComponent>;
  let newsServiceSpy: jasmine.SpyObj<NewsService>;

  const mockNews: News[] = [
    { id: 1, titre: 'Titre test', resume: 'Résumé test', date_publication: '2026-07-01' },
  ];

  beforeEach(async () => {
    newsServiceSpy = jasmine.createSpyObj('NewsService', ['getNews']);

    await TestBed.configureTestingModule({
      imports: [NewsComponent],
      providers: [{ provide: NewsService, useValue: newsServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(NewsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    newsServiceSpy.getNews.and.resolveTo([]);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display the news returned by the service', fakeAsync(() => {
    newsServiceSpy.getNews.and.resolveTo(mockNews);
    fixture.detectChanges();
    flush();
    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(component.error).toBeFalse();
    expect(component.news.length).toBe(1);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Titre test');
  }));

  it('should fail gracefully when the backend endpoint is unavailable', fakeAsync(() => {
    newsServiceSpy.getNews.and.rejectWith(new Error('404 Not Found'));
    expect(() => fixture.detectChanges()).not.toThrow();
    flush();
    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(component.error).toBeTrue();
    expect(component.news.length).toBe(0);
    const newsBlock = (fixture.nativeElement as HTMLElement).querySelector('.news');
    expect(newsBlock).toBeNull();
  }));
});
