import { Component, computed, input, OnChanges, output, signal, SimpleChanges } from '@angular/core';
import { Sheet } from '../../models/sheets.model';
import { SheetService } from '../../services/sheets.service';
import { CellsService } from '../../services/cells.service';
import { getCellType } from '../../models/type';

@Component({
  selector: 'app-spreadsheet',
  templateUrl: './spreadsheet.html',
  host: { class: 'block min-w-0' },
})
export class Spreadsheet implements OnChanges {
  sheet = input.required<Sheet>();
  readonly selectedCell = signal<
    | {
        row: number;
        col: number;
      }
    | undefined
  >(undefined);
  readonly sheetChanged = output<Sheet>();
  readonly sheetService = computed(() => new SheetService(this.sheet()));
  readonly cellsService = computed(() => new CellsService(this.sheet()));
  private readonly dimensions = signal({ rows: 10, columns: 5 });
  rows = computed(() => Array.from({ length: this.dimensions().rows }, (_, i) => i));
  cols = computed(() => Array.from({ length: this.dimensions().columns }, (_, i) => i));

  ngOnChanges(changes: SimpleChanges): void {
    this.ensureMinimumSize();
    const change = changes['sheet'];
    if (change && change.previousValue?.id !== change.currentValue.id) {
      this.selectedCell.set(undefined);
    }
    const selected = this.selectedCell();
    if (selected && (selected.row >= this.sheet().rows || selected.col >= this.sheet().columns)) {
      this.selectedCell.set(undefined);
    }
  }

  // make the minimum size of a file 5 by 10
  private ensureMinimumSize(): void {
    const sheet = this.sheet();
    sheet.rows = Math.max(10, sheet.rows);
    sheet.columns = Math.max(5, sheet.columns);
    this.dimensions.set({ rows: sheet.rows, columns: sheet.columns });
  }

  //make the selected cell get a new value in the format input
  selectedCellValue(): string | number | boolean {
    const selected = this.selectedCell();
    return selected ? (this.sheet().cells.get(`${selected.row},${selected.col}`)?.value ?? '') : '';
  }

  //get the cell position
  selectedCellPosition(): string {
    const selected = this.selectedCell();
    return selected
      ? `Row ${selected.row + 1}, Col ${this.getColumnLetter(selected.col)}`
      : '';
  }

  //update the selected cell in the table
  updateSelectedCell(value: string | number | boolean | null): void {
    const selected = this.selectedCell();
    if (selected) {
      this.updateCell(selected.row, selected.col, value);
    }
  }

  //updating the cell value and type in the sheet
  updateCell(row: number, col: number, value: string | number | boolean | null): void {
    const type = getCellType(value);
    this.cellsService().updateCell(row, col, { value }, type);
    const selected = this.selectedCell();
    if (selected?.row === row && selected.col === col) {
      this.selectCell(row, col);
    }
  }

  //selecting cell based on row and col
  selectCell(row: number, col: number): void {
    this.cellsService().getCell(row, col);

    this.selectedCell.set({
      row,
      col,
    });
  }

  //commiting changes
  commitChanges(): void {
    this.ensureMinimumSize();
    this.sheetChanged.emit(this.sheet());
  }

  //updating rows -1 delete 1 add
  updateRow(row: number, offset: 1 | -1 = 1): void {
    if (offset === 1) {
      this.sheetService().addRow(row);
    } else {
      const confirmed = window.confirm(`Möchtest du die Zeile ${row + 1} wirklich löschen?`);

      if (!confirmed) return;
      this.sheetService().deleteRow(row);
    }
    this.adjustSelection('row', row, offset);
    this.commitChanges();
  }
  //updating cols -1 delete 1 add
  updateCol(col: number, offset: 1 | -1 = 1): void {
    if (offset === 1) {
      this.sheetService().addCol(col);
    } else {
      const confirmed = window.confirm(
        `Möchtest du die Spalte ${this.getColumnLetter(col)} wirklich löschen?`,
      );

      if (!confirmed) return;
      this.sheetService().deleteCol(col);
    }
    this.adjustSelection('col', col, offset);
    this.commitChanges();
  }

  private adjustSelection(axis: 'row' | 'col', index: number, offset: 1 | -1): void {
    const selected = this.selectedCell();
    if (!selected) return;

    if (offset === -1 && selected[axis] === index) {
      this.selectedCell.set(undefined);
    } else if (selected[axis] >= index) {
      this.selectedCell.set({ ...selected, [axis]: selected[axis] + offset });
    }
  }

  //converting from number to letters
  getColumnLetter(index: number): string {
    let label = '';
    for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
      label = String.fromCharCode(65 + ((n - 1) % 26)) + label;
    }
    return label;
  }
}
