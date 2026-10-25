import { Cell } from '../models/cells.model';
import { Sheet } from '../models/sheets.model';
import { getCellType, Type } from '../models/type';
export class CellsService {
  constructor(private readonly sheet: Sheet) {}

  getCell(row: number, col: number): Cell | undefined {
    return this.sheet.cells.get(this.key(row, col));
  }

  updateCell(
    row: number,
    col: number,
    cell: Omit<Cell, 'type'> & { type?: Type },
    type: Type = cell.type ?? getCellType(cell.value),
  ): void {
    const key = this.key(row, col);
    if (cell.value === '' || cell.value === null) {
      this.sheet.cells.delete(key);
    } else {
      this.sheet.cells.set(key, { ...cell, type });
    }
  }

  private key(row: number, col: number): string {
    if (
      !Number.isInteger(row) ||
      !Number.isInteger(col) ||
      row < 0 ||
      col < 0 ||
      row >= this.sheet.rows ||
      col >= this.sheet.columns
    ) {
      throw new Error('Ungültige Zellposition');
    }
    return `${row},${col}`;
  }
}
