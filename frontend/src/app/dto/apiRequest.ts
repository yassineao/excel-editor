import {Sheet} from '../models/sheets.model';
import { Cell } from '../models/cells.model';



export interface ImportedWorkbook {
  name: string;
  sheets: {
    name: string;
    rows: number;
    cols: number;
    cells: Record<string, Cell>;
  }[];
}
