import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionTravauxComponent } from './action_travaux.component';

describe('ActionTravauxComponent', () => {
  let component: ActionTravauxComponent;
  let fixture: ComponentFixture<ActionTravauxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionTravauxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActionTravauxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});