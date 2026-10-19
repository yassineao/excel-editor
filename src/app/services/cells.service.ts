import { Cell } from '../models/cells.model';

export class CellsService{

  cell: Cell;

  constructor(cell: Cell){
    this.cell = cell;
  }

  getCell(){
    return this.cell;
  }

  updateCell( cell: Cell){
   this.cell.value = cell.value;
  }

}
