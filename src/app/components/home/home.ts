import { Component } from '@angular/core';
import { Spreadsheet } from '../spreadsheet/spreadsheet';

@Component({
  selector: 'app-home',
  imports: [Spreadsheet],
  templateUrl: './home.html',
})
export class Home {}
