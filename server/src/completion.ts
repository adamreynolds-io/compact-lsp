import { SourceFile, Declaration, SourceRange, ParseResult } from './ast';
import { Scope, SymbolKind, formatSignature } from './symbols';

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

function findScopeForPosition(
  fileScope: Scope,
  line: number,
  column: number,
  sourceFile: SourceFile,
): Scope {
  // Find which declaration contains this position
  for (let i = 0; i < sourceFile.declarations.length; i++) {
    const decl = sourceFile.declarations[i];
    if (isPositionInRange(line, column, decl.range)) {
      // Check if this declaration has a child scope
      const childScope = findChildScopeForDecl(fileScope, decl);
      if (childScope) return childScope;
    }
  }
  return fileScope;
}

function findChildScopeForDecl(scope: Scope, decl: Declaration): Scope | undefined {
  if ('name' in decl && typeof decl.name === 'string') {
    return scope.children.find((c) => c.name === decl.name);
  }
  if (decl.kind === 'ConstructorDeclaration') {
    return scope.children.find((c) => c.name === '<constructor>');
  }
  return undefined;
}

function isPositionInRange(line: number, column: number, range: SourceRange): boolean {
  if (line < range.start.line || line > range.end.line) return false;
  if (line === range.start.line && column < range.start.column) return false;
  if (line === range.end.line && column > range.end.column) return false;
  return true;
}
