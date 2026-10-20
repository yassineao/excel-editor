import { computed, Injectable, signal } from '@angular/core';
import { Workbook } from '../models/workBook.model';
import { Sheet } from '../models/sheets.model';

@Injectable({
  providedIn: 'root',
})
export class WorkBooksService {
  private readonly workBook = signal<Workbook>({
    id: '1',
    name: 'Workbook',
    sheets: [{ id: '1', name: 'Sheet', rows: 10, columns: 5, cells: new Map() }],
  });

  index: number = 0;
  readonly name = computed(() => this.workBook().name);
  readonly currentSheet = computed(() => this.workBook().sheets.at(this.index));

  nextSheet() {
    this.index = this.workBook().sheets.length > this.index ? this.index : this.index + 1;
  }

  previousSheet() {
    this.index = this.index > 0 ? this.index : this.index - 1;
  }

  addingSheet(sheet: Sheet): void {
    this.workBook.update((book) => ({ ...book, sheets: [...book.sheets, sheet] }));
  }

  renameWorkBook(name: string): void {
    this.workBook.update((book) => ({ ...book, name }));
  }
}
