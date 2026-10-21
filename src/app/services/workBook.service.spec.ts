import { WorkBooksService } from './workBook.service';
import { SheetService } from './sheets.service';

describe('Workbook sheet navigation', () => {
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
