import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailMfuComponent } from './detail-mfu.component';

describe('DetailMfuComponent', () => {
  let component: DetailMfuComponent;
  let fixture: ComponentFixture<DetailMfuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailMfuComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetailMfuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
