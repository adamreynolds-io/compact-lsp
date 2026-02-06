import { Token, TokenKind } from './lexer';
import { SourceRange, ParseResult } from './ast';
import { Scope, Reference, resolveSymbol } from './symbols';
import { findReferences } from './references';
import { findTokenAtPosition, findScopeForPosition } from './utils';

export interface PrepareRenameResult {
  range: SourceRange;
  placeholder: string;
}

export interface RenameEdit {
  range: SourceRange;
  newText: string;
}

export function prepareRename(
  parseResult: ParseResult,
  fileScope: Scope,
  references: Reference[],
  line: number,
  column: number,
  tokens: Token[],
): PrepareRenameResult | undefined {
  const token = findTokenAtPosition(tokens, line, column);
  if (!token) return undefined;

  if (token.kind !== TokenKind.Identifier && token.kind !== TokenKind.TypeKeyword) {
    return undefined;
  }

  // Use the reference list for precise scope resolution
  const ref = references.find(
    (r) =>
      r.name === token.text &&
      r.range.start.line === line &&
      r.range.start.column === token.pos.column,
  );
  const scope = ref
    ? ref.scope
    : findScopeForPosition(fileScope, line, column, parseResult.sourceFile);

  const symbol = resolveSymbol(token.text, scope);
  if (!symbol) return undefined;

  // Built-ins cannot be renamed
  if (symbol.kind === 'builtin-type' || symbol.kind === 'builtin-function') {
    return undefined;
  }

  const tokenRange: SourceRange = {
    start: token.pos,
    end: {
      line: token.pos.line,
      column: token.pos.column + token.text.length,
      offset: token.pos.offset + token.text.length,
    },
  };

  return {
    range: tokenRange,
    placeholder: token.text,
  };
}

export function getRenameEdits(
  parseResult: ParseResult,
  fileScope: Scope,
  references: Reference[],
  line: number,
  column: number,
  tokens: Token[],
  newName: string,
): RenameEdit[] {
  const ranges = findReferences(parseResult, fileScope, references, line, column, tokens, true);

  return ranges.map((range) => ({
    range,
    newText: newName,
  }));
}
