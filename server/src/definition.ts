import { Token, TokenKind } from './lexer';
import { SourceRange, ParseResult } from './ast';
import { Scope, Reference, resolveSymbol } from './symbols';
import { findTokenAtPosition, findScopeForPosition } from './utils';

export interface DefinitionResult {
  range: SourceRange;
}

export function getDefinition(
  parseResult: ParseResult,
  fileScope: Scope,
  references: Reference[],
  line: number,
  column: number,
  tokens: Token[],
): DefinitionResult | undefined {
  // Find the token at position
  const token = findTokenAtPosition(tokens, line, column);
  if (!token) return undefined;

  // Only handle identifiers and type keywords
  if (token.kind !== TokenKind.Identifier && token.kind !== TokenKind.TypeKeyword) {
    return undefined;
  }

  // Use the reference list for precise scope resolution (handles nested scopes like for-loops)
  // Fall back to declaration-level scope resolution
  const ref = references.find(
    (r) =>
      r.name === token.text &&
      r.range.start.line === line &&
      r.range.start.column === token.pos.column,
  );
  const scope = ref
    ? ref.scope
    : findScopeForPosition(fileScope, line, column, parseResult.sourceFile);

  // Resolve the symbol
  const symbol = resolveSymbol(token.text, scope);
  if (!symbol) return undefined;

  // Built-in types/functions have no source location
  if (symbol.kind === 'builtin-type' || symbol.kind === 'builtin-function') {
    return undefined;
  }

  // Return the declaration's source range
  return {
    range: symbol.range,
  };
}
