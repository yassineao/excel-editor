import { Workbook } from '../models/workBook.model';
import { inject, Injectable, signal } from '@angular/core';
import { UserFiles } from '../models/userFiles.model';
import { WorkBooksService } from './workBook.service';
import { Cell } from '../models/cells.model';
import { Sheet } from '../models/sheets.model';
import { ExcelApi } from '../api/ExcelApi';
import { Observable, tap } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class UserFilesService {
  workbookService = inject(WorkBooksService);
  readonly userFiles = signal<UserFiles>({
    workbooks: [],
  });
  protected readonly excelApi = inject(ExcelApi);
  //add workbook
  addWorkbooktoUserFiles(workbook: Workbook): void {
    this.userFiles.update((userFiles) => ({
      ...userFiles,
      workbooks: [...userFiles.workbooks, workbook],
    }));
    this.saveUserFiles();
  }

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
      const data = JSON.parse(saved);

      const userFiles: UserFiles = {
        ...data,
        workbooks: data.workbooks.map((workbook: Workbook) => ({
          ...workbook,
          sheets: workbook.sheets.map((sheet: Sheet) => ({
            ...sheet,
            cells: Array.from(sheet.cells.entries()),
          })),
        })),
      };

      this.userFiles.set(userFiles);
    } catch (error) {
      console.error('Dateien koennten nicht geladen werden', error);
    }
  }

  importSelected(file: File): Observable<Workbook> {
    return this.excelApi.importExcel(file).pipe(
      tap((workbook) => {
        console.log(workbook);
        this.workbookService.newWorkBook(workbook);
        this.addWorkbooktoUserFiles(workbook);
      }),
    );
  }

  getWorkbook(id: number) {
    return this.userFiles().workbooks.at(id);
  }
}
