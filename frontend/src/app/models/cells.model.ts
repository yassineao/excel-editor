import { Type } from './type';


export interface Cell {
  value: string | number | boolean | null;
  type: Type;
  // Bold: boolean;
  // Italic: boolean;
  // Strike: boolean;
}
