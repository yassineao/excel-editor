import { computed, Injectable, signal } from '@angular/core';
import { Workbook } from '../models/workBook.model';
import { Sheet } from '../models/sheets.model';
import { Cell } from '../models/cells.model';

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

  // saving workbook on local storage
  saveWorkbook(): void {
    if (typeof localStorage === 'undefined') return;
    const workBook = this.workBook();

    const data = {
      ...workBook,
      sheets: workBook.sheets.map((sheet) => ({
        ...sheet,
        cells: Array.from(sheet.cells.entries()),
      })),
    };

    localStorage.setItem('workbook', JSON.stringify(data));
  }

  //loading workbook from local storage
  loadWorkbook(): void {
    if (typeof localStorage === 'undefined') return;
    const saved = localStorage.getItem('workbook');

    if (!saved) return;

    try {
      const data = JSON.parse(saved);

      const workbook = {
        ...data,
        sheets: data.sheets.map((sheet: any) => ({
          ...sheet,
          cells: new Map<string, Cell>(sheet.cells),
        })),
      };

      this.workBook.set(workbook);
    } catch (error) {
      console.error('Workbook konnte nicht geladen werden', error);
    }
  }
}
