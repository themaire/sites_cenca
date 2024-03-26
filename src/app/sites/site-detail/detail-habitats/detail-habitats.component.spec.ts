import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailHabitatsComponent } from './detail-habitats.component';

describe('DetailHabitatsComponent', () => {
  let component: DetailHabitatsComponent;
  let fixture: ComponentFixture<DetailHabitatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailHabitatsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetailHabitatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
