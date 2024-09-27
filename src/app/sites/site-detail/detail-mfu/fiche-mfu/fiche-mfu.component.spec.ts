import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FicheMfuComponent } from './fiche-mfu.component';

describe('FicheMfuComponent', () => {
  let component: FicheMfuComponent;
  let fixture: ComponentFixture<FicheMfuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FicheMfuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FicheMfuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
