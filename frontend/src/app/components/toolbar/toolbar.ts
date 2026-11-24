import { Component, input, output } from '@angular/core';
import { signal } from '@angular/core';
import { Sheet } from '../../models/sheets.model';


@Component({
  selector: 'app-toolbar',
  imports: [],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css',
})
export class Toolbar {
  selectedFile = signal<File | null>(null);

  readonly saveRequested = output<void>();
  readonly addRequest = output<void>();
  readonly newSheet = output<void>();
  readonly deleteSheet = output<void>();
  readonly sheets = input<Sheet[]>();
  readonly sheetSelected = output<string>();
  readonly sheetRenamed = output<{ id: string; name: string }>();
  readonly editingSheetId = signal<string | null>(null);

  startRename(sheet: Sheet, input: HTMLInputElement): void {
    this.editingSheetId.set(sheet.id);
    input.focus();
    input.select();
  }

  finishRename(sheet: Sheet, input: HTMLInputElement): void {
    if (this.editingSheetId() !== sheet.id) return;
    this.editingSheetId.set(null);
    const name = input.value.trim();
    if (name && name !== sheet.name) {
      this.sheetRenamed.emit({ id: sheet.id, name });
    } else {
      input.value = sheet.name;
    }
  }



  readonly importSelected = output<File>();
  readonly exportSelected = output<void>();

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
  }

  importFile(): void {
    const file = this.selectedFile();

    if (!file) return;

    this.importSelected.emit(file);
  }
}
