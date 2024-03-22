import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SitesResearchComponent } from './sites-research.component';

describe('SitesResearchComponent', () => {
  let component: SitesResearchComponent;
  let fixture: ComponentFixture<SitesResearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SitesResearchComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SitesResearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
