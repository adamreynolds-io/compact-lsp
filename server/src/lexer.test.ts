import { describe, it, expect } from 'vitest';
import { tokenize, TokenKind } from './lexer';

function kinds(source: string): TokenKind[] {
  return tokenize(source)
    .filter((t) => t.kind !== TokenKind.EOF)
    .map((t) => t.kind);
}

function texts(source: string): string[] {
  return tokenize(source)
    .filter((t) => t.kind !== TokenKind.EOF)
    .map((t) => t.text);
}

describe('Lexer', () => {
  describe('keywords', () => {
    it('tokenizes all keywords', () => {
      const keywords = [
        'circuit',
        'ledger',
        'witness',
        'struct',
        'enum',
        'module',
        'export',
        'pure',
        'sealed',
        'const',
        'constructor',
        'contract',
        'pragma',
        'import',
        'include',
        'return',
        'if',
        'else',
        'for',
        'of',
        'assert',
        'as',
        'type',
        'new',
      ];
      const source = keywords.join(' ');
      const tokens = tokenize(source).filter((t) => t.kind !== TokenKind.EOF);
      expect(tokens).toHaveLength(keywords.length);
      for (const token of tokens) {
        expect(token.kind).not.toBe(TokenKind.Identifier);
      }
    });

    it('distinguishes keywords from identifiers', () => {
      expect(kinds('circuit myCircuit')).toEqual([TokenKind.Circuit, TokenKind.Identifier]);
    });
  });

  describe('identifiers', () => {
    it('tokenizes identifiers', () => {
      expect(kinds('myCircuit _x foo123')).toEqual([
        TokenKind.Identifier,
        TokenKind.Identifier,
        TokenKind.Identifier,
      ]);
      expect(texts('myCircuit _x foo123')).toEqual(['myCircuit', '_x', 'foo123']);
    });
  });

  describe('type keywords', () => {
    it('tokenizes built-in type names', () => {
      const types = ['Field', 'Boolean', 'Uint', 'Bytes', 'Vector', 'Opaque', 'Void'];
      for (const t of types) {
        expect(kinds(t)).toEqual([TokenKind.TypeKeyword]);
      }
    });
  });

  describe('literals', () => {
    it('tokenizes numeric literals', () => {
      expect(kinds('42 0 1000')).toEqual([
        TokenKind.NumberLiteral,
        TokenKind.NumberLiteral,
        TokenKind.NumberLiteral,
      ]);
      expect(texts('42 0 1000')).toEqual(['42', '0', '1000']);
    });

    it('tokenizes string literals', () => {
      expect(kinds('"hello"')).toEqual([TokenKind.StringLiteral]);
      expect(texts('"hello"')).toEqual(['"hello"']);
    });

    it('tokenizes boolean literals', () => {
      expect(kinds('true false')).toEqual([TokenKind.BooleanLiteral, TokenKind.BooleanLiteral]);
    });
  });

  describe('punctuation and operators', () => {
    it('tokenizes single-character punctuation', () => {
      expect(kinds('{ } ( ) [ ] < > : ; , . = + - * ! ? #')).toEqual([
        TokenKind.OpenBrace,
        TokenKind.CloseBrace,
        TokenKind.OpenParen,
        TokenKind.CloseParen,
        TokenKind.OpenBracket,
        TokenKind.CloseBracket,
        TokenKind.LessThan,
        TokenKind.GreaterThan,
        TokenKind.Colon,
        TokenKind.Semicolon,
        TokenKind.Comma,
        TokenKind.Dot,
        TokenKind.Equals,
        TokenKind.Plus,
        TokenKind.Minus,
        TokenKind.Star,
        TokenKind.Bang,
        TokenKind.Question,
        TokenKind.Hash,
      ]);
    });

    it('tokenizes multi-character operators', () => {
      expect(kinds('=> .. ... == != <= >= && || += -=')).toEqual([
        TokenKind.Arrow,
        TokenKind.DotDot,
        TokenKind.Ellipsis,
        TokenKind.DoubleEquals,
        TokenKind.NotEquals,
        TokenKind.LessEquals,
        TokenKind.GreaterEquals,
        TokenKind.And,
        TokenKind.Or,
        TokenKind.PlusEquals,
        TokenKind.MinusEquals,
      ]);
    });
  });

  describe('comments', () => {
    it('skips line comments', () => {
      expect(kinds('circuit // this is a comment\nledger')).toEqual([
        TokenKind.Circuit,
        TokenKind.Ledger,
      ]);
    });

    it('skips comment at end of input', () => {
      expect(kinds('circuit // comment')).toEqual([TokenKind.Circuit]);
    });
  });

  describe('whitespace', () => {
    it('skips spaces, tabs, newlines', () => {
      expect(kinds('circuit \t\n  ledger')).toEqual([TokenKind.Circuit, TokenKind.Ledger]);
    });
  });

  describe('position tracking', () => {
    it('tracks line and column', () => {
      const tokens = tokenize('circuit\nledger');
      expect(tokens[0].pos).toEqual({ line: 0, column: 0, offset: 0 });
      expect(tokens[1].pos).toEqual({ line: 1, column: 0, offset: 8 });
    });

    it('tracks column within a line', () => {
      const tokens = tokenize('circuit foo');
      expect(tokens[0].pos).toEqual({ line: 0, column: 0, offset: 0 });
      expect(tokens[1].pos).toEqual({ line: 0, column: 8, offset: 8 });
    });
  });

  describe('complete example', () => {
    it('tokenizes a circuit definition', () => {
      const source = 'export pure circuit add(x: Field, y: Field) : Field { }';
      const k = kinds(source);
      expect(k).toEqual([
        TokenKind.Export,
        TokenKind.Pure,
        TokenKind.Circuit,
        TokenKind.Identifier,
        TokenKind.OpenParen,
        TokenKind.Identifier,
        TokenKind.Colon,
        TokenKind.TypeKeyword,
        TokenKind.Comma,
        TokenKind.Identifier,
        TokenKind.Colon,
        TokenKind.TypeKeyword,
        TokenKind.CloseParen,
        TokenKind.Colon,
        TokenKind.TypeKeyword,
        TokenKind.OpenBrace,
        TokenKind.CloseBrace,
      ]);
    });
  });
});
