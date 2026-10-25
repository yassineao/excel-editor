import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ExcelApi } from './ExcelApi';
import { WorkBooksService } from '../services/workBook.service';
import { Type } from '../models/type';

describe('Excel import', () => {
  it('converts JSON cells to Maps that can be saved and reloaded', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const service = new WorkBooksService();
    service.addingSheet();
    service.nextSheet();
    const saved = localStorage.getItem('workbook');

    try {
      TestBed.inject(ExcelApi).importExcel(new File(['test'], 'test.xlsx')).subscribe(book => {
        service.newWorkBook(book);
        expect(service.currentSheet()?.id).toBe('1');
        expect(service.currentSheet()?.columns).toBe(3);
        expect(service.currentSheet()?.cells.get('0,0')).toEqual({ value: 'Hello', type: Type.STRING });
        service.saveWorkbook();
        const restored = new WorkBooksService();
        restored.loadWorkbook();
        expect(restored.currentSheet()?.cells.get('0,0')?.value).toBe('Hello');
      });

      http.expectOne('http://localhost:8080/excel/import').flush({
        name: 'test.xlsx',
        sheets: [{ name: 'Imported', rows: 2, cols: 3, cells: { '0,0': { value: 'Hello', type: 'STRING' } } }],
      });
      http.verify();
    } finally {
      if (saved === null) localStorage.removeItem('workbook');
      else localStorage.setItem('workbook', saved);
    }
  });
});
