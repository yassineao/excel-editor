import { Cell } from './cells.model';

export interface Sheet {
  id: string;
  name: string;
  // Zero-based "row,col" keys; missing entries represent empty cells.
  cells: Map<string, Cell>;
  rows: number;
  columns: number;
}
