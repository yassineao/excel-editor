import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { WorkBooksService } from '../../services/workBook.service';
import { Spreadsheet } from '../spreadsheet/spreadsheet';
import { Toolbar } from '../toolbar/toolbar';

@Component({
  selector: 'app-workbook',
  imports: [Spreadsheet, Toolbar],
  templateUrl: './workbook.html',
  styleUrl: './workbook.css',
})
export class Workbook implements OnInit, OnDestroy {
  protected readonly workbookService = inject(WorkBooksService);

  ngOnInit(): void {
    this.workbookService.loadWorkbook();
  }

  private saveTimer?: ReturnType<typeof setTimeout>;

  saveWorkbook(): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = undefined;
    this.workbookService.saveWorkbook();
  }

  onCellChanged(): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.workbookService.saveWorkbook();
      this.saveTimer = undefined;
    }, 1000);

  }

  ngOnDestroy(): void {
    if (this.saveTimer !== undefined) {
      clearTimeout(this.saveTimer);
      this.workbookService.saveWorkbook();
    }
  }
}
