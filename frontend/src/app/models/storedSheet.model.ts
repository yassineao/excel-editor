import type { Cell } from './cells.model';
import type { Sheet } from './sheets.model';

// JSON storage format: replaces the cell Map with an array of [key, cell] entries.
export type StoredSheet = Omit<Sheet, 'cells'> & { cells: [string, Cell][] };
