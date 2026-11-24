import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ExcelApi } from './ExcelApi';
import { WorkBooksService } from '../services/workBook.service';
import { UserFilesService } from '../services/UserFiles.service';
import { TypeModel } from '../models/type.model';

describe('Excel import', () => {
  it('converts JSON cells to Maps that can be saved and reloaded', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(WorkBooksService);
    const files = TestBed.inject(UserFilesService);
    const saved = localStorage.getItem('userFiles');

    try {
      TestBed.inject(ExcelApi).importExcel(new File(['test'], 'test.xlsx')).subscribe(book => {
        files.addWorkbooktoUserFiles(book);
        service.newWorkBook(book);
        expect(service.workbookId()).toBe(book.id);
        expect(service.currentSheet()?.id).toBe('1');
        expect(service.currentSheet()?.columns).toBe(3);
        expect(service.currentSheet()?.cells.get('0,0')).toEqual({ value: 'Hello', type: TypeModel.STRING });
        service.saveWorkbook();
        const restored = TestBed.runInInjectionContext(() => new UserFilesService());
        restored.loadUserFiles();
        const restoredBook = restored.userFiles().workbooks.find(workbook => workbook.id === book.id);
        expect(restoredBook).toBeDefined();
        expect(restoredBook?.sheets[0].cells.get('0,0')?.value).toBe('Hello');
      });

      http.expectOne('http://localhost:8080/excel/import').flush({
        name: 'test.xlsx',
        sheets: [{ name: 'Imported', rows: 2, cols: 3, cells: { '0,0': { value: 'Hello', type: 'STRING' } } }],
      });
      http.verify();
    } finally {
      if (saved === null) localStorage.removeItem('userFiles');
      else localStorage.setItem('userFiles', saved);
    }
  });
});
