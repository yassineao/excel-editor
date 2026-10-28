import { WorkBooksService } from './workBook.service';
import { SheetService } from './sheets.service';

describe('Workbook sheet navigation', () => {
  it('creates independent workbooks without replacing the active workbook', () => {
    const service = new WorkBooksService();
    const initialId = service.workbookId();
    service.renameWorkBook('Budget');
    service.addingSheet();
    const created = service.createWorkbook(42);

    expect(created.id).toBe(42);
    expect(created.name).toBe('Workbook');
    expect(created.sheets).toHaveLength(1);
    expect(created.sheets[0]).not.toBe(service.sheets()[0]);
    expect(service.workbookId()).toBe(initialId);
    expect(service.name()).toBe('Budget');
    expect(service.sheets()).toHaveLength(2);
  });

  it('tracks the replacement workbook ID and allows further edits', () => {
    const service = new WorkBooksService();
    expect(service.workbookId()).toBeGreaterThanOrEqual(1);
    service.addingSheet();
    service.nextSheet();
    service.newWorkBook(service.createWorkbook(42));

    expect(service.workbookId()).toBe(42);
    expect(service.currentSheet()?.id).toBe('1');
    service.renameWorkBook('Imported budget');
    service.addingSheet();
    service.updateSheet({ ...service.sheets()[0], name: 'Updated' });
    service.deletingSheet('2');
    expect(service.name()).toBe('Imported budget');
    expect(service.currentSheet()?.name).toBe('Updated');
    expect(service.sheets()).toHaveLength(1);
    expect(service.workbookId()).toBe(42);
  });

  it('increments workbook IDs across service instances', () => {
    const service = new WorkBooksService();
    const initialId = service.workbookId();
    expect(service.createWorkbook().id).toBe(initialId + 1);
    expect(service.createWorkbook().id).toBe(initialId + 2);
    const otherService = new WorkBooksService();
    expect(otherService.workbookId()).toBe(initialId + 3);
  });

  it('assigns sequential IDs to new sheets', () => {
    const service = new WorkBooksService();
    service.addingSheet();
    service.addingSheet();
    service.addingSheet();
    expect(service.sheets().map(sheet => sheet.id)).toEqual(['1', '2', '3', '4']);
  });

  it('continues after the highest existing numeric ID', () => {
    const service = new WorkBooksService();
    service.addingSheet(SheetService.createSheet('7'));
    service.addingSheet();
    expect(service.sheets().map(sheet => sheet.id)).toEqual(['1', '7', '8']);
  });

  it('updates the current sheet and stops at both boundaries', () => {
    const service = new WorkBooksService();
    const first = service.currentSheet();
    const second = SheetService.createSheet('2', 'Second');
    service.addingSheet(second);

    expect(service.currentSheet()).toBe(first);
    service.nextSheet();
    expect(service.currentSheet()).toBe(second);
    service.nextSheet();
    expect(service.currentSheet()).toBe(second);
    service.previousSheet();
    expect(service.currentSheet()).toBe(first);
    service.previousSheet();
    expect(service.currentSheet()).toBe(first);
  });

  it('keeps the only sheet selected', () => {
    const service = new WorkBooksService();
    const first = service.currentSheet();
    service.nextSheet();
    expect(service.currentSheet()).toBe(first);
    service.previousSheet();
    expect(service.currentSheet()).toBe(first);
  });
});
