import { ParseResult } from './ast';
import { Scope, SymbolKind, formatSignature } from './symbols';
import { findScopeForPosition } from './utils';

export interface CompletionItem {
  label: string;
  kind: SymbolKind;
  detail: string;
}

export function getCompletions(
  parseResult: ParseResult,
  fileScope: Scope,
  line: number,
  column: number,
): CompletionItem[] {
  // Find the enclosing scope at cursor position
  const scope = findScopeForPosition(fileScope, line, column, parseResult.sourceFile);

  // Walk scope chain up to root, collecting all visible symbols
  const seen = new Set<string>();
  const items: CompletionItem[] = [];

  let current: Scope | undefined = scope;
  while (current) {
    for (const [name, symbol] of current.symbols) {
      // Only include each name once (innermost scope wins)
      if (!seen.has(name)) {
        seen.add(name);
        items.push({
          label: name,
          kind: symbol.kind,
          detail: formatSignature(symbol),
        });
      }
    }
    current = current.parent;
  }

  return items;
}
