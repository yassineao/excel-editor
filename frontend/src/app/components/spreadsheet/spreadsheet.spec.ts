import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Spreadsheet } from './spreadsheet';
import { Sheet } from '../../models/sheets.model';

describe('Spreadsheet', () => {
  let component: Spreadsheet;
  let fixture: ComponentFixture<Spreadsheet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Spreadsheet],
    }).compileComponents();

    fixture = TestBed.createComponent(Spreadsheet);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('sheet', {
      id: '1', name: 'First', rows: 2, columns: 3, cells: new Map(),
    } satisfies Sheet);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses the current input sheet after switching sheets', () => {
    const first = component.sheet();
    component.sheetService().renameSheet('Renamed');
    expect(first.name).toBe('Renamed');
    const second: Sheet = { id: '2', name: 'Second', rows: 1, columns: 1, cells: new Map() };
    fixture.componentRef.setInput('sheet', second);
    component.sheetService().renameSheet('Current');
    expect(second.name).toBe('Current');
    expect(first.name).toBe('Renamed');
  });

  it('writes edited cell values to the input sheet', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('td input');
    input.value = 'Hello';
    input.dispatchEvent(new Event('input'));
    expect(component.sheet().cells.get('0,0')?.value).toBe('Hello');
  });

});
