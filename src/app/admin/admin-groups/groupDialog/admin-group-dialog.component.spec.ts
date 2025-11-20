import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminGroupDialogComponent } from './admin-group-dialog.component';

describe('AdminGroupDialogComponent', () => {
  let component: AdminGroupDialogComponent;
  let fixture: ComponentFixture<AdminGroupDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminGroupDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
