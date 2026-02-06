import { Token, TokenKind } from './lexer';
import { SourceRange, ParseResult } from './ast';
import { Scope, resolveSymbol, Reference } from './symbols';
import { findTokenAtPosition, findScopeForPosition } from './utils';

export function findReferences(
  parseResult: ParseResult,
  fileScope: Scope,
  references: Reference[],
  line: number,
  column: number,
  tokens: Token[],
  includeDeclaration: boolean,
): SourceRange[] {
  // Find the token at position
  const token = findTokenAtPosition(tokens, line, column);
  if (!token) return [];

  // Only handle identifiers and type keywords
  if (token.kind !== TokenKind.Identifier && token.kind !== TokenKind.TypeKeyword) {
    return [];
  }

  // Determine the scope for this position
  const scope = findScopeForPosition(fileScope, line, column, parseResult.sourceFile);

  // Resolve the symbol under cursor to its declaration
  const symbol = resolveSymbol(token.text, scope);
  if (!symbol) return [];

  const result: SourceRange[] = [];

  // Optionally include the declaration itself
  if (includeDeclaration && symbol.declaration !== undefined) {
    result.push(symbol.range);
  }

  // Scan references: for each reference, resolve it in its scope and check
  // if it resolves to the same declaration (same SymbolInfo object)
  for (const ref of references) {
    if (ref.name !== symbol.name) continue;

    const resolved = resolveSymbol(ref.name, ref.scope);
    if (resolved === symbol) {
      result.push(ref.range);
    }
  }

  return result;
}
