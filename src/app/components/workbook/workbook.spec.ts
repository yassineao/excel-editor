import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { Workbook } from './workbook';
import { WorkBooksService } from '../../services/workBook.service';

describe('Workbook', () => {
  let component: Workbook;
  let fixture: ComponentFixture<Workbook>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Workbook],
    }).compileComponents();

    vi.spyOn(TestBed.inject(WorkBooksService), 'loadWorkbook').mockImplementation(() => {});
    fixture = TestBed.createComponent(Workbook);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(TestBed.inject(WorkBooksService).loadWorkbook).toHaveBeenCalledOnce();
  });

  it('saves the workbook when Speichern is clicked', () => {
    const save = vi.spyOn(TestBed.inject(WorkBooksService), 'saveWorkbook').mockImplementation(() => {});
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('app-toolbar button')) as HTMLButtonElement[];
    const button = buttons.find(button => button.textContent?.trim() === 'Speichern');
    expect(button).toBeDefined();
    button!.click();
    expect(save).toHaveBeenCalledOnce();
  });

  it('saves two seconds after the last cell edit', () => {
    vi.useFakeTimers();
    const save = vi.spyOn(TestBed.inject(WorkBooksService), 'saveWorkbook').mockImplementation(() => {});
    try {
      const input: HTMLInputElement = fixture.nativeElement.querySelector('td input');
      input.value = 'First';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(1000);
      input.value = 'Latest';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(1999);
      expect(save).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(save).toHaveBeenCalledOnce();
      expect(TestBed.inject(WorkBooksService).currentSheet()?.cells.get('0,0')?.value).toBe('Latest');
    } finally {
      fixture.destroy();
      vi.useRealTimers();
    }
  });

  it('flushes a pending save when destroyed and cancels the timer', () => {
    vi.useFakeTimers();
    const save = vi.spyOn(TestBed.inject(WorkBooksService), 'saveWorkbook').mockImplementation(() => {});
    try {
      component.onCellChanged();
      fixture.destroy();
      expect(save).toHaveBeenCalledOnce();
      vi.advanceTimersByTime(2000);
      expect(save).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it('updates the displayed name when the service renames the workbook', async () => {
    const title = () => fixture.nativeElement.querySelector('#workbook-title').textContent;
    expect(title()).toBe('Workbook');
    TestBed.inject(WorkBooksService).renameWorkBook('Budget 2026');
    await fixture.whenStable();
    expect(title()).toBe('Budget 2026');
  });
});
