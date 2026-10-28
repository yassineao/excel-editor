import type { StoredWorkbook } from './storedWorkbook.model';
import type { UserFiles } from './userFiles.model';

// User files as stored in localStorage; cell entries must become Maps when loaded.
export type StoredUserFiles = Omit<UserFiles, 'workbooks'> & {
  workbooks: StoredWorkbook[];
};
