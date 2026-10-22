import { Component, input, output } from '@angular/core';
import { Sheet } from '../../models/sheets.model';

@Component({
  selector: 'app-toolbar',
  imports: [],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css',
})
export class Toolbar {
  readonly saveRequested = output<void>();
  readonly addRequest = output<void>();
  readonly newSheet = output<void>();
  readonly deleteSheet = output<void>();
  readonly sheets = input<Sheet[]>();
  readonly sheetSelected = output<string>();


}
