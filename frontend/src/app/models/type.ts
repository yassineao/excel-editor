export enum Type {
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  NUMBER = 'NUMBER',
  FORMULA = 'FORMULA',
  NULL = 'NULL',
}

export function getCellType(value: string | number | boolean | null): Type {
  if (value === null) return Type.NULL;
  if (typeof value === 'number') return Type.NUMBER;
  if (typeof value === 'boolean') return Type.BOOLEAN;
  if (value.startsWith('=')) return Type.FORMULA;
  return Type.STRING;
}
