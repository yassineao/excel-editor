import { computed, Injectable, signal } from '@angular/core';
import { Workbook } from '../models/workBook.model';
import { Sheet } from '../models/sheets.model';
import { Cell } from '../models/cells.model';
import { SheetService } from './sheets.service';

@Injectable({
  providedIn: 'root',
})
export class WorkBooksService {
  private readonly workBook = signal<Workbook>({
    id: '1',
    name: 'Workbook',
    sheets: [SheetService.createSheet('1')],
  });

  private readonly index = signal(0);
  readonly name = computed(() => this.workBook().name);
  readonly sheets = computed(() => this.workBook().sheets);
  readonly currentSheet = computed(() => this.workBook().sheets.at(this.index()));

  nextSheet(): void {
    this.index.update((index) => (index < this.workBook().sheets.length - 1 ? index + 1 : index));
  }

  selectSheet(id: string): void {
    const index = this.workBook().sheets.findIndex((sheet) => sheet.id === id);
    if (index !== -1) {
      this.index.set(index);
    }
  }

  previousSheet(): void {
    this.index.update((index) => Math.max(0, index - 1));
  }

  addingSheet(sheet?: Sheet): void {
    this.workBook.update((book) => {
      const highestId = book.sheets.reduce((highest, existing) => {
        const id = Number(existing.id);
        return Number.isSafeInteger(id) && id > highest ? id : highest;
      }, 0);
      const newSheet = sheet ?? SheetService.createSheet(String(highestId + 1));
      return { ...book, sheets: [...book.sheets, newSheet] };
    });
  }

  deletingSheet(id: string): void {
    const sheets = this.sheets();

    const index = sheets.findIndex((sheet) => sheet.id === id);

    if (index === -1 || sheets.length <= 1) return;

    this.workBook.update((book) => ({
      ...book,
      sheets: book.sheets.filter((sheet) => sheet.id !== id),
    }));

    this.index.set(Math.min(this.index(), this.sheets().length - 1));
  }

  updateSheet(sheet: Sheet): void {
    this.workBook.update((book) => ({
      ...book,
      sheets: book.sheets.map((existing) => (existing.id === sheet.id ? { ...sheet } : existing)),
    }));
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
      this.index.set(0);
    } catch (error) {
      console.error('Workbook konnte nicht geladen werden', error);
    }
  }
}
