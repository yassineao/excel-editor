import { Sheet } from '../models/sheets.model';
import { CellsService } from './cells.service';
import { SheetService } from './sheets.service';

describe('Map-based sheet services', () => {
  let sheet: Sheet;
  let cells: CellsService;
  let sheets: SheetService;

  beforeEach(() => {
    sheet = { id: '1', name: 'Sheet', rows: 2, columns: 3, cells: new Map() };
    cells = new CellsService(sheet);
    sheets = new SheetService(sheet);
  });

  it('stores zero and false, and removes empty values', () => {
    cells.updateCell(0, 0, { value: 0 });
    cells.updateCell(0, 1, { value: false });
    expect(cells.getCell(0, 0)?.value).toBe(0);
    expect(cells.getCell(0, 1)?.value).toBe(false);
    cells.updateCell(0, 0, { value: '' });
    cells.updateCell(0, 1, { value: null });
    expect(sheet.cells.size).toBe(0);
    expect(cells.getCell(1, 2)).toBeUndefined();
  });

  it('shifts cells on insertion without overwriting adjacent values', () => {
    cells.updateCell(0, 1, { value: 'A' });
    cells.updateCell(1, 1, { value: 'B' });
    sheets.addRow(0);
    sheets.addCol(1);
    expect(cells.getCell(1, 2)?.value).toBe('A');
    expect(cells.getCell(2, 2)?.value).toBe('B');
    expect(sheet.rows).toBe(3);
    expect(sheet.columns).toBe(4);
    expect(sheet.cells.size).toBe(2);
  });

  it('removes deleted cells and shifts remaining coordinates', () => {
    cells.updateCell(0, 0, { value: 'deleted row' });
    cells.updateCell(1, 1, { value: 'deleted column' });
    cells.updateCell(1, 2, { value: 'keep' });
    sheets.deleteRow(0);
    sheets.deleteCol(1);
    expect(cells.getCell(0, 1)?.value).toBe('keep');
    expect(sheet.cells.size).toBe(1);
    expect(sheet.rows).toBe(1);
    expect(sheet.columns).toBe(2);
  });

  it('allows appending and inserting into an empty sheet', () => {
    sheets.addRow(sheet.rows);
    sheets.addCol(sheet.columns);
    expect(sheet.rows).toBe(3);
    expect(sheet.columns).toBe(4);
    sheet.rows = 0;
    sheet.columns = 0;
    sheets.addRow(0);
    sheets.addCol(0);
    cells.updateCell(0, 0, { value: 'first' });
    expect(cells.getCell(0, 0)?.value).toBe('first');
  });

  it('clears only the selected row or column and preserves dimensions', () => {
    cells.updateCell(0, 0, { value: 'A' });
    cells.updateCell(1, 1, { value: 'B' });
    sheets.emptyRowOrColumn(0, 'R');
    expect(cells.getCell(1, 1)?.value).toBe('B');
    sheets.emptyRowOrColumn(1, 'C');
    expect(sheet.cells.size).toBe(0);
    expect(sheet.rows).toBe(2);
    expect(sheet.columns).toBe(3);
  });

  it('rejects invalid indices without changing data', () => {
    for (const index of [-1, 0.5, NaN, Infinity]) {
      expect(() => sheets.addRow(index)).toThrow();
      expect(() => sheets.deleteCol(index)).toThrow();
      expect(() => cells.getCell(index, 0)).toThrow();
    }
    expect(() => sheets.deleteRow(sheet.rows)).toThrow();
    expect(() => sheets.addCol(sheet.columns + 1)).toThrow();
    expect(() => cells.updateCell(0, sheet.columns, { value: 'outside' })).toThrow();
    expect(sheet.cells.size).toBe(0);
  });
});
