import { Sheet } from './sheets.model';

export interface Workbook {
  id: number;
  name: string;
  sheets: Sheet[];
}


