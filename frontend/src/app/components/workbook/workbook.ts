import { Component, inject, input, OnInit, output } from '@angular/core';
import { WorkBooksService } from '../../services/workBook.service';
import { Spreadsheet } from '../spreadsheet/spreadsheet';
import { Toolbar } from '../toolbar/toolbar';
import { Sheet } from '../../models/sheets.model';
import { ExcelApi } from '../../api/ExcelApi';
import { Router } from '@angular/router';
import { Workbook } from '../../models/workBook.model';


@Component({
  selector: 'app-workbook',
  imports: [Spreadsheet, Toolbar],
  templateUrl: './workbook.html',
  styleUrl: './workbook.css',
})
export class WorkbookComponent {
  protected readonly workbookService = inject(WorkBooksService);
  protected readonly excelApi = inject(ExcelApi);
  readonly workbook = input.required<Workbook | undefined>() ;
  save = output<void>();

  openWorkbook(id: number): void {
    this.workbook();
  }

  saveWorkbook(): void {
    this.save.emit();
  }

  addSheet(): void {
    this.workbookService.addingSheet();
    const latestSheet = this.workbookService.sheets().at(-1);
    if (latestSheet) {
      this.workbookService.selectSheet(latestSheet.id);
    }
    this.saveWorkbook();
  }
  //open workbook id

  deleteSheet(): void {
    const sheet = this.workbookService.currentSheet();

    if (!sheet) return;

    const confirmed = window.confirm(
      `Möchtest du das Tabellenblatt "${sheet.name}" wirklich löschen?`,
    );

    if (!confirmed) return;

    this.workbookService.deletingSheet(sheet.id);
    this.workbookService.selectSheet('1');
    this.saveWorkbook();
  }

  importSelected(file: File): void {
    this.excelApi.importExcel(file).subscribe({
      next: (workbook) => {
        this.workbookService.newWorkBook(workbook);
        this.saveWorkbook();
      },
      error: (error) => {
        console.error('Import failed', error);
      },
      complete: () => {
        window.alert(`Die Arbeitsmappe wurde erfolgreich importiert.`);
        console.log('Import completed');
      },
    });
  }

  exportSelected(): void {
    const workbook = this.workbook() ;
    if (!workbook) return;
      this.excelApi.exportExcel(workbook).subscribe({
        next: (blob: Blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = workbook.name.toLowerCase().endsWith('.xlsx')
            ? workbook.name
            : `${workbook.name}.xlsx`;

          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(url));
          window.alert(`Die Arbeitsmappe wurde erfolgreich heruntergeladen.`);
        },
        error: (error) => {
          window.alert(`Die Arbeitsmappe konnte nicht exportiert werden.`);
          console.error('Export failed', error);
        },
      });

  }

  onSheetChanged(sheet: Sheet): void {
    this.workbookService.updateSheet(sheet);
    this.saveWorkbook();
  }
  protected readonly WorkBooksService = WorkBooksService;
}
