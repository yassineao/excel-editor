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

  it('saves when a cell edit is committed, not on each keystroke', () => {
    const save = vi.spyOn(TestBed.inject(WorkBooksService), 'saveWorkbook').mockImplementation(() => {});
    const input: HTMLInputElement = fixture.nativeElement.querySelector('td input');
    input.value = 'Latest';
    input.dispatchEvent(new Event('input'));
    expect(save).not.toHaveBeenCalled();
    input.dispatchEvent(new Event('change'));
    expect(save).toHaveBeenCalledOnce();
    expect(TestBed.inject(WorkBooksService).currentSheet()?.cells.get('0,0')?.value).toBe('Latest');
  });

  it('refreshes rows and shifted values after insertion and deletion', async () => {
    vi.spyOn(TestBed.inject(WorkBooksService), 'saveWorkbook').mockImplementation(() => {});
    const service = TestBed.inject(WorkBooksService);
    service.currentSheet()!.cells.set('0,0', { value: 'Keep' });
    const count = () => fixture.nativeElement.querySelectorAll('tbody tr').length;
    const initial = count();
    const insert: HTMLButtonElement = fixture.nativeElement.querySelector('tbody th button');
    insert.click();
    await fixture.whenStable();
    expect(count()).toBe(initial + 1);
    expect(service.currentSheet()!.cells.get('1,0')?.value).toBe('Keep');
    const remove = fixture.nativeElement.querySelectorAll('tbody th button')[1] as HTMLButtonElement;
    remove.click();
    await fixture.whenStable();
    expect(count()).toBe(initial);
    expect(service.currentSheet()!.cells.get('0,0')?.value).toBe('Keep');
  });

  it('updates the displayed name when the service renames the workbook', async () => {
    const title = () => fixture.nativeElement.querySelector('#workbook-title').textContent;
    expect(title()).toBe('Workbook');
    TestBed.inject(WorkBooksService).renameWorkBook('Budget 2026');
    await fixture.whenStable();
    expect(title()).toBe('Budget 2026');
  });
});
