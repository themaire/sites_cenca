import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailExtractionComponent } from './detail-extraction.component';

describe('DetailExtractionComponent', () => {
  let component: DetailExtractionComponent;
  let fixture: ComponentFixture<DetailExtractionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailExtractionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailExtractionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
