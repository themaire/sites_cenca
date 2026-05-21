import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravauxComponent } from './travaux.component';

describe('TravauxComponent', () => {
  let component: TravauxComponent;
  let fixture: ComponentFixture<TravauxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravauxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TravauxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
