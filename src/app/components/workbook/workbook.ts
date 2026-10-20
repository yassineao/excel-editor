import { Component, inject } from '@angular/core';
import { WorkBooksService } from '../../services/workBook.service';
import { Spreadsheet } from '../spreadsheet/spreadsheet';
import { Toolbar } from '../toolbar/toolbar';

@Component({
  selector: 'app-workbook',
  imports: [Spreadsheet, Toolbar],
  templateUrl: './workbook.html',
  styleUrl: './workbook.css',
})
export class Workbook {
  protected readonly workbookService = inject(WorkBooksService);
}
