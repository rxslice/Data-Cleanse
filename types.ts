
export type DataRow = Record<string, any>;

export enum AppStep {
  UPLOAD = 1,
  PREVIEW = 2,
  CLEANSE = 3,
  DOWNLOAD = 4,
}

export enum TransformationType {
  DEDUPLICATE = 'deduplicate',
  CASE = 'case',
  TRIM = 'trim',
  FIND_REPLACE = 'find_replace',
  MASK = 'mask',
  VALIDATE_FORMAT = 'validate_format',
  // PRO Features
  FUZZY_MATCH = 'fuzzy_match',
  ADVANCED_MASK = 'advanced_mask',
  REGEX_VALIDATE = 'regex_validate',
}

export interface Transformation {
  id: string;
  type: TransformationType;
  column: string;
  options: any;
  isPro: boolean;
  explanation?: string;
}

export interface ColumnProfile {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'unknown';
  uniqueCount: number;
  nullCount: number;
  sampleValues: any[];
  min?: number | string;
  max?: number | string;
  avg?: number;
}

export interface CleanseSummary {
  rowsRemoved: number;
  cellsModified: number;
  originalRowCount: number;
  finalRowCount: number;
}
