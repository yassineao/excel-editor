import {  ResizingRow } from '../../models/resizing.model';
import { signal } from '@angular/core';

export class RowResizing {
  private resizing: ResizingRow | null = null;

  readonly heights = signal<Partial<Record<number, number>>>({});

  constructor(
    private readonly getRowHeight: (index: number) => number,
    private readonly getMinimumHeight: () => number,
  ) {}

  start(event: PointerEvent, index: number): void {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    this.resizing = {
      index,
      startY: event.clientY,
      startHeight: this.getRowHeight(index),
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  move(event: PointerEvent): void {
    if (!this.resizing) return;
    const { index, startY, startHeight } = this.resizing;
    const height = Math.max(this.getMinimumHeight(), startHeight + event.clientX - startY);
    this.heights.update((heights) => ({ ...heights, [index]: height }));
  }

  stop(): void {
    this.resizing = null;
  }
}
