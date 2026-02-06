import { ParseResult } from './ast';
import { Scope, SymbolKind, formatSignature } from './symbols';
import { findScopeForPosition } from './utils';
import { WorkspaceIndex } from './workspaceIndex';

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
  workspaceIndex?: WorkspaceIndex,
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

        let detail = formatSignature(symbol);

        // If symbol is imported and resolved, show source module info
        if (symbol.resolvedUri && symbol.resolvedName && workspaceIndex) {
          const targetEntry = workspaceIndex.getFileEntry(symbol.resolvedUri);
          if (targetEntry) {
            const targetSym = targetEntry.exports.get(symbol.resolvedName);
            if (targetSym) {
              detail = formatSignature(targetSym) + ` (from ${targetEntry.moduleName})`;
            }
          }
        }

        items.push({
          label: name,
          kind: symbol.kind,
          detail,
        });
      }
    }
    current = current.parent;
  }

  return items;
}
