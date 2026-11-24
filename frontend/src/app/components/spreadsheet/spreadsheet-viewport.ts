import { afterRenderEffect, computed, ElementRef, Signal, signal, untracked } from '@angular/core';
import { Sheet } from '../../models/sheets.model';

// Component view queries are passed in so Angular keeps ownership of the template elements.
export interface SpreadsheetElements {
  readonly viewport: Signal<ElementRef<HTMLElement>>;
  readonly headerRow: Signal<ElementRef<HTMLTableRowElement>>;
  readonly columnHeaders: Signal<readonly ElementRef<HTMLTableCellElement>[]>;
  readonly rowHeader: Signal<ElementRef<HTMLTableCellElement>>;
  readonly dataRows: Signal<readonly ElementRef<HTMLTableRowElement>[]>;
  readonly columnWidthReference: Signal<ElementRef<HTMLElement>>;
}

// Owns DOM measurements, scroll handling, and virtualized grid ranges.
export class SpreadsheetViewport {
  // Grid dimensions and visible rows
  private readonly minimumRows = 1000;
  private readonly minimumColumns = 26;
  private readonly overscanRows = 6;
  private readonly overScanCols = 4;

  readonly defaultColumnWidth = signal(0);
  readonly defaultRowHeight = signal(0);
  readonly rowHeaderWidth = signal(0);
  readonly headerHeight = signal(0);

  // Current row and column counts after enforcing minimum dimensions.
  private readonly dimensions = signal({ rows: this.minimumRows, columns: this.minimumColumns });
  // All zero-based row indices in the sheet.
  readonly rows = computed(() => Array.from({ length: this.dimensions().rows }, (_, i) => i));
  // All zero-based column indices in the sheet.
  readonly cols = computed(() => Array.from({ length: this.dimensions().columns }, (_, i) => i));
  // Default row height measured from the stable CSS reference.
  readonly rowHeight = signal(0);
  // Measured default column width used to estimate the visible-column count.
  readonly colWidth = signal(0);
  // First rendered row index, including the buffer above the viewport.
  private readonly renderStart = signal(0);
  // First column in the buffered horizontal range, independent of vertical scrolling.
  private readonly renderStartCol = signal(0);
  // Available scroll-container height in pixels, read from clientHeight.
  private readonly viewportHeight = signal(0);
  private readonly renderEndCol = signal(this.overScanCols * 2);
  private measuredWidth = 0;
  private measuredHeight = 0;

  // Prefix widths keep offscreen resized columns in the scroll geometry.
  readonly columnOffsets = computed(() => {
    const widths = this.getColumnWidths();
    const offsets = [0];
    for (const col of this.cols()) {
      offsets.push(offsets[col] + (widths[col] ?? this.colWidth()));
    }
    return offsets;
  });

  private columnAt(offset: number): number {
    const offsets = this.columnOffsets();
    let low = 0;
    let high = this.dimensions().columns;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (offsets[mid + 1] <= offset) low = mid + 1;
      else high = mid;
    }
    return Math.min(low, this.dimensions().columns - 1);
  }

  readonly firstVisibleCols = computed(() =>
    Math.min(Math.max(0, this.dimensions().columns - 1), this.renderStartCol()),
  );
  readonly firstVisibleRow = computed(() =>
    Math.min(Math.max(0, this.dimensions().rows - 1), this.renderStart()),
  );

  readonly visibleRows = computed(() => {
    const start = this.firstVisibleRow();
    const count =
      (this.rowHeight() > 0 ? Math.ceil(this.viewportHeight() / this.rowHeight()) : 0) +
      this.overscanRows * 2;
    return Array.from(
      { length: Math.min(count, this.dimensions().rows - start) },
      (_, i) => start + i,
    );
  });
  // Column range covering the viewport plus a buffer, including custom widths.
  readonly visibleCols = computed(() => {
    const start = this.firstVisibleCols();
    const count = Math.max(0, this.renderEndCol() - start);
    return Array.from(
      { length: Math.min(count, this.dimensions().columns - start) },
      (_, i) => start + i,
    );
  });

  // Space before rendered columns, including custom widths.
  readonly leftSpacerWidth = computed(() => this.columnOffsets()[this.firstVisibleCols()]);
  // Space after rendered columns, including custom widths.
  readonly rightSpacerWidth = computed(
    () =>
      this.columnOffsets()[this.dimensions().columns] -
      this.columnOffsets()[this.firstVisibleCols() + this.visibleCols().length],
  );
  // Empty space above rendered rows, preserving their vertical scroll position.
  readonly topSpacerHeight = computed(() => this.firstVisibleRow() * this.rowHeight());
  // Empty space below rendered rows, preserving the full sheet scroll height.
  readonly bottomSpacerHeight = computed(
    () =>
      (this.dimensions().rows - this.firstVisibleRow() - this.visibleRows().length) *
      this.rowHeight(),
  );

  constructor(
    private readonly elements: SpreadsheetElements,
    private readonly getColumnWidths: () => Partial<Record<number, number>> = () => ({}),
  ) {
    // Only stable elements are observed. Replacing virtualized cells does not
    // reconnect observers or force layout measurements in the scroll path.
    afterRenderEffect((onCleanup) => {
      const viewport = this.elements.viewport().nativeElement;
      const header = this.elements.headerRow().nativeElement;
      const rowHeader = this.elements.rowHeader().nativeElement;
      const reference = this.elements.columnWidthReference().nativeElement;
      const measure = () =>
        untracked(() => {
          const size = reference.getBoundingClientRect();
          const headerHeight = header.getBoundingClientRect().height;
          const rowHeaderWidth = rowHeader.getBoundingClientRect().width;
          this.measuredWidth = viewport.clientWidth;
          this.measuredHeight = viewport.clientHeight;
          if (size.height > 0) {
            this.defaultRowHeight.set(size.height);
            this.rowHeight.set(size.height);
          }
          if (size.width > 0) {
            this.defaultColumnWidth.set(size.width);
            this.colWidth.set(size.width);
          }
          if (headerHeight > 0) this.headerHeight.set(headerHeight);
          if (rowHeaderWidth > 0) this.rowHeaderWidth.set(rowHeaderWidth);
          this.updateViewport(viewport);
        });
      const listener = () => untracked(() => this.updateViewport(viewport));
      viewport.addEventListener('scroll', listener, { passive: true });
      measure();
      const observer =
        typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
      for (const element of [viewport, header, rowHeader, reference]) observer?.observe(element);
      onCleanup(() => {
        viewport.removeEventListener('scroll', listener);
        observer?.disconnect();
      });
    });

    // Geometry changes are independent of rendered row and column queries.
    afterRenderEffect(() => {
      this.columnOffsets();
      this.dimensions();
      this.rowHeight();
      const viewport = this.elements.viewport().nativeElement;
      untracked(() => this.updateViewport(viewport));
    });
  }

  // make the minimum size of a sheet A1:Z1000
  ensureMinimumSize(sheet: Sheet): void {
    sheet.rows = Math.max(this.minimumRows, sheet.rows);
    sheet.columns = Math.max(this.minimumColumns, sheet.columns);
    const current = this.dimensions();
    if (current.rows !== sheet.rows || current.columns !== sheet.columns) {
      this.dimensions.set({ rows: sheet.rows, columns: sheet.columns });
    }
  }

  private updateViewport(viewport: HTMLElement): void {
    const width = this.measuredWidth;
    const height = this.measuredHeight;
    const firstRow =
      this.rowHeight() > 0 ? Math.max(0, Math.floor(viewport.scrollTop / this.rowHeight())) : 0;
    // Find the absolute column even when its header is outside the rendered range.
    const firstCol = this.colWidth() > 0 ? this.columnAt(viewport.scrollLeft) : 0;
    const colStart = Math.max(
      0,
      Math.floor(firstCol / this.overScanCols) * this.overScanCols - this.overScanCols,
    );
    // Keep the same DOM while scrolling within a six-row block.
    const start = Math.max(
      0,
      Math.floor(firstRow / this.overscanRows) * this.overscanRows - this.overscanRows,
    );
    const endCol =
      this.colWidth() > 0
        ? Math.min(
            this.dimensions().columns,
            Math.max(
              colStart + this.overScanCols * 2,
              this.columnAt(viewport.scrollLeft + Math.max(0, width - this.rowHeaderWidth())) +
                1 +
                this.overScanCols,
            ),
          )
        : this.overScanCols * 2;
    // Equal numeric signals do not invalidate the template. Scrolling inside
    // the same range keeps the existing arrays and DOM.
    this.renderStart.set(start);
    this.renderStartCol.set(colStart);
    this.renderEndCol.set(endCol);
    this.viewportHeight.set(height);
  }
}
