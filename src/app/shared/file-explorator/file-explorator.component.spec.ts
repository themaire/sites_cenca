import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileExploratorComponent } from './file-explorator.component';

describe('FileExploratorComponent', () => {
  let component: FileExploratorComponent;
  let fixture: ComponentFixture<FileExploratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileExploratorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileExploratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
