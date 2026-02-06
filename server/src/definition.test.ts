import { describe, it, expect } from 'vitest';
import { parse } from './parser';
import { buildSymbolTable } from './symbols';
import { getDefinition } from './definition';

function definition(source: string, line: number, column: number) {
  const result = parse(source);
  const { fileScope } = buildSymbolTable(result.sourceFile);
  return getDefinition(result, fileScope, line, column, source);
}

describe('Definition Provider', () => {
  describe('circuit reference', () => {
    it('resolves circuit reference to circuit declaration', () => {
      // Line 0: circuit foo(x: Field) : Field {
      // Line 1:   return bar(x);
      // Line 2: }
      // Line 3: circuit bar(y: Field) : Field { }
      const source =
        'circuit foo(x: Field) : Field {\n  return bar(x);\n}\ncircuit bar(y: Field) : Field { }';
      // 'bar' on line 1 is at column 9 (2 spaces + "return " = 9, then "bar" starts at 9)
      const result = definition(source, 1, 9);
      expect(result).toBeDefined();
      // bar declaration starts at line 3, column 0
      expect(result!.range.start.line).toBe(3);
      expect(result!.range.start.column).toBe(0);
    });
  });

  describe('parameter reference', () => {
    it('resolves parameter reference inside body to parameter', () => {
      // Line 0: circuit foo(x: Field) : Field {
      //          0123456789012345678901234567890
      // Line 1:   return x;
      //          01234567
      const source = 'circuit foo(x: Field) : Field {\n  return x;\n}';
      // 'x' on line 1 is at column 9
      const result = definition(source, 1, 9);
      expect(result).toBeDefined();
      // x parameter declaration is on line 0. 'x' starts at column 12
      expect(result!.range.start.line).toBe(0);
      expect(result!.range.start.column).toBe(12);
    });
  });

  describe('local variable reference', () => {
    it('returns undefined for const statement local variable (declaration field is undefined)', () => {
      // Const statement locals in circuit bodies have declaration: undefined
      // in the symbol table, so getDefinition treats them like built-ins.
      // Line 0: circuit foo(x: Field) : Field {
      // Line 1:   const y = x;
      // Line 2:   return y;
      // Line 3: }
      const source = 'circuit foo(x: Field) : Field {\n  const y = x;\n  return y;\n}';
      // 'y' on line 2 is at column 9
      const result = definition(source, 2, 9);
      // Local const statements have declaration: undefined, so no definition result
      expect(result).toBeUndefined();
    });

    it('resolves top-level const declaration', () => {
      // Top-level const declarations DO have a declaration AST node
      // Line 0: const MAX: Field = 100;
      // Line 1: circuit foo() : Field {
      // Line 2:   MAX;
      // Line 3: }
      const source = 'const MAX: Field = 100;\ncircuit foo() : Field {\n  MAX;\n}';
      // 'MAX' on line 2 at column 2
      const result = definition(source, 2, 2);
      expect(result).toBeDefined();
      expect(result!.range.start.line).toBe(0);
      expect(result!.range.start.column).toBe(0);
    });
  });

  describe('ledger reference', () => {
    it('resolves ledger reference to ledger declaration', () => {
      // Line 0: ledger counter : Field;
      // Line 1: circuit inc() : Void {
      // Line 2:   counter;
      // Line 3: }
      const source = 'ledger counter : Field;\ncircuit inc() : Void {\n  counter;\n}';
      // 'counter' on line 2 is at column 2
      const result = definition(source, 2, 2);
      expect(result).toBeDefined();
      // ledger declaration starts at line 0, column 0
      expect(result!.range.start.line).toBe(0);
      expect(result!.range.start.column).toBe(0);
    });
  });

  describe('struct reference', () => {
    it('resolves struct reference to struct declaration', () => {
      // Line 0: struct Point { x: Field; y: Field; }
      // Line 1: circuit use(p: Field) : Field {
      // Line 2:   Point;
      // Line 3: }
      const source =
        'struct Point { x: Field; y: Field; }\ncircuit use(p: Field) : Field {\n  Point;\n}';
      // 'Point' on line 2 at column 2. Note: 'Point' is a TypeKeyword
      const result = definition(source, 2, 2);
      // Point is not a TypeKeyword - it's an Identifier. Let me check...
      // Actually TYPE_KEYWORDS = ['Field', 'Boolean', 'Uint', 'Bytes', 'Vector', 'Opaque', 'Void']
      // 'Point' is an Identifier, not a TypeKeyword. The getDefinition only handles Identifier and TypeKeyword.
      expect(result).toBeDefined();
      expect(result!.range.start.line).toBe(0);
      expect(result!.range.start.column).toBe(0);
    });
  });

  describe('enum reference', () => {
    it('resolves enum reference to enum declaration', () => {
      // Line 0: enum Color { red, green, blue }
      // Line 1: circuit use(p: Field) : Field {
      // Line 2:   Color;
      // Line 3: }
      const source =
        'enum Color { red, green, blue }\ncircuit use(p: Field) : Field {\n  Color;\n}';
      // 'Color' on line 2 at column 2
      const result = definition(source, 2, 2);
      expect(result).toBeDefined();
      expect(result!.range.start.line).toBe(0);
      expect(result!.range.start.column).toBe(0);
    });
  });

  describe('built-in types', () => {
    it('returns undefined for built-in types (no source location)', () => {
      // 'Field' is a built-in type; it has no source declaration
      const source = 'circuit foo(x: Field) : Field { }';
      // 'Field' at line 0, column 15 (in "x: Field")
      const result = definition(source, 0, 15);
      expect(result).toBeUndefined();
    });
  });

  describe('keywords', () => {
    it('returns undefined for keywords', () => {
      const source = 'circuit foo() : Field { }';
      // 'circuit' keyword at line 0, column 0
      const result = definition(source, 0, 0);
      expect(result).toBeUndefined();
    });
  });

  describe('whitespace', () => {
    it('returns undefined for whitespace', () => {
      const source = 'circuit  foo() : Field { }';
      // space at line 0, column 8
      const result = definition(source, 0, 8);
      expect(result).toBeUndefined();
    });
  });

  describe('declaration name itself', () => {
    it('returns own range when cursor is on the declaration name', () => {
      // Line 0: circuit foo(x: Field) : Field { }
      //          0123456789
      // 'foo' starts at column 8
      const source = 'circuit foo(x: Field) : Field { }';
      const result = definition(source, 0, 8);
      expect(result).toBeDefined();
      // The circuit declaration starts at line 0, column 0
      expect(result!.range.start.line).toBe(0);
      expect(result!.range.start.column).toBe(0);
    });
  });
});
