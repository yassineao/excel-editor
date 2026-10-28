import { TestBed } from '@angular/core/testing';
import { ExcelApi } from '../api/ExcelApi';
import { Type } from '../models/type';
import { UserFilesService } from './UserFiles.service';
import { WorkBooksService } from './workBook.service';

describe('User files storage', () => {
  it('restores cell Maps and preserves workbook data across repeated saves and loads', () => {
    TestBed.configureTestingModule({ providers: [{ provide: ExcelApi, useValue: {} }] });
    const service = TestBed.inject(UserFilesService);
    const workbook = TestBed.inject(WorkBooksService).createWorkbook(42);
    workbook.name = 'Budget';
    workbook.sheets[0].cells.set('0,0', { value: 'Hello', type: Type.STRING });
    const previous = localStorage.getItem('userFiles');

    try {
      service.addWorkbooktoUserFiles(workbook);
      for (let cycle = 0; cycle < 2; cycle++) {
        service.userFiles.set({ workbooks: [] });
        service.loadUserFiles();
        const restored = service.userFiles().workbooks[0];
        expect(restored).toEqual(workbook);
        expect(restored.sheets[0].cells).toBeInstanceOf(Map);
        expect(restored.sheets[0].cells.get('0,0')?.value).toBe('Hello');
        expect(restored.sheets[0].cells.get('1,1')).toBeUndefined();
        service.saveUserFiles();
      }
    } finally {
      if (previous === null) localStorage.removeItem('userFiles');
      else localStorage.setItem('userFiles', previous);
    }
  });
});
