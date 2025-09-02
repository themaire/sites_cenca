import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FonPmfuComponent } from './fon-pmfu.component';

describe('FonPmfuComponent', () => {
  let component: FonPmfuComponent;
  let fixture: ComponentFixture<FonPmfuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FonPmfuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FonPmfuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
