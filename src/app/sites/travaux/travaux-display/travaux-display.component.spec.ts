import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravauxDisplayComponent } from './travaux-display.component';

describe('TravauxDisplayComponent', () => {
  let component: TravauxDisplayComponent;
  let fixture: ComponentFixture<TravauxDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravauxDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TravauxDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
