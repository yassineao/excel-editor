import { Workbook } from '../models/workBook.model';
import { computed, inject, Injectable, signal } from '@angular/core';
import { UserFiles } from '../models/userFiles.model';
import { Cell } from '../models/cells.model';
import type { StoredUserFiles } from '../models/storedUserFiles.model';
import { ExcelApi } from '../api/ExcelApi';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserFilesService {
  readonly userFiles = signal<UserFiles>({
    workbooks: [],
  });
  protected readonly excelApi = inject(ExcelApi);

  //add workbook
  addWorkbooktoUserFiles(workbook: Workbook): Workbook {
    const workbooks = this.userFiles().workbooks;
    const addedWorkbook = workbooks.some((existing) => existing.id === workbook.id)
      ? { ...workbook, id: workbooks.reduce((highest, existing) => Math.max(highest, existing.id), 0) + 1 }
      : workbook;
    this.userFiles.update((userFiles) => ({
      ...userFiles,
      workbooks: [...userFiles.workbooks, addedWorkbook],
    }));
    this.saveUserFiles();
    return addedWorkbook;
  }

  //check changes
//  hasChanges = computed(() => this.workbookService.workBook() !== this.userFiles().workbooks.at(this.workbookService.workbookId()));

  //delete workbook
  deleteWorkbook(id: number): void {
    this.userFiles.update((userFiles) => ({
      ...userFiles,
      workbooks: userFiles.workbooks.filter((workbook) => workbook.id !== id),
    }));
    this.saveUserFiles();
  }

  // save workbooks
  saveUserFiles(): void {
    if (typeof localStorage === 'undefined') return;
    const userFiles = this.userFiles();

    const data = {
      ...userFiles,
      workbooks: userFiles.workbooks.map((workbook) => ({
        ...workbook,
        sheets: workbook.sheets.map((sheet) => ({
          ...sheet,
          cells: Array.from(sheet.cells.entries()),
        })),
      })),
    };

    localStorage.setItem('userFiles', JSON.stringify(data));

    console.log(this.userFiles(), 'new file', data);
  }

  //load workbooks
  loadUserFiles(): void {
    if (typeof localStorage === 'undefined') return;
    const saved = localStorage.getItem('userFiles');

    if (!saved) return;

    try {
      const data: StoredUserFiles = JSON.parse(saved);
      const seenIds = new Set<number>();
      let nextId = data.workbooks.reduce((highest, workbook) => Math.max(highest, workbook.id), 0) + 1;
      let repairedIds = false;

      // Keep the first occurrence and preserve every workbook by renumbering duplicates.
      for (const workbook of data.workbooks) {
        if (seenIds.has(workbook.id)) {
          workbook.id = nextId++;
          repairedIds = true;
        }
        seenIds.add(workbook.id);
      }

      const userFiles: UserFiles = {
        ...data,
        workbooks: data.workbooks.map((workbook) => ({
          ...workbook,
          sheets: workbook.sheets.map((sheet) => ({
            ...sheet,
            cells: new Map<string, Cell>(sheet.cells),
          })),
        })),
      };

      this.userFiles.set(userFiles);
      if (repairedIds) this.saveUserFiles();
    } catch (error) {
      console.error('Dateien koennten nicht geladen werden', error);
    }
  }

  importSelected(file: File): Observable<Workbook> {
    return this.excelApi.importExcel(file).pipe(
      map((workbook) => this.addWorkbooktoUserFiles(workbook)),
    );
  }

  getWorkbook(id: number) {
    return this.userFiles().workbooks.at(id);
  }
}
