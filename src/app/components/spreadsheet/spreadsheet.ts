import { Component, computed, input, output } from '@angular/core';
import { Sheet } from '../../models/sheets.model';
import { SheetService } from '../../services/sheets.service';
import { CellsService } from '../../services/cells.service';

@Component({
  selector: 'app-spreadsheet',
  templateUrl: './spreadsheet.html',
  styleUrl: './spreadsheet.css',
})
export class Spreadsheet {
  sheet = input.required<Sheet>();
  readonly sheetChanged = output<Sheet>();
  readonly sheetService = computed(() => new SheetService(this.sheet()));
  readonly cellsService = computed(() => new CellsService(this.sheet()));
  rows = computed(() => Array.from({ length: this.sheet().rows }, (_, i) => i));
  cols = computed(() => Array.from({ length: this.sheet().columns }, (_, i) => i));

  updateCell(row: number, col: number, value: string): void {
    this.cellsService().updateCell(row, col, { value });
  }

  commitChanges(): void {
    this.sheetChanged.emit(this.sheet());
  }

  updateRow(row: number, offset: 1 | -1 = 1): void {
    if (offset === 1) {
      this.sheetService().addRow(row);
    } else {
      this.sheetService().deleteRow(row);
    }
    this.commitChanges();
  }

  updateCol(col: number, offset: 1 | -1 = 1): void {
    if (offset === 1) {
      this.sheetService().addCol(col);
    } else {
      this.sheetService().deleteCol(col);
    }
    this.commitChanges();
  }

  getColumnLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
