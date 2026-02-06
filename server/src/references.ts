import { Token, TokenKind, tokenize } from './lexer';
import { SourceFile, Declaration, SourceRange, ParseResult } from './ast';
import { Scope, resolveSymbol, Reference } from './symbols';

export function findReferences(
  parseResult: ParseResult,
  fileScope: Scope,
  references: Reference[],
  line: number,
  column: number,
  source: string,
  includeDeclaration: boolean,
): SourceRange[] {
  // Find the token at position
  const tokens = tokenize(source);
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

function findTokenAtPosition(tokens: Token[], line: number, column: number): Token | undefined {
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
