import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjetsSearchComponent } from './projets-search.component';

describe('ProjetsSearchComponent', () => {
  let component: ProjetsSearchComponent;
  let fixture: ComponentFixture<ProjetsSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjetsSearchComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjetsSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
