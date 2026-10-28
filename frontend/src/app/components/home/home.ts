import { Component } from '@angular/core';
import { WorkbookComponent } from '../workbook/workbook';

@Component({
  selector: 'app-home',
  imports: [WorkbookComponent],
  templateUrl: './home.html',
})
export class Home {}
