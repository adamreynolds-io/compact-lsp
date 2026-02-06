import { describe, it, expect } from 'vitest';
import { tokenize } from '../lexer';
import { parse } from '../parser';
import { buildSymbolTable } from '../symbols';
import {
  getSemanticTokens,
  encodeSemanticTokens,
  TOKEN_TYPES,
  TOKEN_MODIFIERS,
} from '../semanticTokens';

const typeIdx = (name: string) => TOKEN_TYPES.indexOf(name as (typeof TOKEN_TYPES)[number]);
const modIdx = (name: string) => TOKEN_MODIFIERS.indexOf(name as (typeof TOKEN_MODIFIERS)[number]);
const DECL_BIT = 1 << modIdx('declaration');
const READONLY_BIT = 1 << modIdx('readonly');

function tokens(source: string) {
  const parseResult = parse(source);
  const { fileScope } = buildSymbolTable(parseResult.sourceFile);
  const lexTokens = tokenize(source);
  return getSemanticTokens(parseResult, fileScope, lexTokens);
}

function findToken(source: string, text: string, occurrence = 0) {
  const all = tokens(source);
  const lines = source.split('\n');
  let count = 0;
  for (const tok of all) {
    const line = lines[tok.line];
    const extracted = line.substring(tok.startChar, tok.startChar + tok.length);
    if (extracted === text) {
      if (count === occurrence) return tok;
      count++;
    }
  }
  return undefined;
}

describe('Semantic Tokens', () => {
  describe('keyword classification', () => {
    it('classifies circuit keyword as keyword', () => {
      const tok = findToken('circuit add(x: Field) : Field { return x; }', 'circuit');
      expect(tok).toBeDefined();
      expect(tok!.tokenType).toBe(typeIdx('keyword'));
    });

    it('classifies return keyword as keyword', () => {
      const tok = findToken('circuit add(x: Field) : Field { return x; }', 'return');
      expect(tok).toBeDefined();
      expect(tok!.tokenType).toBe(typeIdx('keyword'));
    });

    it('classifies struct keyword as keyword', () => {
      const tok = findToken('struct Point { x: Field; }', 'struct');
      expect(tok).toBeDefined();
      expect(tok!.tokenType).toBe(typeIdx('keyword'));
    });

    it('classifies export keyword as keyword', () => {
      const tok = findToken('export circuit add(x: Field) : Field { return x; }', 'export');
      expect(tok).toBeDefined();
      expect(tok!.tokenType).toBe(typeIdx('keyword'));
    });
  });

  describe('type keyword classification', () => {
    it('classifies Field as type', () => {
      const tok = findToken('circuit add(x: Field) : Field { return x; }', 'Field');
      expect(tok).toBeDefined();
      expect(tok!.tokenType).toBe(typeIdx('type'));
    });

    it('classifies Boolean as type', () => {
      const tok = findToken('circuit test(x: Boolean) : Boolean { return x; }', 'Boolean');
      expect(tok).toBeDefined();
      expect(tok!.tokenType).toBe(typeIdx('type'));
    });
  });

  describe('literal classification', () => {
    it('classifies number literals as number', () => {
      const numTok = findToken('circuit foo() : Field { return 42; }', '42');
      expect(numTok).toBeDefined();
      expect(numTok!.tokenType).toBe(typeIdx('number'));
    });

    it('classifies string literals as string', () => {
      // Strings appear in pragmas
      const allTokens = tokens('#pragma version "1.0";');
      const strTok = allTokens.find((t) => t.tokenType === typeIdx('string'));
      expect(strTok).toBeDefined();
    });

    it('classifies boolean literals as keyword', () => {
      const tok = findToken('circuit foo() : Boolean { return true; }', 'true');
      expect(tok).toBeDefined();
      expect(tok!.tokenType).toBe(typeIdx('keyword'));
    });
  });

  describe('identifier classification', () => {
    it('classifies circuit name as function', () => {
      const source =
        'circuit add(x: Field) : Field { return x; }\ncircuit main() : Field { return add(1); }';
      // The reference to 'add' on line 1
      const tok = findToken(source, 'add', 1);
      expect(tok).toBeDefined();
      expect(tok!.tokenType).toBe(typeIdx('function'));
    });

    it('classifies struct name as struct', () => {
      const source = 'struct Point { x: Field; }';
      const tok = findToken(source, 'Point');
      expect(tok).toBeDefined();
      expect(tok!.tokenType).toBe(typeIdx('struct'));
    });

    it('classifies enum name as enum', () => {
      const source = 'enum Color { red, green, blue }';
      const tok = findToken(source, 'Color');
      expect(tok).toBeDefined();
      expect(tok!.tokenType).toBe(typeIdx('enum'));
    });

    it('classifies module name as namespace', () => {
      const source = 'module Math { }';
      const tok = findToken(source, 'Math');
      expect(tok).toBeDefined();
      expect(tok!.tokenType).toBe(typeIdx('namespace'));
    });

    it('classifies parameter as parameter', () => {
      const source = 'circuit foo(x: Field) : Field { return x; }';
      // 'x' in the return statement (resolved as parameter)
      const tok = findToken(source, 'x', 1);
      expect(tok).toBeDefined();
      expect(tok!.tokenType).toBe(typeIdx('parameter'));
    });

    it('classifies const as variable', () => {
      const source = 'const MAX : Field;';
      const tok = findToken(source, 'MAX');
      expect(tok).toBeDefined();
      expect(tok!.tokenType).toBe(typeIdx('variable'));
    });

    it('classifies ledger as variable', () => {
      const source = 'ledger balance : Field;';
      const tok = findToken(source, 'balance');
      expect(tok).toBeDefined();
      expect(tok!.tokenType).toBe(typeIdx('variable'));
    });

    it('classifies built-in function as function', () => {
      const source = 'circuit foo() : Field { return map(); }';
      const tok = findToken(source, 'map');
      expect(tok).toBeDefined();
      expect(tok!.tokenType).toBe(typeIdx('function'));
    });

    it('does not classify unresolved identifier', () => {
      const source = 'circuit foo() : Field { return unknown; }';
      const tok = findToken(source, 'unknown');
      expect(tok).toBeUndefined();
    });
  });

  describe('new syntax classification', () => {
    it('classifies new keyword as keyword', () => {
      const tok = findToken('new type MyBool = Boolean;', 'new');
      expect(tok).toBeDefined();
      expect(tok!.tokenType).toBe(typeIdx('keyword'));
    });

    it('classifies type keyword as keyword', () => {
      const tok = findToken('new type MyBool = Boolean;', 'type');
      expect(tok).toBeDefined();
      expect(tok!.tokenType).toBe(typeIdx('keyword'));
    });

    it('classifies new type name as type', () => {
      const source = 'new type MyBool = Boolean;\ncircuit foo() : Void { MyBool; }';
      const tok = findToken(source, 'MyBool', 1);
      expect(tok).toBeDefined();
      expect(tok!.tokenType).toBe(typeIdx('type'));
    });

    it('classifies hex number literal as number', () => {
      const numTok = findToken('circuit foo() : Field { return 0xFF; }', '0xFF');
      expect(numTok).toBeDefined();
      expect(numTok!.tokenType).toBe(typeIdx('number'));
    });

    it('classifies single-quoted string as string', () => {
      const allTokens = tokens("#pragma version '1.0';");
      const strTok = allTokens.find((t) => t.tokenType === typeIdx('string'));
      expect(strTok).toBeDefined();
    });
  });

  describe('declaration modifier', () => {
    it('applies declaration modifier to circuit name at definition', () => {
      const source = 'circuit add(x: Field) : Field { return x; }';
      const tok = findToken(source, 'add');
      expect(tok).toBeDefined();
      expect(tok!.tokenModifiers & DECL_BIT).toBeTruthy();
    });

    it('does not apply declaration modifier to references', () => {
      const source =
        'circuit add(x: Field) : Field { return x; }\ncircuit main() : Field { return add(1); }';
      const tok = findToken(source, 'add', 1);
      expect(tok).toBeDefined();
      expect(tok!.tokenModifiers & DECL_BIT).toBeFalsy();
    });
  });

  describe('readonly modifier', () => {
    it('applies readonly modifier to const', () => {
      const source = 'const MAX : Field;';
      const tok = findToken(source, 'MAX');
      expect(tok).toBeDefined();
      expect(tok!.tokenModifiers & READONLY_BIT).toBeTruthy();
    });

    it('applies readonly modifier to ledger', () => {
      const source = 'ledger balance : Field;';
      const tok = findToken(source, 'balance');
      expect(tok).toBeDefined();
      expect(tok!.tokenModifiers & READONLY_BIT).toBeTruthy();
    });
  });

  describe('delta encoding', () => {
    it('encodes tokens in document order', () => {
      const source = 'circuit add(x: Field) : Field { return x; }';
      const semTokens = tokens(source);
      const data = encodeSemanticTokens(semTokens);
      // Data is a flat array of 5-tuples
      expect(data.length % 5).toBe(0);
      expect(data.length).toBeGreaterThan(0);
    });

    it('computes correct deltas for multi-line document', () => {
      const source = 'circuit add(x: Field) : Field {\n  return x;\n}';
      const semTokens = tokens(source);
      const data = encodeSemanticTokens(semTokens);
      // Find the 'return' token which should be on line 1
      // It should have a positive line delta
      let foundPositiveLineDelta = false;
      for (let i = 0; i < data.length; i += 5) {
        if (data[i] > 0) {
          foundPositiveLineDelta = true;
          break;
        }
      }
      expect(foundPositiveLineDelta).toBe(true);
    });

    it('resets start delta on new lines', () => {
      const source = 'const a : Field;\nconst b : Field;';
      const semTokens = tokens(source);
      const data = encodeSemanticTokens(semTokens);
      // Second line tokens should have absolute column (since line delta > 0)
      // Find first token on second line
      for (let i = 0; i < data.length; i += 5) {
        if (data[i] > 0) {
          // deltaChar should be absolute column (not relative to previous token)
          expect(data[i + 1]).toBe(semTokens.find((t) => t.line > 0)?.startChar ?? 0);
          break;
        }
      }
    });
  });
});
