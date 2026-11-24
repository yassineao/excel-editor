import { signal } from '@angular/core';
import { Resizing } from '../../models/resizing.model';

export class ColumnResizing {
  // Active column drag, or null when no resize is in progress.
  private resizing: Resizing | null = null;
  // Custom column widths in pixels, scoped to one spreadsheet instance.
  readonly widths = signal<Partial<Record<number, number>>>({});

  constructor(
    private readonly getColumnWidth: (index: number) => number,
    private readonly getMinimumWidth: () => number,
  ) {}

  start(event: PointerEvent, index: number): void {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    this.resizing = {
      index,
      startX: event.clientX,
      startWidth: this.getColumnWidth(index),
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  move(event: PointerEvent): void {
    if (!this.resizing) return;
    const { index, startX, startWidth } = this.resizing;
    const width = Math.max(this.getMinimumWidth(), startWidth + event.clientX - startX);
    this.widths.update((widths) => ({ ...widths, [index]: width }));
  }

  stop(): void {
    this.resizing = null;
  }
}
