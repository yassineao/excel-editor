import { TypeModel } from './type.model';


export interface Cell {
  value: string | number | boolean | null;
  type: TypeModel;
  // Bold: boolean;
  // Italic: boolean;
  // Strike: boolean;
}
