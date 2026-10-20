import { Sheet } from './sheets.model';

export interface Workbook {
  id: string;
  name: string;
  sheets: Sheet[];
}
