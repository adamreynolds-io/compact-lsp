import { ParseError, SourceRange } from './ast';
import { Reference, Scope, resolveSymbol } from './symbols';

export interface Diagnostic {
  message: string;
  range: SourceRange;
  severity: 'error' | 'warning' | 'information';
  source: string;
  code?: string;
}

export function computeDiagnostics(
  parseErrors: ParseError[],
  references?: Reference[],
  fileScope?: Scope,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const error of parseErrors) {
    diagnostics.push({
      message: error.message,
      range: error.range,
      severity: 'error',
      source: 'compact-lsp',
    });
  }

  // Report undefined references
  if (references && fileScope) {
    for (const ref of references) {
      const resolved = resolveSymbol(ref.name, ref.scope);
      if (!resolved) {
        diagnostics.push({
          message: `'${ref.name}' is not defined`,
          range: ref.range,
          severity: 'error',
          source: 'compact-lsp',
          code: 'undefined-reference',
        });
      }
    }
  }

  return diagnostics;
}
