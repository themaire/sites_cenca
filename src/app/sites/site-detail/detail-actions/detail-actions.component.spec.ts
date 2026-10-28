import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailActionsComponent } from './detail-actions.component';

describe('DetailOperationsComponent', () => {
  let component: DetailActionsComponent;
  let fixture: ComponentFixture<DetailActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailActionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetailActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
