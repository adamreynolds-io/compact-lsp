import { Token, TokenKind, tokenize } from './lexer';
import { ParseResult } from './ast';
import { Scope, SymbolKind, SymbolInfo, resolveSymbol } from './symbols';
import { findScopeForPosition } from './utils';

// Token types — order matters (index used in encoding)
export const TOKEN_TYPES = [
  'keyword',
  'type',
  'function',
  'variable',
  'parameter',
  'struct',
  'enum',
  'namespace',
  'number',
  'string',
] as const;

export const TOKEN_MODIFIERS = ['declaration', 'readonly'] as const;

export type SemanticTokenType = (typeof TOKEN_TYPES)[number];
export type SemanticTokenModifier = (typeof TOKEN_MODIFIERS)[number];

export interface SemanticToken {
  line: number;
  startChar: number;
  length: number;
  tokenType: number;
  tokenModifiers: number;
}

const KEYWORD_TOKEN_KINDS = new Set<TokenKind>([
  TokenKind.Circuit,
  TokenKind.Ledger,
  TokenKind.Witness,
  TokenKind.Struct,
  TokenKind.Enum,
  TokenKind.Module,
  TokenKind.Export,
  TokenKind.Pure,
  TokenKind.Sealed,
  TokenKind.Const,
  TokenKind.Constructor,
  TokenKind.Contract,
  TokenKind.Pragma,
  TokenKind.Import,
  TokenKind.Include,
  TokenKind.Return,
  TokenKind.If,
  TokenKind.Else,
  TokenKind.For,
  TokenKind.Of,
  TokenKind.Assert,
  TokenKind.As,
  TokenKind.Type,
  TokenKind.New,
]);

const typeIndex = TOKEN_TYPES.indexOf('keyword');
const typeTypeIndex = TOKEN_TYPES.indexOf('type');
const functionIndex = TOKEN_TYPES.indexOf('function');
const variableIndex = TOKEN_TYPES.indexOf('variable');
const parameterIndex = TOKEN_TYPES.indexOf('parameter');
const structIndex = TOKEN_TYPES.indexOf('struct');
const enumIndex = TOKEN_TYPES.indexOf('enum');
const namespaceIndex = TOKEN_TYPES.indexOf('namespace');
const numberIndex = TOKEN_TYPES.indexOf('number');
const stringIndex = TOKEN_TYPES.indexOf('string');

const DECLARATION_BIT = 1 << TOKEN_MODIFIERS.indexOf('declaration');
const READONLY_BIT = 1 << TOKEN_MODIFIERS.indexOf('readonly');

const symbolKindToTokenType: Record<SymbolKind, number> = {
  circuit: functionIndex,
  witness: functionIndex,
  'builtin-function': functionIndex,
  struct: structIndex,
  enum: enumIndex,
  module: namespaceIndex,
  contract: namespaceIndex,
  parameter: parameterIndex,
  const: variableIndex,
  ledger: variableIndex,
  type: typeTypeIndex,
  'builtin-type': typeTypeIndex,
};

export function getSemanticTokens(
  parseResult: ParseResult,
  fileScope: Scope,
  source: string,
): SemanticToken[] {
  const tokens = tokenize(source);
  const result: SemanticToken[] = [];

  for (const token of tokens) {
    if (token.kind === TokenKind.EOF) continue;

    const classification = classifyToken(token, parseResult, fileScope);
    if (classification === undefined) continue;

    result.push({
      line: token.pos.line,
      startChar: token.pos.column,
      length: token.text.length,
      tokenType: classification.typeIndex,
      tokenModifiers: classification.modifiers,
    });
  }

  return result;
}

interface TokenClassification {
  typeIndex: number;
  modifiers: number;
}

function classifyToken(
  token: Token,
  parseResult: ParseResult,
  fileScope: Scope,
): TokenClassification | undefined {
  // Keywords
  if (KEYWORD_TOKEN_KINDS.has(token.kind)) {
    return { typeIndex: typeIndex, modifiers: 0 };
  }

  // Type keywords (Field, Boolean, etc.)
  if (token.kind === TokenKind.TypeKeyword) {
    return { typeIndex: typeTypeIndex, modifiers: 0 };
  }

  // Number literals
  if (token.kind === TokenKind.NumberLiteral) {
    return { typeIndex: numberIndex, modifiers: 0 };
  }

  // String literals
  if (token.kind === TokenKind.StringLiteral) {
    return { typeIndex: stringIndex, modifiers: 0 };
  }

  // Boolean literals
  if (token.kind === TokenKind.BooleanLiteral) {
    return { typeIndex: typeIndex, modifiers: 0 }; // keyword style
  }

  // Identifiers — resolve via symbol table
  if (token.kind === TokenKind.Identifier) {
    const scope = findScopeForPosition(
      fileScope,
      token.pos.line,
      token.pos.column,
      parseResult.sourceFile,
    );
    const symbol = resolveSymbol(token.text, scope);
    if (!symbol) return undefined;

    const tokenTypeIdx = symbolKindToTokenType[symbol.kind];
    if (tokenTypeIdx === undefined) return undefined;

    let modifiers = 0;

    // Declaration modifier: token is the name at the declaration site
    // The symbol's range covers the full declaration, but the name identifier
    // is somewhere within that range. We check if this token is within the
    // declaration range and is the first occurrence of the name on that line.
    if (isDeclarationSite(token, symbol)) {
      modifiers |= DECLARATION_BIT;
    }

    // Readonly modifier for const and ledger
    if (symbol.kind === 'const' || symbol.kind === 'ledger') {
      modifiers |= READONLY_BIT;
    }

    return { typeIndex: tokenTypeIdx, modifiers };
  }

  return undefined;
}

function isDeclarationSite(token: Token, symbol: SymbolInfo): boolean {
  // Built-ins have no declaration site
  if (symbol.kind === 'builtin-type' || symbol.kind === 'builtin-function') return false;

  // The declaration range start line should match the token's line
  // and the token should be within the declaration range
  const declRange = symbol.range;
  if (token.pos.line < declRange.start.line || token.pos.line > declRange.end.line) return false;

  // Check that the symbol's scope contains this symbol (i.e., this is the defining scope)
  const scopeSymbol = symbol.scope.symbols.get(symbol.name);
  if (scopeSymbol !== symbol) return false;

  // The token must be on the declaration's start line (where the name is defined)
  if (token.pos.line !== declRange.start.line) return false;

  // And the token must be after the start of the declaration
  if (token.pos.column < declRange.start.column) return false;

  return true;
}

export function encodeSemanticTokens(tokens: SemanticToken[]): number[] {
  // Sort by position
  const sorted = [...tokens].sort((a, b) => {
    if (a.line !== b.line) return a.line - b.line;
    return a.startChar - b.startChar;
  });

  const data: number[] = [];
  let prevLine = 0;
  let prevChar = 0;

  for (const token of sorted) {
    const deltaLine = token.line - prevLine;
    const deltaChar = deltaLine === 0 ? token.startChar - prevChar : token.startChar;

    data.push(deltaLine, deltaChar, token.length, token.tokenType, token.tokenModifiers);

    prevLine = token.line;
    prevChar = token.startChar;
  }

  return data;
}
