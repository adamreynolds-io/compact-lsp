import { TokenKind, tokenize } from './lexer';
import { SourceRange } from './ast';
import { Scope, resolveSymbol, formatSignature } from './symbols';
import { ParseResult } from './ast';
import { findTokenAtPosition, findScopeForPosition } from './utils';

export interface HoverResult {
  contents: string;
  range: SourceRange;
}

export function getHoverInfo(
  parseResult: ParseResult,
  fileScope: Scope,
  line: number,
  column: number,
  source: string,
): HoverResult | undefined {
  // Find the token at position
  const tokens = tokenize(source);
  const token = findTokenAtPosition(tokens, line, column);
  if (!token) return undefined;

  // Only hover on identifiers and type keywords
  if (token.kind !== TokenKind.Identifier && token.kind !== TokenKind.TypeKeyword) {
    return undefined;
  }

  // Try to find the symbol this identifier refers to
  // First, determine the scope for this position
  const scope = findScopeForPosition(fileScope, line, column, parseResult.sourceFile);

  const symbol = resolveSymbol(token.text, scope);
  if (!symbol) return undefined;

  const signature = formatSignature(symbol);
  const tokenRange: SourceRange = {
    start: token.pos,
    end: {
      line: token.pos.line,
      column: token.pos.column + token.text.length,
      offset: token.pos.offset + token.text.length,
    },
  };

  return {
    contents: signature,
    range: tokenRange,
  };
}
