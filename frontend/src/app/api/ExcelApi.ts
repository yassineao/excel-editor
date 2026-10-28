import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Workbook } from '../models/workBook.model';
import { Cell } from '../models/cells.model';
import { ImportedWorkbook } from '../dto/apiRequest';



@Injectable({
  providedIn: 'root',
})
export class ExcelApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080';

  importExcel(file: File): Observable<Workbook> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ImportedWorkbook>(`${this.apiUrl}/excel/import`, formData).pipe(
      map((data) => ({
        id: 1,
        name: data.name,
        sheets: data.sheets.map((sheet, index) => ({
          id: String(index + 1),
          name: sheet.name,
          rows: sheet.rows,
          columns: sheet.cols,
          cells: new Map(Object.entries(sheet.cells)),
        })),
      })),
    );
  }

  exportExcel(workbook: Workbook): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/excel/export`,
      this.convertToRequest(workbook),
      {
        responseType: 'blob',
      }
      );
  }

  convertToRequest(workbook: Workbook): ImportedWorkbook {
    return {
      name: workbook.name,
      sheets: workbook.sheets.map((sheet) => ({
        name: sheet.name,
        rows: sheet.rows,
        cols: sheet.columns,
        cells: Object.fromEntries(sheet.cells),
      })),
    };
  }
}
