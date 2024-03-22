import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SitesNavComponent } from './sites-nav.component';

describe('SitesNavComponent', () => {
  let component: SitesNavComponent;
  let fixture: ComponentFixture<SitesNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SitesNavComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SitesNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
