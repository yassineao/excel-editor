import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Spreadsheet } from './spreadsheet';
import { Sheet } from '../../models/sheets.model';
import { vi } from 'vitest';

describe('Spreadsheet', () => {
  let component: Spreadsheet;
  let fixture: ComponentFixture<Spreadsheet>;

  beforeEach(async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(544);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return { height: 48, width: this.matches('th') ? 112 : 160 } as DOMRect;
    });
    await TestBed.configureTestingModule({
      imports: [Spreadsheet],
    }).compileComponents();

    fixture = TestBed.createComponent(Spreadsheet);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('sheet', {
      id: '1', name: 'First', rows: 2, columns: 3, cells: new Map(),
    } satisfies Sheet);
    await fixture.whenStable();
  });

  afterEach(() => vi.restoreAllMocks());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('initializes dimension signals from rendered elements', () => {
    expect(component.grid.rowHeight()).toBe(48);
    expect(component.grid.headerHeight()).toBe(48);
    expect(component.grid.rowHeaderWidth()).toBe(112);
    expect(component.grid.defaultColumnWidth()).toBe(160);
    expect(component.tableWidth()).toBe(112 + 26 * 160);
  });

  it('tracks horizontal and vertical render starts independently', async () => {
    const viewport: HTMLElement = fixture.nativeElement.querySelector('#spreadsheet');
    viewport.scrollLeft = component.grid.defaultColumnWidth() * 12;
    viewport.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();
    expect(component.grid.firstVisibleCols()).toBe(8);
    expect(component.grid.firstVisibleRow()).toBe(0);

    viewport.scrollTop = component.grid.rowHeight() * 24;
    viewport.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();
    expect(component.grid.firstVisibleRow()).toBe(18);
    expect(component.grid.firstVisibleCols()).toBe(8);

    viewport.scrollLeft = 0;
    viewport.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();
    expect(component.grid.firstVisibleCols()).toBe(0);
    expect(component.grid.firstVisibleRow()).toBe(18);
  });

  it('renders a limited column range and accounts for resized offscreen columns', async () => {
    const viewport: HTMLElement = fixture.nativeElement.querySelector('#spreadsheet');
    expect(fixture.nativeElement.querySelector('[aria-label="Cell 0-25"]')).toBeNull();
    component.columnWidths.set({ 0: 320, 20: 240 });
    await fixture.whenStable();
    viewport.scrollLeft = 320 + 19 * 160;
    viewport.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();
    expect(component.grid.firstVisibleCols()).toBe(16);
    expect(component.grid.leftSpacerWidth()).toBe(320 + 15 * 160);
    expect(fixture.nativeElement.querySelector('[aria-label="Cell 0-0"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Cell 0-20"]')).not.toBeNull();
    viewport.scrollLeft = 0;
    viewport.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();
    expect(component.grid.firstVisibleCols()).toBe(0);
    expect(fixture.nativeElement.querySelector('[aria-label="Cell 0-0"]')).not.toBeNull();
  });

  it('keeps ranges stable during small scrolls and avoids layout reads when replacing cells', async () => {
    const viewport: HTMLElement = fixture.nativeElement.querySelector('#spreadsheet');
    const rows = component.grid.visibleRows();
    const cols = component.grid.visibleCols();
    const measure = vi.mocked(HTMLElement.prototype.getBoundingClientRect);
    measure.mockClear();
    const width = vi.spyOn(viewport, 'clientWidth', 'get');
    const height = vi.spyOn(viewport, 'clientHeight', 'get');
    width.mockClear();
    height.mockClear();
    for (let pixel = 1; pixel <= 20; pixel++) {
      viewport.scrollLeft = pixel;
      viewport.scrollTop = pixel;
      viewport.dispatchEvent(new Event('scroll'));
      await fixture.whenStable();
    }
    expect(component.grid.visibleRows()).toBe(rows);
    expect(component.grid.visibleCols()).toBe(cols);
    viewport.scrollLeft = 160 * 16;
    viewport.scrollTop = 48 * 24;
    viewport.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();
    expect(component.grid.firstVisibleCols()).toBe(12);
    expect(component.grid.firstVisibleRow()).toBe(18);
    expect(measure).not.toHaveBeenCalled();
    expect(width).not.toHaveBeenCalled();
    expect(height).not.toHaveBeenCalled();
  });

  it('updates visible geometry when a column is resized without scrolling', async () => {
    const previousEnd = component.grid.visibleCols().at(-1)!;
    component.columnWidths.set({ 0: 640 });
    await fixture.whenStable();
    expect(component.grid.visibleCols().at(-1)!).toBeLessThan(previousEnd);
    expect(component.tableWidth()).toBe(112 + 25 * 160 + 640);
  });

  it('displays column A and labels beyond Z', () => {
    component.selectCell(0, 0);
    expect(component.selectedCellPosition()).toBe('Row 1, Col A');
    expect(component.getColumnLetter(25)).toBe('Z');
    expect(component.getColumnLetter(26)).toBe('AA');
    expect(component.getColumnLetter(51)).toBe('AZ');
    expect(component.getColumnLetter(52)).toBe('BA');
    expect(component.getColumnLetter(702)).toBe('AAA');
  });

  it('preserves selection on same-sheet refresh and clears it on switching sheets', async () => {
    component.selectCell(1, 2);
    fixture.componentRef.setInput('sheet', { ...component.sheet() });
    await fixture.whenStable();
    expect(component.selectedCell()).toEqual({ row: 1, col: 2 });
    fixture.componentRef.setInput('sheet', { ...component.sheet(), id: 'other', cells: new Map() });
    await fixture.whenStable();
    expect(component.selectedCell()).toBeUndefined();
    expect(component.selectedCellValue()).toBe('');
  });

  it('keeps selection on the same cell after inserting and deleting before it', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    try {
      component.updateCell(2, 2, 'Selected');
      component.selectCell(2, 2);
      component.updateRow(1, 1);
      component.updateCol(1, 1);
      expect(component.selectedCell()).toEqual({ row: 3, col: 3 });
      expect(component.selectedCellValue()).toBe('Selected');
      component.updateRow(1, -1);
      component.updateCol(1, -1);
      expect(component.selectedCell()).toEqual({ row: 2, col: 2 });
      expect(component.selectedCellValue()).toBe('Selected');
      component.updateRow(2, -1);
      expect(component.selectedCell()).toBeUndefined();
      component.selectCell(0, 2);
      component.updateCol(2, -1);
      expect(component.selectedCell()).toBeUndefined();
    } finally {
      confirm.mockRestore();
    }
  });

  it('renders only valid cell positions, including the last cell', async () => {
    const inputs: NodeListOf<HTMLInputElement> = fixture.nativeElement.querySelectorAll('td input');
    expect(inputs.length).toBeLessThan(1000);
    expect(component.sheet().rows).toBe(1000);
    expect(component.sheet().columns).toBe(26);
    const viewport: HTMLElement = fixture.nativeElement.querySelector('#spreadsheet');
    viewport.scrollLeft = component.tableWidth()! - 800;
    viewport.scrollTop = 1000 * component.grid.rowHeight() - 500;
    viewport.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();
    const lastCell: HTMLInputElement = fixture.nativeElement.querySelector('[aria-label="Cell 999-25"]');
    expect(lastCell).not.toBeNull();
    lastCell.dispatchEvent(new Event('focus'));
    lastCell.value = 'Last cell';
    lastCell.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(component.selectedCellPosition()).toBe('Row 1000, Col Z');
    expect(component.sheet().cells.get('999,25')?.value).toBe('Last cell');
    viewport.scrollTop = 0;
    viewport.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[aria-label="Cell 999-25"]')).toBeNull();
    viewport.scrollLeft = component.tableWidth()! - 800;
    viewport.scrollTop = 1000 * component.grid.rowHeight() - 500;
    viewport.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[aria-label="Cell 999-25"]').value).toBe('Last cell');
  });

  it('preserves larger sheets and their existing values', async () => {
    const larger: Sheet = {
      id: 'large', name: 'Large', rows: 1001, columns: 27,
      cells: new Map(component.sheet().cells),
    };
    fixture.componentRef.setInput('sheet', larger);
    await fixture.whenStable();
    component.updateCell(11, 7, 'Keep me');
    component.commitChanges();
    expect(component.grid.rows().length).toBe(1001);
    expect(component.grid.cols().length).toBe(27);
    expect(larger.cells.get('11,7')?.value).toBe('Keep me');
  });

  it('restores minimum dimensions after deleting a row or column', () => {
    component.sheetService().deleteRow(0);
    component.sheetService().deleteCol(0);
    component.commitChanges();
    expect(component.sheet().rows).toBe(1000);
    expect(component.sheet().columns).toBe(26);
    expect(() => component.selectCell(9, 4)).not.toThrow();
  });

  it('uses the current input sheet after switching sheets', () => {
    const first = component.sheet();
    component.sheetService().renameSheet('Renamed');
    expect(first.name).toBe('Renamed');
    const second: Sheet = { id: '2', name: 'Second', rows: 1, columns: 1, cells: new Map() };
    fixture.componentRef.setInput('sheet', second);
    component.sheetService().renameSheet('Current');
    expect(second.name).toBe('Current');
    expect(first.name).toBe('Renamed');
  });

  it('writes edited cell values to the input sheet', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('td input');
    input.value = 'Hello';
    input.dispatchEvent(new Event('input'));
    expect(component.sheet().cells.get('0,0')?.value).toBe('Hello');
  });

  it('keeps the formula field and selected cell in sync while typing', async () => {
    const cell: HTMLInputElement = fixture.nativeElement.querySelector('td input');
    const formula: HTMLInputElement = fixture.nativeElement.querySelector('#formula');
    cell.dispatchEvent(new Event('focus'));
    cell.value = 'Hello';
    cell.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(formula.value).toBe('Hello');

    formula.value = 'Updated';
    formula.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(cell.value).toBe('Updated');
    expect(component.sheet().cells.get('0,0')?.value).toBe('Updated');

    formula.value = '';
    formula.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(cell.value).toBe('');
    expect(component.sheet().cells.has('0,0')).toBe(false);
  });

});
