import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjetVComponent } from './projetV.component';

describe('ProjetVComponent', () => {
  let component: ProjetVComponent;
  let fixture: ComponentFixture<ProjetVComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjetVComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjetVComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});