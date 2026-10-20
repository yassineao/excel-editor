import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Workbook } from './workbook';
import { WorkBooksService } from '../../services/workBook.service';

describe('Workbook', () => {
  let component: Workbook;
  let fixture: ComponentFixture<Workbook>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Workbook],
    }).compileComponents();

    fixture = TestBed.createComponent(Workbook);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('updates the displayed name when the service renames the workbook', async () => {
    const title = () => fixture.nativeElement.querySelector('#workbook-title').textContent;
    expect(title()).toBe('Workbook');
    TestBed.inject(WorkBooksService).renameWorkBook('Budget 2026');
    await fixture.whenStable();
    expect(title()).toBe('Budget 2026');
  });
});
