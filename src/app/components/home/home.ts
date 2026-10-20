import { Component } from '@angular/core';
import { Workbook } from '../workbook/workbook';

@Component({
  selector: 'app-home',
  imports: [Workbook],
  templateUrl: './home.html',
})
export class Home {}
