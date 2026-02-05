import { Token, TokenKind, tokenize } from './lexer';
import { SourceFile, Declaration, Parameter, SourceRange } from './ast';
import { Scope, SymbolInfo, resolveSymbol, formatSignature, buildSymbolTable } from './symbols';
import { ParseResult } from './ast';

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

function findTokenAtPosition(
  tokens: Token[],
  line: number,
  column: number,
): Token | undefined {
  for (const token of tokens) {
    if (token.kind === TokenKind.EOF) continue;
    const tokenEnd = token.pos.column + token.text.length;
    if (token.pos.line === line && column >= token.pos.column && column < tokenEnd) {
      return token;
    }
  }
  return undefined;
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

function findChildScopeForDecl(
  scope: Scope,
  decl: Declaration,
): Scope | undefined {
  if ('name' in decl && typeof decl.name === 'string') {
    return scope.children.find((c) => c.name === decl.name);
  }
  if (decl.kind === 'ConstructorDeclaration') {
    return scope.children.find((c) => c.name === '<constructor>');
  }
  return undefined;
}

function isPositionInRange(
  line: number,
  column: number,
  range: SourceRange,
): boolean {
  if (line < range.start.line || line > range.end.line) return false;
  if (line === range.start.line && column < range.start.column) return false;
  if (line === range.end.line && column > range.end.column) return false;
  return true;
}
