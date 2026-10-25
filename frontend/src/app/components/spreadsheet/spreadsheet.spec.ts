import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Spreadsheet } from './spreadsheet';
import { Sheet } from '../../models/sheets.model';
import { vi } from 'vitest';

describe('Spreadsheet', () => {
  let component: Spreadsheet;
  let fixture: ComponentFixture<Spreadsheet>;

  beforeEach(async () => {
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

  it('should create', () => {
    expect(component).toBeTruthy();
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
    expect(inputs.length).toBe(50);
    expect(component.sheet().rows).toBe(10);
    expect(component.sheet().columns).toBe(5);
    const lastCell = inputs[inputs.length - 1];
    lastCell.dispatchEvent(new Event('focus'));
    lastCell.value = 'Last cell';
    lastCell.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(component.selectedCellPosition()).toBe('Row 10, Col E');
    expect(component.sheet().cells.get('9,4')?.value).toBe('Last cell');
  });

  it('preserves larger sheets and their existing values', async () => {
    const larger: Sheet = {
      id: 'large', name: 'Large', rows: 12, columns: 8,
      cells: new Map(component.sheet().cells),
    };
    fixture.componentRef.setInput('sheet', larger);
    await fixture.whenStable();
    component.updateCell(11, 7, 'Keep me');
    component.commitChanges();
    expect(component.rows().length).toBe(12);
    expect(component.cols().length).toBe(8);
    expect(larger.cells.get('11,7')?.value).toBe('Keep me');
  });

  it('restores minimum dimensions after deleting a row or column', () => {
    component.sheetService().deleteRow(0);
    component.sheetService().deleteCol(0);
    component.commitChanges();
    expect(component.sheet().rows).toBe(10);
    expect(component.sheet().columns).toBe(5);
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
