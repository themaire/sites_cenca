import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailGestionComponent } from './detail-gestion.component';

describe('DetailGestionComponent', () => {
  let component: DetailGestionComponent;
  let fixture: ComponentFixture<DetailGestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailGestionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetailGestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
