import { Component, computed, input } from '@angular/core';
import { Sheet } from '../../models/sheets.model';

@Component({
  selector: 'app-spreadsheet',
  templateUrl: './spreadsheet.html',
  styleUrl: './spreadsheet.css',
})
export class Spreadsheet {
  sheet = input.required<Sheet>();
  rows = computed(() => Array.from({ length: this.sheet().rows }, (_, i) => i));
  cols = computed(() => Array.from({ length: this.sheet().columns }, (_, i) => i));

  getColumnLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
