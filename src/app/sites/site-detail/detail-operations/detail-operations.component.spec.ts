import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailOperationsComponent } from './detail-operations.component';

describe('DetailOperationsComponent', () => {
  let component: DetailOperationsComponent;
  let fixture: ComponentFixture<DetailOperationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailOperationsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetailOperationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
