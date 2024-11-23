import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FonDemandesComponent } from './fon-extractions.component';

describe('FonDemandesComponent', () => {
  let component: FonDemandesComponent;
  let fixture: ComponentFixture<FonDemandesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FonDemandesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FonDemandesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
