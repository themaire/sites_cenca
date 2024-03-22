import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SitesDisplayComponent } from './sites-display.component';

describe('SitesDisplayComponent', () => {
  let component: SitesDisplayComponent;
  let fixture: ComponentFixture<SitesDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SitesDisplayComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SitesDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
