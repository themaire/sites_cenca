import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagePmfuComponent } from './image-pmfu.component';

describe('ImagePmfuComponent', () => {
  let component: ImagePmfuComponent;
  let fixture: ComponentFixture<ImagePmfuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImagePmfuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImagePmfuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
