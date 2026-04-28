export type Severity = 'error' | 'warning' | 'info';

export interface Violation {
  code: string;
  severity: Severity;
  message: string;
  file: string;
  specifier?: string;
  remedy?: string;
}

export interface ValidationCounts {
  errors: number;
  warnings: number;
  infos: number;
}

export interface ValidationReport {
  root: string;
  violations: Violation[];
  counts: ValidationCounts;
}

export type OwnerKind =
  | 'platform'
  | 'layout'
  | 'components'
  | 'hooks'
  | 'utils'
  | 'config'
  | 'styles'
  | 'assets'
  | 'unknown';

export type OwnerInfo =
  | {kind: 'module'; name: string}
  | {kind: OwnerKind};
