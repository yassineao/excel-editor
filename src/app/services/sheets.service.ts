import { Sheet } from '../models/sheets.model';
import { Cell } from '../models/cells.model';

export class SheetService {
  sheets: Sheet;

  constructor(sheets: Sheet) {
    this.sheets = sheets;
  }

  //  adding a row in defined index to sheet
  addRow(index: number): void {
    const cells = this.sheets.cells;

    if (!Number.isInteger(index) || index < 0 || index >= this.sheets.rows) {
      throw new Error('Ungültiger Zeilenindex');
    }

    //initializing the row
    const newRow: Cell[] = Array.from({ length: this.sheets.columns }, (_, col) => ({
      value: '',
    }));

    cells.splice(index, 0, newRow);
    this.sheets.rows++;
  }

  //deleting row at index of sheet
  deleteRow(index: number): void {
    if (this.sheets.rows <= index) {
      throw new Error("Can't delete more rows");
    }

    this.sheets.cells.splice(index, 1);
    this.sheets.rows--;
  }

  // Initialize a new cell in each row
  addCol(index: number): void {
    const cells = this.sheets.cells;

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index > cells.length ||
      index >= this.sheets.rows
    ) {
      throw new Error('Ungültiger Zeilenindex');
    }

    cells.forEach((row) => {
      row.splice(index, 0, { value: '' });
    });

    this.sheets.columns++;
  }

  //deleting column at index of sheet
  deleteCol(index: number): void {
    if (this.sheets.columns <= index) {
      throw new Error("Can't delete more columns");
    }
    const cells = this.sheets.cells;

    this.sheets.cells.forEach(
      (row) => {
        row.splice(index, 1);
      }
    );
    this.sheets.columns--;
  }

  // emptying a row or column based on type
  // C = Column (Spalte)
  // R = Row (Zeile)
  emptyRowOrColumn(index: number, type: string): void {
    if (type === 'C') {
      this.sheets.cells.forEach((row) => {
        if (row[index]) {
          row[index].value = '';
        }
      });
    } else if (type === 'R') {
      this.sheets.cells[index]?.forEach((cell) => {
        cell.value = '';
      });
    }
  }
}
