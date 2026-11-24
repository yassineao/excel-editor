export enum TypeModel {
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  NUMBER = 'NUMBER',
  FORMULA = 'FORMULA',
  NULL = 'NULL',
}

export function getCellType(value: string | number | boolean | null): TypeModel {
  if (value === null) return TypeModel.NULL;
  if (typeof value === 'number') return TypeModel.NUMBER;
  if (typeof value === 'boolean') return TypeModel.BOOLEAN;
  if (value.startsWith('=')) return TypeModel.FORMULA;
  return TypeModel.STRING;
}
