import { Token, TokenKind } from './lexer';
import { SourceFile, Declaration, SourceRange } from './ast';
import { Scope } from './symbols';

export function findTokenAtPosition(
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

export function findScopeForPosition(
  fileScope: Scope,
  line: number,
  column: number,
  sourceFile: SourceFile,
): Scope {
  for (let i = 0; i < sourceFile.declarations.length; i++) {
    const decl = sourceFile.declarations[i];
    if (isPositionInRange(line, column, decl.range)) {
      const childScope = findChildScopeForDecl(fileScope, decl);
      if (childScope) return childScope;
    }
  }
  return fileScope;
}

export function findChildScopeForDecl(scope: Scope, decl: Declaration): Scope | undefined {
  if ('name' in decl && typeof decl.name === 'string') {
    return scope.children.find((c) => c.name === decl.name);
  }
  if (decl.kind === 'ConstructorDeclaration') {
    return scope.children.find((c) => c.name === '<constructor>');
  }
  return undefined;
}

export function isPositionInRange(line: number, column: number, range: SourceRange): boolean {
  if (line < range.start.line || line > range.end.line) return false;
  if (line === range.start.line && column < range.start.column) return false;
  if (line === range.end.line && column > range.end.column) return false;
  return true;
}
