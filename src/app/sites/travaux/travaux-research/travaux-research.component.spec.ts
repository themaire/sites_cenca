import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravauxResearchComponent } from './travaux-research.component';

describe('TravauxResearchComponent', () => {
  let component: TravauxResearchComponent;
  let fixture: ComponentFixture<TravauxResearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravauxResearchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TravauxResearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
