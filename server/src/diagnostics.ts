import { ParseError, SourceRange } from './ast';

export interface Diagnostic {
  message: string;
  range: SourceRange;
  severity: 'error' | 'warning';
  source: string;
}

export function computeDiagnostics(parseErrors: ParseError[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const error of parseErrors) {
    diagnostics.push({
      message: error.message,
      range: error.range,
      severity: 'error',
      source: 'compact-lsp',
    });
  }

  return diagnostics;
}
