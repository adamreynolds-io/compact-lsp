import { describe, it, expect } from 'vitest';
import { tokenize } from './lexer';
import { parse } from './parser';
import { buildSymbolTable } from './symbols';
import { findReferences } from './references';

function references(source: string, line: number, column: number, includeDeclaration = true) {
  const result = parse(source);
  const { fileScope, references: refs } = buildSymbolTable(result.sourceFile);
  const tokens = tokenize(source);
  return findReferences(result, fileScope, refs, line, column, tokens, includeDeclaration);
}

describe('References Provider', () => {
  describe('parameter references', () => {
    it('finds usage of a parameter in circuit body', () => {
      // Line 0: circuit foo(x: Field) : Field {
      //          0123456789012
      // Line 1:   return x;
      //          0123456789
      const source = 'circuit foo(x: Field) : Field {\n  return x;\n}';
      // cursor on parameter 'x' declaration at line 0, col 12
      const result = references(source, 0, 12, false);
      // Should find x usage at line 1, col 9 but NOT the declaration
      expect(result.length).toBe(1);
      expect(result[0].start.line).toBe(1);
      expect(result[0].start.column).toBe(9);
    });

    it('includes declaration when includeDeclaration is true', () => {
      const source = 'circuit foo(x: Field) : Field {\n  return x;\n}';
      // cursor on 'x' parameter at line 0, col 12
      const result = references(source, 0, 12, true);
      // Should include both the declaration and the usage
      expect(result.length).toBe(2);
    });

    it('includes declaration when includeDeclaration is false only returns usages', () => {
      const source = 'circuit foo(x: Field) : Field {\n  return x;\n}';
      // cursor on 'x' reference at line 1, col 9
      const result = references(source, 1, 9, false);
      // Only the usage reference, not the declaration
      expect(result.length).toBe(1);
      expect(result[0].start.line).toBe(1);
      expect(result[0].start.column).toBe(9);
    });
  });

  describe('local variable references', () => {
    it('finds references for a local variable used multiple times', () => {
      // Line 0: circuit foo(x: Field) : Field {
      // Line 1:   const y = x;
      // Line 2:   return y;
      // Line 3: }
      const source = 'circuit foo(x: Field) : Field {\n  const y = x;\n  return y;\n}';
      // cursor on 'x' parameter at line 0, col 12
      const result = references(source, 0, 12, false);
      // x is used in the initializer of const y (line 1 col 12)
      expect(result.length).toBe(1);
      expect(result[0].start.line).toBe(1);
      expect(result[0].start.column).toBe(12);
    });
  });

  describe('keywords', () => {
    it('returns empty array for keywords', () => {
      const source = 'circuit foo() : Field { }';
      // 'circuit' keyword at line 0, col 0
      const result = references(source, 0, 0);
      expect(result).toEqual([]);
    });
  });

  describe('whitespace', () => {
    it('returns empty array for whitespace', () => {
      const source = 'circuit  foo() : Field { }';
      // space at line 0, col 8
      const result = references(source, 0, 8);
      expect(result).toEqual([]);
    });
  });

  describe('unresolved identifier', () => {
    it('returns empty array for unresolved identifier', () => {
      // 'unknown' is not declared anywhere
      const source = 'circuit foo() : Void {\n  unknown;\n}';
      // 'unknown' at line 1, col 2
      const result = references(source, 1, 2);
      expect(result).toEqual([]);
    });
  });

  describe('new type references', () => {
    it('finds references for a new type declaration', () => {
      // Line 0: new type MyBool = Boolean;
      // Line 1: circuit foo() : Void { MyBool; }
      const source = 'new type MyBool = Boolean;\ncircuit foo() : Void { MyBool; }';
      // cursor on 'MyBool' declaration at line 0, col 9
      const result = references(source, 0, 9, true);
      expect(result.length).toBe(2); // declaration + 1 reference
    });
  });

  describe('destructured binding references', () => {
    it('finds references for tuple destructured variable', () => {
      const source = 'circuit foo() : Void {\n  const [a, b] = pair;\n  a;\n}';
      // cursor on 'a' at line 2, col 2
      const result = references(source, 2, 2, true);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('circuit references from body', () => {
    it('finds references when a circuit is called from another circuit body', () => {
      // Line 0: circuit bar(y: Field) : Field { }
      // Line 1: circuit foo(x: Field) : Field {
      // Line 2:   return bar(x);
      // Line 3: }
      const source =
        'circuit bar(y: Field) : Field { }\ncircuit foo(x: Field) : Field {\n  return bar(x);\n}';
      // cursor on 'bar' declaration at line 0, col 8
      const result = references(source, 0, 8, true);
      // Should include declaration (line 0) + usage in foo body (line 2)
      expect(result.length).toBe(2);
    });
  });
});
