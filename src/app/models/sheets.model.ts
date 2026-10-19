import { Cell } from './cells.model';

export interface Sheet {
  id: string;
  name: string;
  cells: Cell[][];
  rows: number;
  columns: number;
}
