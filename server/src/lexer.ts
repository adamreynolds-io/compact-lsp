export enum TokenKind {
  // Keywords
  Circuit = 'Circuit',
  Ledger = 'Ledger',
  Witness = 'Witness',
  Struct = 'Struct',
  Enum = 'Enum',
  Module = 'Module',
  Export = 'Export',
  Pure = 'Pure',
  Sealed = 'Sealed',
  Const = 'Const',
  Constructor = 'Constructor',
  Contract = 'Contract',
  Pragma = 'Pragma',
  Import = 'Import',
  Include = 'Include',
  Return = 'Return',
  If = 'If',
  Else = 'Else',
  For = 'For',
  Of = 'Of',
  Assert = 'Assert',
  As = 'As',
  Type = 'Type',
  New = 'New',

  // Built-in type keywords
  TypeKeyword = 'TypeKeyword',

  // Literals
  Identifier = 'Identifier',
  NumberLiteral = 'NumberLiteral',
  StringLiteral = 'StringLiteral',
  BooleanLiteral = 'BooleanLiteral',

  // Punctuation
  OpenBrace = 'OpenBrace',
  CloseBrace = 'CloseBrace',
  OpenParen = 'OpenParen',
  CloseParen = 'CloseParen',
  OpenBracket = 'OpenBracket',
  CloseBracket = 'CloseBracket',
  LessThan = 'LessThan',
  GreaterThan = 'GreaterThan',
  Colon = 'Colon',
  Semicolon = 'Semicolon',
  Comma = 'Comma',
  Dot = 'Dot',
  Hash = 'Hash',
  Question = 'Question',

  // Operators
  Equals = 'Equals',
  Plus = 'Plus',
  Minus = 'Minus',
  Star = 'Star',
  Bang = 'Bang',
  Arrow = 'Arrow',
  DotDot = 'DotDot',
  Ellipsis = 'Ellipsis',
  DoubleEquals = 'DoubleEquals',
  NotEquals = 'NotEquals',
  LessEquals = 'LessEquals',
  GreaterEquals = 'GreaterEquals',
  And = 'And',
  Or = 'Or',
  PlusEquals = 'PlusEquals',
  MinusEquals = 'MinusEquals',

  // Special
  EOF = 'EOF',
  Unknown = 'Unknown',
}

export interface Position {
  line: number;
  column: number;
  offset: number;
}

export interface Token {
  kind: TokenKind;
  text: string;
  pos: Position;
}

const KEYWORDS: Record<string, TokenKind> = {
  circuit: TokenKind.Circuit,
  ledger: TokenKind.Ledger,
  witness: TokenKind.Witness,
  struct: TokenKind.Struct,
  enum: TokenKind.Enum,
  module: TokenKind.Module,
  export: TokenKind.Export,
  pure: TokenKind.Pure,
  sealed: TokenKind.Sealed,
  const: TokenKind.Const,
  constructor: TokenKind.Constructor,
  contract: TokenKind.Contract,
  pragma: TokenKind.Pragma,
  import: TokenKind.Import,
  include: TokenKind.Include,
  return: TokenKind.Return,
  if: TokenKind.If,
  else: TokenKind.Else,
  for: TokenKind.For,
  of: TokenKind.Of,
  assert: TokenKind.Assert,
  as: TokenKind.As,
  type: TokenKind.Type,
  new: TokenKind.New,
  true: TokenKind.BooleanLiteral,
  false: TokenKind.BooleanLiteral,
};

const TYPE_KEYWORDS = new Set(['Field', 'Boolean', 'Uint', 'Bytes', 'Vector', 'Opaque', 'Void']);

function isAlpha(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$';
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isHexDigit(ch: string): boolean {
  return isDigit(ch) || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F');
}

function isBinaryDigit(ch: string): boolean {
  return ch === '0' || ch === '1';
}

function isOctalDigit(ch: string): boolean {
  return ch >= '0' && ch <= '7';
}

function isAlphaNumeric(ch: string): boolean {
  return isAlpha(ch) || isDigit(ch);
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let offset = 0;
  let line = 0;
  let column = 0;

  function peek(): string {
    return offset < source.length ? source[offset] : '\0';
  }

  function peekNext(): string {
    return offset + 1 < source.length ? source[offset + 1] : '\0';
  }

  function advance(): string {
    const ch = source[offset];
    offset++;
    if (ch === '\n') {
      line++;
      column = 0;
    } else {
      column++;
    }
    return ch;
  }

  function makeToken(kind: TokenKind, text: string, startPos: Position): Token {
    return { kind, text, pos: startPos };
  }

  function currentPos(): Position {
    return { line, column, offset };
  }

  while (offset < source.length) {
    const ch = peek();

    // Skip whitespace
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      advance();
      continue;
    }

    // Skip line comments
    if (ch === '/' && peekNext() === '/') {
      while (offset < source.length && peek() !== '\n') {
        advance();
      }
      continue;
    }

    const startPos = currentPos();

    // Identifiers and keywords
    if (isAlpha(ch)) {
      let text = '';
      while (offset < source.length && isAlphaNumeric(peek())) {
        text += advance();
      }

      if (TYPE_KEYWORDS.has(text)) {
        tokens.push(makeToken(TokenKind.TypeKeyword, text, startPos));
      } else if (KEYWORDS[text] !== undefined) {
        tokens.push(makeToken(KEYWORDS[text], text, startPos));
      } else {
        tokens.push(makeToken(TokenKind.Identifier, text, startPos));
      }
      continue;
    }

    // Number literals
    if (isDigit(ch)) {
      let text = '';
      if (ch === '0' && (peekNext() === 'x' || peekNext() === 'X')) {
        // Hex literal: 0x...
        text += advance(); // '0'
        text += advance(); // 'x' or 'X'
        while (offset < source.length && isHexDigit(peek())) {
          text += advance();
        }
      } else if (ch === '0' && (peekNext() === 'b' || peekNext() === 'B')) {
        // Binary literal: 0b...
        text += advance(); // '0'
        text += advance(); // 'b' or 'B'
        while (offset < source.length && isBinaryDigit(peek())) {
          text += advance();
        }
      } else if (ch === '0' && (peekNext() === 'o' || peekNext() === 'O')) {
        // Octal literal: 0o...
        text += advance(); // '0'
        text += advance(); // 'o' or 'O'
        while (offset < source.length && isOctalDigit(peek())) {
          text += advance();
        }
      } else {
        // Decimal literal
        while (offset < source.length && isDigit(peek())) {
          text += advance();
        }
      }
      tokens.push(makeToken(TokenKind.NumberLiteral, text, startPos));
      continue;
    }

    // String literals (double-quoted or single-quoted)
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let text = '';
      text += advance(); // opening quote
      while (offset < source.length && peek() !== quote && peek() !== '\n') {
        if (peek() === '\\') {
          text += advance(); // backslash
        }
        text += advance();
      }
      if (peek() === quote) {
        text += advance(); // closing quote
      }
      tokens.push(makeToken(TokenKind.StringLiteral, text, startPos));
      continue;
    }

    // Multi-character operators and punctuation
    advance(); // consume the character

    switch (ch) {
      case '{':
        tokens.push(makeToken(TokenKind.OpenBrace, '{', startPos));
        break;
      case '}':
        tokens.push(makeToken(TokenKind.CloseBrace, '}', startPos));
        break;
      case '(':
        tokens.push(makeToken(TokenKind.OpenParen, '(', startPos));
        break;
      case ')':
        tokens.push(makeToken(TokenKind.CloseParen, ')', startPos));
        break;
      case '[':
        tokens.push(makeToken(TokenKind.OpenBracket, '[', startPos));
        break;
      case ']':
        tokens.push(makeToken(TokenKind.CloseBracket, ']', startPos));
        break;
      case ':':
        tokens.push(makeToken(TokenKind.Colon, ':', startPos));
        break;
      case ';':
        tokens.push(makeToken(TokenKind.Semicolon, ';', startPos));
        break;
      case ',':
        tokens.push(makeToken(TokenKind.Comma, ',', startPos));
        break;
      case '#':
        tokens.push(makeToken(TokenKind.Hash, '#', startPos));
        break;
      case '?':
        tokens.push(makeToken(TokenKind.Question, '?', startPos));
        break;
      case '.':
        if (peek() === '.' && peekNext() === '.') {
          advance();
          advance();
          tokens.push(makeToken(TokenKind.Ellipsis, '...', startPos));
        } else if (peek() === '.') {
          advance();
          tokens.push(makeToken(TokenKind.DotDot, '..', startPos));
        } else {
          tokens.push(makeToken(TokenKind.Dot, '.', startPos));
        }
        break;
      case '=':
        if (peek() === '>') {
          advance();
          tokens.push(makeToken(TokenKind.Arrow, '=>', startPos));
        } else if (peek() === '=') {
          advance();
          tokens.push(makeToken(TokenKind.DoubleEquals, '==', startPos));
        } else {
          tokens.push(makeToken(TokenKind.Equals, '=', startPos));
        }
        break;
      case '+':
        if (peek() === '=') {
          advance();
          tokens.push(makeToken(TokenKind.PlusEquals, '+=', startPos));
        } else {
          tokens.push(makeToken(TokenKind.Plus, '+', startPos));
        }
        break;
      case '-':
        if (peek() === '=') {
          advance();
          tokens.push(makeToken(TokenKind.MinusEquals, '-=', startPos));
        } else {
          tokens.push(makeToken(TokenKind.Minus, '-', startPos));
        }
        break;
      case '*':
        tokens.push(makeToken(TokenKind.Star, '*', startPos));
        break;
      case '!':
        if (peek() === '=') {
          advance();
          tokens.push(makeToken(TokenKind.NotEquals, '!=', startPos));
        } else {
          tokens.push(makeToken(TokenKind.Bang, '!', startPos));
        }
        break;
      case '<':
        if (peek() === '=') {
          advance();
          tokens.push(makeToken(TokenKind.LessEquals, '<=', startPos));
        } else {
          tokens.push(makeToken(TokenKind.LessThan, '<', startPos));
        }
        break;
      case '>':
        if (peek() === '=') {
          advance();
          tokens.push(makeToken(TokenKind.GreaterEquals, '>=', startPos));
        } else {
          tokens.push(makeToken(TokenKind.GreaterThan, '>', startPos));
        }
        break;
      case '&':
        if (peek() === '&') {
          advance();
          tokens.push(makeToken(TokenKind.And, '&&', startPos));
        } else {
          tokens.push(makeToken(TokenKind.Unknown, '&', startPos));
        }
        break;
      case '|':
        if (peek() === '|') {
          advance();
          tokens.push(makeToken(TokenKind.Or, '||', startPos));
        } else {
          tokens.push(makeToken(TokenKind.Unknown, '|', startPos));
        }
        break;
      default:
        tokens.push(makeToken(TokenKind.Unknown, ch, startPos));
        break;
    }
  }

  tokens.push(makeToken(TokenKind.EOF, '', currentPos()));
  return tokens;
}
