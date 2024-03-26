import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailDescriptionComponent } from './detail-description.component';

describe('DetailDescriptionComponent', () => {
  let component: DetailDescriptionComponent;
  let fixture: ComponentFixture<DetailDescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailDescriptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetailDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
