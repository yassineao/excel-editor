import {
  ChangeDetectionStrategy,
  ElementRef,
  Component,
  computed,
  input,
  OnChanges,
  output,
  signal,
  SimpleChanges,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Sheet } from '../../models/sheets.model';
import { SheetService } from '../../services/sheets.service';
import { CellsService } from '../../services/cells.service';
import { getCellType } from '../../models/type.model';
import { ColumnResizing } from './column-resizing';
import { SpreadsheetViewport } from './spreadsheet-viewport';
import { RowResizing } from './rowResizing';

@Component({
  selector: 'app-spreadsheet',
  templateUrl: './spreadsheet.html',
  host: { class: 'block min-w-0' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Spreadsheet implements OnChanges {

  // Scrollable container providing the scroll position and available viewport size.
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');

  // Entire top row containing # and the column labels A, B, C, etc.
  private readonly headerRow = viewChild.required<ElementRef<HTMLTableRowElement>>('headerRow');

  // Rendered column-label cells (A, B, C, etc.), excluding the corner cell.
  private readonly columnHeaders = viewChildren<ElementRef<HTMLTableCellElement>>('columnHeader');

  // Top-left # corner cell, used to measure the row-number column width.
  private readonly rowHeader = viewChild.required<ElementRef<HTMLTableCellElement>>('rowHeader');

  // Currently rendered data rows; the first is used to measure row height.
  private readonly dataRows = viewChildren<ElementRef<HTMLTableRowElement>>('dataRow');

  // Invisible CSS-sized element used to measure the default column width.
  private readonly columnWidthReference = viewChild.required<ElementRef<HTMLElement>>('columnWidthReference');

  // Inputs, outputs, and selection
  // Input sheet containing dimensions and cell values.
  readonly sheet = input.required<Sheet>();

  // Zero-based row and column of the selected cell, or undefined if none is selected.
  readonly selectedCell = signal<
    | {
        row: number;
        col: number;
      }
    | undefined
  >(undefined);

  // Notifies the parent when edits or structural changes are committed.
  readonly sheetChanged = output<Sheet>();
  // Sheet services
  // Row and column operations for the current input sheet.
  readonly sheetService = computed(() => new SheetService(this.sheet()));
  // Cell lookup and editing operations for the current input sheet.
  readonly cellsService = computed(() => new CellsService(this.sheet()));
  // Measures the rendered grid and calculates which rows and columns to display.
  readonly grid: SpreadsheetViewport = new SpreadsheetViewport({
    viewport: this.viewport,
    headerRow: this.headerRow,
    columnHeaders: this.columnHeaders,
    rowHeader: this.rowHeader,
    dataRows: this.dataRows,
    columnWidthReference: this.columnWidthReference,
  }, () => this.columnWidths());

  // Sheet lifecycle
  ngOnChanges(changes: SimpleChanges): void {
    this.grid.ensureMinimumSize(this.sheet());
    const change = changes['sheet'];
    if (change && change.previousValue?.id !== change.currentValue.id) {
      this.selectedCell.set(undefined);
    }
    const selected = this.selectedCell();
    if (selected && (selected.row >= this.sheet().rows || selected.col >= this.sheet().columns)) {
      this.selectedCell.set(undefined);
    }
  }

  // Column resizing
  // Owns pointer dragging and custom widths for this spreadsheet instance.
  readonly columnResizing = new ColumnResizing(
    (index) => this.columnHeaders()[index - this.grid.firstVisibleCols()].nativeElement.getBoundingClientRect().width,
    () => this.grid.rowHeaderWidth(),
  );
  // Custom pixel widths exposed by the column resizing controller.
  readonly columnWidths = this.columnResizing.widths;
  // Total width of the row header and columns; null until the default width is measured.
  readonly tableWidth = computed(
    () =>
      this.grid.defaultColumnWidth() > 0 ? this.grid.rowHeaderWidth() +
      this.grid.cols().reduce(
        (total, col) => total + (this.columnWidths()[col] ?? this.grid.defaultColumnWidth()),
        0,
      ) : null,
  );

  //Row resizing
  readonly rowResizing = new RowResizing(
    (index) => this.dataRows()[index - this.grid.firstVisibleRow()].nativeElement.getBoundingClientRect().height,
    () => this.grid.rowHeaderWidth(),
  );
  readonly  rowHeights = this.rowResizing.heights;
  readonly tableHeight = computed(
    () =>
      this.grid.defaultRowHeight() > 0 ? this.grid.rowHeight() +
        this.grid.rows().reduce(
          (total, row) => total + (this.rowHeights()[row] ?? this.grid.defaultRowHeight()),
          0
        ): null,
  )

  // Cell selection and editing
  selectedCellValue(): string | number | boolean {
    const selected = this.selectedCell();
    return selected ? (this.sheet().cells.get(`${selected.row},${selected.col}`)?.value ?? '') : '';
  }

  selectedCellPosition(): string {
    const selected = this.selectedCell();
    return selected ? `Row ${selected.row + 1}, Col ${this.getColumnLetter(selected.col)}` : '';
  }

  updateSelectedCell(value: string | number | boolean | null): void {
    const selected = this.selectedCell();
    if (selected) {
      this.updateCell(selected.row, selected.col, value);
    }
  }

  updateCell(row: number, col: number, value: string | number | boolean | null): void {
    const type = getCellType(value);
    this.cellsService().updateCell(row, col, { value }, type);
    const selected = this.selectedCell();
    if (selected?.row === row && selected.col === col) {
      this.selectCell(row, col);
    }
  }

  selectCell(row: number, col: number): void {
    this.cellsService().getCell(row, col);

    this.selectedCell.set({
      row,
      col,
    });
  }

  // Sheet changes
  commitChanges(): void {
    this.grid.ensureMinimumSize(this.sheet());
    this.sheetChanged.emit(this.sheet());
  }

  // Row and column operations
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

  // Column labels
  getColumnLetter(index: number): string {
    let label = '';
    for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
      label = String.fromCharCode(65 + ((n - 1) % 26)) + label;
    }
    return label;
  }
}
