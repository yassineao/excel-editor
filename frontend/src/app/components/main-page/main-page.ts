import { Component, inject, OnInit, signal } from '@angular/core';
import { WorkBooksService } from '../../services/workBook.service';
import { UserFilesService } from '../../services/UserFiles.service';
import { Router } from '@angular/router';
import { ExcelApi } from '../../api/ExcelApi';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
@Component({
  selector: 'main-page',
  templateUrl: 'main-page.html',
  host: { class: 'block text-[#193c33]' },
})
export class MainPage implements OnInit {
  private readonly workbookService = inject(WorkBooksService);
  protected readonly userFilesService = inject(UserFilesService);
  protected readonly userFiles = this.userFilesService.userFiles;
  protected readonly importing = signal(false);
  protected readonly error = signal('');
  protected readonly excelApi = inject(ExcelApi);
  private router = inject(Router);

  ngOnInit(): void {
    this.userFilesService.loadUserFiles();
  }

  protected createWorkbook(): void {
    const nextId =
      this.userFiles().workbooks.reduce((highest, workbook) => Math.max(highest, workbook.id), 0) +
      1;
    const workbook = this.workbookService.createWorkbook(nextId);
    workbook.name = 'Neue Arbeitsmappe';
    this.userFilesService.addWorkbooktoUserFiles(workbook);
    this.openWorkbook(workbook.id);
  }

  openWorkbook(id: number): void {
    const workbook = this.userFiles().workbooks.find((workbook) => workbook.id === id);
    if (!workbook) {
      return;
    }
    this.workbookService.newWorkBook(workbook);
    this.router.navigate(['/workbook', workbook.id], {
      state: { workbook: workbook },
    });
  }

  protected deleteWorkbook(id: number): void {
    this.userFilesService.deleteWorkbook(id);
  }


  protected importFile(file: File | null | undefined): void {
    if (!file || this.importing()) {
      return;
    }
    this.error.set('');
    this.importing.set(true);
    this.userFilesService.importSelected(file).pipe(
      finalize(() => this.importing.set(false)),
    ).subscribe({
      error: (error: unknown) => {
        this.error.set(
          error instanceof HttpErrorResponse && error.status === 0
            ? 'Der Server ist nicht erreichbar. Bitte prüfe, ob der Server läuft, und versuche es erneut.'
            : 'Die Datei konnte nicht importiert werden. Bitte versuche es erneut.',
        );
      },
      complete: () => {
        window.alert('Die Arbeitsmappe wurde erfolgreich importiert.');
      },
    });
  }
}
