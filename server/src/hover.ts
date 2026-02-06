import { Token, TokenKind } from './lexer';
import { SourceRange } from './ast';
import { Scope, resolveSymbol, formatSignature } from './symbols';
import { ParseResult } from './ast';
import { findTokenAtPosition, findScopeForPosition } from './utils';
import { WorkspaceIndex } from './workspaceIndex';

export interface HoverResult {
  contents: string;
  range: SourceRange;
}

export function getHoverInfo(
  parseResult: ParseResult,
  fileScope: Scope,
  line: number,
  column: number,
  tokens: Token[],
  workspaceIndex?: WorkspaceIndex,
): HoverResult | undefined {
  // Find the token at position
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

  const tokenRange: SourceRange = {
    start: token.pos,
    end: {
      line: token.pos.line,
      column: token.pos.column + token.text.length,
      offset: token.pos.offset + token.text.length,
    },
  };

  // Cross-file: if the symbol has a resolved URI, show the source symbol's signature
  if (symbol.resolvedUri && symbol.resolvedName && workspaceIndex) {
    const targetEntry = workspaceIndex.getFileEntry(symbol.resolvedUri);
    if (targetEntry) {
      const targetSym = targetEntry.exports.get(symbol.resolvedName);
      if (targetSym) {
        return {
          contents: formatSignature(targetSym),
          range: tokenRange,
        };
      }
    }
    // Unresolvable import — show import info
    return {
      contents: `import ${symbol.name} from ${symbol.resolvedName} (unresolved)`,
      range: tokenRange,
    };
  }

  const signature = formatSignature(symbol);

  return {
    contents: signature,
    range: tokenRange,
  };
}
