import { describe, it, expect } from 'vitest';
import { parse } from './parser';
import { buildSymbolTable } from './symbols';
import { getHoverInfo } from './hover';
import { computeDiagnostics } from './diagnostics';

/**
 * Integration tests that exercise the full analysis pipeline:
 * parse → symbol table → hover + diagnostics
 */
describe('Integration', () => {
  describe('full analysis pipeline', () => {
    const source = `
pragma language_version 0.14.0;
include "standard_library.compact";

export sealed ledger counter : Field;

witness getSecret() : Field;

export circuit increment(amount: Field) : Void {
}

struct Point {
  x: Field;
  y: Field;
}

enum Color { red, green, blue }

module Utils {
  circuit helper(v: Field) : Field { }
}

const MAX: Uint<32> = 100;

contract MyContract {
  circuit verify(proof: Field) : Boolean;
}
`;

    it('parses without errors', () => {
      const result = parse(source);
      expect(result.errors).toHaveLength(0);
      expect(result.sourceFile.declarations.length).toBeGreaterThan(0);
    });

    it('builds symbol table with all declarations', () => {
      const result = parse(source);
      const scope = buildSymbolTable(result.sourceFile);
      expect(scope.symbols.get('counter')).toBeDefined();
      expect(scope.symbols.get('getSecret')).toBeDefined();
      expect(scope.symbols.get('increment')).toBeDefined();
      expect(scope.symbols.get('Point')).toBeDefined();
      expect(scope.symbols.get('Color')).toBeDefined();
      expect(scope.symbols.get('Utils')).toBeDefined();
      expect(scope.symbols.get('MAX')).toBeDefined();
      expect(scope.symbols.get('MyContract')).toBeDefined();
    });

    it('hover returns correct info for circuit', () => {
      const result = parse(source);
      const scope = buildSymbolTable(result.sourceFile);
      // 'increment' is on line 8, col 15
      const hoverResult = getHoverInfo(result, scope, 8, 15, source);
      expect(hoverResult).toBeDefined();
      expect(hoverResult!.contents).toContain('circuit increment');
      expect(hoverResult!.contents).toContain('amount: Field');
    });

    it('hover returns correct info for ledger', () => {
      const result = parse(source);
      const scope = buildSymbolTable(result.sourceFile);
      // 'counter' is on line 4, col 22
      const hoverResult = getHoverInfo(result, scope, 4, 22, source);
      expect(hoverResult).toBeDefined();
      expect(hoverResult!.contents).toContain('ledger counter');
    });

    it('produces no diagnostics for valid source', () => {
      const result = parse(source);
      const diagnostics = computeDiagnostics(result.errors);
      expect(diagnostics).toHaveLength(0);
    });
  });

  describe('diagnostics pipeline', () => {
    it('produces diagnostics for syntax errors', () => {
      const source = 'ledger x : Field\ncircuit foo() : Field { }';
      const result = parse(source);
      const diagnostics = computeDiagnostics(result.errors);
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(diagnostics[0].source).toBe('compact-lsp');
    });

    it('clears diagnostics when errors are fixed', () => {
      // First analysis with error
      const source1 = 'ledger x : Field';
      const result1 = parse(source1);
      const diag1 = computeDiagnostics(result1.errors);
      expect(diag1.length).toBeGreaterThan(0);

      // Second analysis with fix
      const source2 = 'ledger x : Field;';
      const result2 = parse(source2);
      const diag2 = computeDiagnostics(result2.errors);
      expect(diag2).toHaveLength(0);
    });
  });

  describe('hover + diagnostics combined', () => {
    it('hover works even when there are parse errors elsewhere', () => {
      const source = 'circuit foo(x: Field) : Field { }\n@@@ invalid';
      const result = parse(source);
      const scope = buildSymbolTable(result.sourceFile);

      // Diagnostics should exist for the error
      const diagnostics = computeDiagnostics(result.errors);
      expect(diagnostics.length).toBeGreaterThan(0);

      // Hover should still work on the valid circuit
      const hoverResult = getHoverInfo(result, scope, 0, 8, source);
      expect(hoverResult).toBeDefined();
      expect(hoverResult!.contents).toContain('circuit foo');
    });
  });
});
