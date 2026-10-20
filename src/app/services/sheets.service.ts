import { Sheet } from '../models/sheets.model';
import { Cell } from '../models/cells.model';
export class SheetService {
  constructor(private readonly sheet: Sheet) {}

  addRow(index: number): void {
    this.validateIndex(index, this.sheet.rows, true);
    this.shiftCells('R', index, 1);
    this.sheet.rows++;
  }

  deleteRow(index: number): void {
    this.validateIndex(index, this.sheet.rows);
    this.shiftCells('R', index, -1);
    this.sheet.rows--;
  }

  addCol(index: number): void {
    this.validateIndex(index, this.sheet.columns, true);
    this.shiftCells('C', index, 1);
    this.sheet.columns++;
  }

  deleteCol(index: number): void {
    this.validateIndex(index, this.sheet.columns);
    this.shiftCells('C', index, -1);
    this.sheet.columns--;
  }

  renameSheet(name: string): void {
    this.sheet.name = name;
  }

  emptyRowOrColumn(index: number, type: 'C' | 'R'): void {
    this.validateIndex(index, type === 'R' ? this.sheet.rows : this.sheet.columns);
    for (const key of this.sheet.cells.keys()) {
      const [row, col] = key.split(',').map(Number);
      if ((type === 'R' ? row : col) === index) {
        this.sheet.cells.delete(key);
      }
    }
  }

  private validateIndex(index: number, size: number, inserting = false): void {
    if (!Number.isInteger(index) || index < 0 || index > size || (!inserting && index === size)) {
      throw new Error('Ungültiger Zeilen- oder Spaltenindex');
    }
  }

  //Changing the posiotion of each cell based on type adn offset
  //type : C (column) R (Row)
  //offset : 1 to add -1 to delete
  private shiftCells(type: 'R' | 'C', index: number, offset: 1 | -1): void {
    const shifted = new Map<string, Cell>();
    for (const [key, cell] of this.sheet.cells) {
      // get the row and column from string
      let [row, col] = key.split(',').map(Number);
      const position = type === 'R' ? row : col;
      // skip the position in an index to be deleted
      if (offset === -1 && position === index) {
        continue;
      }
      if (position >= index) {
        if (type === 'R') {
          row += offset;
        } else {
          col += offset;
        }
      }
      shifted.set(`${row},${col}`, cell);
    }

    this.sheet.cells.clear();
    for (const [key, cell] of shifted) {
      this.sheet.cells.set(key, cell);
    }
  }
}
