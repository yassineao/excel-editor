import type { StoredSheet } from './storedSheet.model';
import type { Workbook } from './workBook.model';

// Preserves workbook metadata while using the JSON storage format for each sheet.
export type StoredWorkbook = Omit<Workbook, 'sheets'> & { sheets: StoredSheet[] };
