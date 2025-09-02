import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailPmfuComponent } from './detail-pmfu.component';

describe('DetailPmfuComponent', () => {
  let component: DetailPmfuComponent;
  let fixture: ComponentFixture<DetailPmfuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailPmfuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailPmfuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
