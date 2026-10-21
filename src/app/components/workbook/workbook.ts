import { Component, inject, OnInit } from '@angular/core';
import { WorkBooksService } from '../../services/workBook.service';
import { Spreadsheet } from '../spreadsheet/spreadsheet';
import { Toolbar } from '../toolbar/toolbar';
import { Sheet } from '../../models/sheets.model';

@Component({
  selector: 'app-workbook',
  imports: [Spreadsheet, Toolbar],
  templateUrl: './workbook.html',
  styleUrl: './workbook.css',
})
export class Workbook implements OnInit {
  protected readonly workbookService = inject(WorkBooksService);

  ngOnInit(): void {
    this.workbookService.loadWorkbook();
  }

  saveWorkbook(): void {
    this.workbookService.saveWorkbook();
  }

  addSheet(): void {
    this.workbookService.addingSheet();
    const latestSheet = this.workbookService.sheets().at(-1);
    if (latestSheet) {
      this.workbookService.selectSheet(latestSheet.id);
    }
    this.saveWorkbook();
  }

  deleteSheet(): void {
    const sheet = this.workbookService.currentSheet();

    if (sheet) {
      this.workbookService.deletingSheet(sheet.id);
      this.workbookService.selectSheet("1");
    }
    this.saveWorkbook();

  }

  onSheetChanged(sheet: Sheet): void {
    this.workbookService.updateSheet(sheet);
    this.saveWorkbook();
  }

}
