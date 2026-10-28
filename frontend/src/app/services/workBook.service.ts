import { computed, inject, Injectable, signal } from '@angular/core';
import { Workbook } from '../models/workBook.model';
import { Sheet } from '../models/sheets.model';
import { Cell } from '../models/cells.model';
import { SheetService } from './sheets.service';
import { UserFilesService } from './UserFiles.service';

@Injectable({
  providedIn: 'root',
})
export class WorkBooksService {
  private static nextWorkbookId = 1;

  private readonly index = signal(0);
  readonly workBook = signal<Workbook>(this.createWorkbook());
  readonly workbookId = computed(() => this.workBook().id);

  protected readonly userFileService = inject(UserFilesService);

  readonly name = computed(() => this.workBook().name);
  readonly sheets = computed(() => this.workBook().sheets);
  readonly currentSheet = computed(() => this.workBook().sheets.at(this.index()));

  createWorkbook(id: number = WorkBooksService.nextWorkbookId): Workbook {
    WorkBooksService.nextWorkbookId = Math.max(WorkBooksService.nextWorkbookId, id + 1);
    return {
      id,
      name: 'Workbook',
      sheets: [SheetService.createSheet('1')],
    };
  }

  saveWorkbook(): void {
    this.userFileService.saveUserFiles();
  }
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
      this.saveWorkbook();
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
    this.saveWorkbook();
    this.index.set(Math.min(this.index(), this.sheets().length - 1));
  }

  updateSheet(sheet: Sheet): void {
    this.workBook.update((book) => ({
      ...book,
      sheets: book.sheets.map((existing) => (existing.id === sheet.id ? { ...sheet } : existing)),
    }));
    this.saveWorkbook();
  }

  renameWorkBook(name: string): void {
    this.workBook.update((book) => ({ ...book, name }));
    this.saveWorkbook();
  }

  newWorkBook(workbook: Workbook): void {
    try {
      this.workBook.set(workbook);
      this.index.set(0);
      this.saveWorkbook();
    } catch (error) {
      console.error('Workbook konnte nicht Importiert werden', error);
    }
  }
}
