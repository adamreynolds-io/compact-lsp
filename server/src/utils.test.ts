import { describe, it, expect } from 'vitest';
import { tokenize } from './lexer';
import { parse } from './parser';
import { buildSymbolTable } from './symbols';
import {
  findTokenAtPosition,
  findScopeForPosition,
  findChildScopeForDecl,
  isPositionInRange,
} from './utils';

// Helper: tokenize and parse a source string
function setup(source: string) {
  const tokens = tokenize(source);
  const parseResult = parse(source);
  const { fileScope, references } = buildSymbolTable(parseResult.sourceFile);
  return { tokens, parseResult, fileScope, references };
}

describe('utils', () => {
  describe('findTokenAtPosition', () => {
    it('returns the token when cursor is on a keyword', () => {
      const { tokens } = setup('circuit foo() : Void { }');
      const token = findTokenAtPosition(tokens, 0, 0);
      expect(token).toBeDefined();
      expect(token!.text).toBe('circuit');
    });

    it('returns the token when cursor is mid-identifier', () => {
      const { tokens } = setup('circuit foo() : Void { }');
      const token = findTokenAtPosition(tokens, 0, 9);
      expect(token).toBeDefined();
      expect(token!.text).toBe('foo');
    });

    it('returns undefined when cursor is between tokens (whitespace)', () => {
      // Space between 'circuit' (cols 0-6) and 'foo' (col 8)
      const { tokens } = setup('circuit  foo() : Void { }');
      const token = findTokenAtPosition(tokens, 0, 7);
      expect(token).toBeUndefined();
    });

    it('returns undefined at EOF position', () => {
      const { tokens } = setup('circuit foo() : Void { }');
      // Position well past end of content
      const token = findTokenAtPosition(tokens, 0, 100);
      expect(token).toBeUndefined();
    });

    it('returns undefined for empty source', () => {
      const { tokens } = setup('');
      const token = findTokenAtPosition(tokens, 0, 0);
      expect(token).toBeUndefined();
    });
  });

  describe('isPositionInRange', () => {
    const range = {
      start: { line: 1, column: 5, offset: 0 },
      end: { line: 3, column: 10, offset: 0 },
    };

    it('returns true for position inside range', () => {
      expect(isPositionInRange(2, 0, range)).toBe(true);
    });

    it('returns false for position before range (line)', () => {
      expect(isPositionInRange(0, 5, range)).toBe(false);
    });

    it('returns false for position before range (column on start line)', () => {
      expect(isPositionInRange(1, 3, range)).toBe(false);
    });

    it('returns false for position after range (line)', () => {
      expect(isPositionInRange(4, 0, range)).toBe(false);
    });

    it('returns false for position after range (column on end line)', () => {
      expect(isPositionInRange(3, 11, range)).toBe(false);
    });

    it('returns true for position on start boundary', () => {
      expect(isPositionInRange(1, 5, range)).toBe(true);
    });

    it('returns true for position on end boundary', () => {
      expect(isPositionInRange(3, 10, range)).toBe(true);
    });

    it('handles single-line range', () => {
      const singleLine = {
        start: { line: 0, column: 5, offset: 0 },
        end: { line: 0, column: 10, offset: 0 },
      };
      expect(isPositionInRange(0, 7, singleLine)).toBe(true);
      expect(isPositionInRange(0, 3, singleLine)).toBe(false);
      expect(isPositionInRange(0, 12, singleLine)).toBe(false);
    });
  });

  describe('findScopeForPosition', () => {
    it('returns circuit scope when cursor is inside a circuit body', () => {
      const source = 'circuit foo() : Void {\n  const x = 1;\n}';
      const { fileScope, parseResult } = setup(source);
      const scope = findScopeForPosition(fileScope, 1, 2, parseResult.sourceFile);
      expect(scope.name).toBe('foo');
    });

    it('returns file scope when cursor is outside any declaration', () => {
      const source = 'circuit foo() : Void { }\ncircuit bar() : Void { }';
      const { fileScope, parseResult } = setup(source);
      // Line 0 col 0 is technically inside 'circuit foo' declaration range,
      // so let's use a position that's definitely outside — check what the parser gives us
      // Actually, the range of `circuit foo() : Void { }` starts at 0,0.
      // Use a multiline source where there's a gap.
      const source2 = '\ncircuit foo() : Void { }';
      const s2 = setup(source2);
      const scope = findScopeForPosition(s2.fileScope, 0, 0, s2.parseResult.sourceFile);
      expect(scope).toBe(s2.fileScope);
    });

    it('returns correct scope for second declaration', () => {
      const source = 'circuit foo() : Void { }\ncircuit bar() : Void {\n  const x = 1;\n}';
      const { fileScope, parseResult } = setup(source);
      const scope = findScopeForPosition(fileScope, 2, 2, parseResult.sourceFile);
      expect(scope.name).toBe('bar');
    });
  });

  describe('findChildScopeForDecl', () => {
    it('finds child scope for named declaration', () => {
      const source = 'circuit myCircuit() : Void { }';
      const { fileScope, parseResult } = setup(source);
      const decl = parseResult.sourceFile.declarations[0];
      const child = findChildScopeForDecl(fileScope, decl);
      expect(child).toBeDefined();
      expect(child!.name).toBe('myCircuit');
    });

    it('finds child scope for constructor declaration', () => {
      const source = 'contract MyContract {\n  constructor() { }\n}';
      const { fileScope, parseResult } = setup(source);
      // The contract has a child scope, and inside it the constructor
      const contractDecl = parseResult.sourceFile.declarations[0];
      const contractScope = findChildScopeForDecl(fileScope, contractDecl);
      expect(contractScope).toBeDefined();

      if (contractScope && contractDecl.kind === 'ContractDeclaration' && contractDecl.body) {
        for (const bodyDecl of contractDecl.body) {
          if (bodyDecl.kind === 'ConstructorDeclaration') {
            const ctorScope = findChildScopeForDecl(contractScope, bodyDecl);
            expect(ctorScope).toBeDefined();
            expect(ctorScope!.name).toBe('<constructor>');
          }
        }
      }
    });

    it('returns undefined when no matching child scope exists', () => {
      const source = 'circuit foo() : Void { }';
      const { fileScope, parseResult } = setup(source);
      const decl = parseResult.sourceFile.declarations[0];
      // Create a scope that has no children matching this decl
      const emptyScope = {
        name: 'empty',
        kind: 'block' as const,
        parent: undefined,
        children: [],
        symbols: new Map(),
      };
      const result = findChildScopeForDecl(emptyScope, decl);
      expect(result).toBeUndefined();
    });
  });
});
