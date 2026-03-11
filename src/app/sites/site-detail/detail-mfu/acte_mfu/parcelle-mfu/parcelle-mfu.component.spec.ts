import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParcelleMfuComponent } from './parcelle-mfu.component';

describe('ParcelleMfuComponent', () => {
  let component: ParcelleMfuComponent;
  let fixture: ComponentFixture<ParcelleMfuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParcelleMfuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParcelleMfuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
