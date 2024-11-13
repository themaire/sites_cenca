import { TestBed } from '@angular/core/testing';

import { RGPDtarteaucitronService } from './rgpdtarteaucitron.service';

describe('RGPDtarteaucitronService', () => {
  let service: RGPDtarteaucitronService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RGPDtarteaucitronService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
