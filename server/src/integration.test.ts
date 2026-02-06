import { describe, it, expect } from 'vitest';
import { parse } from './parser';
import { buildSymbolTable } from './symbols';
import { getHoverInfo } from './hover';
import { computeDiagnostics } from './diagnostics';
import { getDefinition } from './definition';
import { findReferences } from './references';
import { getCompletions } from './completion';

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
      const { fileScope: scope } = buildSymbolTable(result.sourceFile);
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
      const { fileScope: scope } = buildSymbolTable(result.sourceFile);
      // 'increment' is on line 8, col 15
      const hoverResult = getHoverInfo(result, scope, 8, 15, source);
      expect(hoverResult).toBeDefined();
      expect(hoverResult!.contents).toContain('circuit increment');
      expect(hoverResult!.contents).toContain('amount: Field');
    });

    it('hover returns correct info for ledger', () => {
      const result = parse(source);
      const { fileScope: scope } = buildSymbolTable(result.sourceFile);
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
      const { fileScope: scope } = buildSymbolTable(result.sourceFile);

      // Diagnostics should exist for the error
      const diagnostics = computeDiagnostics(result.errors);
      expect(diagnostics.length).toBeGreaterThan(0);

      // Hover should still work on the valid circuit
      const hoverResult = getHoverInfo(result, scope, 0, 8, source);
      expect(hoverResult).toBeDefined();
      expect(hoverResult!.contents).toContain('circuit foo');
    });
  });

  describe('go-to-definition pipeline', () => {
    it('resolves a circuit reference through the full pipeline', () => {
      // Line 0: circuit bar(y: Field) : Field { }
      // Line 1: circuit foo(x: Field) : Field {
      // Line 2:   return bar(x);
      // Line 3: }
      const source =
        'circuit bar(y: Field) : Field { }\ncircuit foo(x: Field) : Field {\n  return bar(x);\n}';
      const result = parse(source);
      expect(result.errors).toHaveLength(0);

      const { fileScope, references } = buildSymbolTable(result.sourceFile);
      // 'bar' on line 2 at column 9
      const defResult = getDefinition(result, fileScope, references, 2, 9, source);
      expect(defResult).toBeDefined();
      expect(defResult!.range.start.line).toBe(0);
      expect(defResult!.range.start.column).toBe(0);
    });
  });

  describe('find-references pipeline', () => {
    it('finds all references to a parameter through the full pipeline', () => {
      // Line 0: circuit foo(x: Field, y: Field) : Field {
      // Line 1:   const z = x + y;
      // Line 2:   return z;
      // Line 3: }
      const source =
        'circuit foo(x: Field, y: Field) : Field {\n  const z = x + y;\n  return z;\n}';
      const result = parse(source);
      expect(result.errors).toHaveLength(0);

      const { fileScope, references } = buildSymbolTable(result.sourceFile);
      // 'x' parameter at line 0, column 12
      const refs = findReferences(result, fileScope, references, 0, 12, source, true);
      // declaration + usage in 'x + y'
      expect(refs.length).toBe(2);
    });
  });

  describe('completion pipeline', () => {
    it('provides completions at top level with all visible symbols', () => {
      const source =
        'ledger counter : Field;\ncircuit inc() : Void { }\nstruct Point { x: Field; }\n';
      const result = parse(source);
      expect(result.errors).toHaveLength(0);

      const { fileScope } = buildSymbolTable(result.sourceFile);
      const items = getCompletions(result, fileScope, 3, 0);
      const labels = items.map((c) => c.label);
      expect(labels).toContain('counter');
      expect(labels).toContain('inc');
      expect(labels).toContain('Point');
      expect(labels).toContain('Field');
    });

    it('provides completions inside circuit body with parameters', () => {
      const source = 'circuit foo(x: Field) : Field {\n  \n}';
      const result = parse(source);

      const { fileScope } = buildSymbolTable(result.sourceFile);
      const items = getCompletions(result, fileScope, 1, 2);
      const labels = items.map((c) => c.label);
      // Should include parameter
      expect(labels).toContain('x');
      // Should include the circuit itself (from file scope)
      expect(labels).toContain('foo');
      // Should include built-ins
      expect(labels).toContain('Field');
    });
  });

  describe('new syntax full pipeline', () => {
    const newSyntaxSource = `
import { foo, bar as baz } from MyModule;
import OtherModule prefix O$;

new type MyBool = Boolean;
new type RangeUint = Uint<4..8>;

export { foo, baz };

struct Point { x: Field; y: Field; }

circuit process(x: Field) : Field {
  const a = 0xFF;
  const b = 0b1010;
  const [first, second] = pair;
  const {x: px, y: py} = point;
  assert(true, "must be true");
  const mapper = (v: Field) => { return v; };
  return first;
}
`;

    it('parses new syntax without errors', () => {
      const result = parse(newSyntaxSource);
      expect(result.errors).toHaveLength(0);
    });

    it('builds symbol table for new syntax', () => {
      const result = parse(newSyntaxSource);
      const { fileScope } = buildSymbolTable(result.sourceFile);
      expect(fileScope.symbols.get('foo')).toBeDefined();
      expect(fileScope.symbols.get('baz')).toBeDefined();
      expect(fileScope.symbols.get('MyBool')).toBeDefined();
      expect(fileScope.symbols.get('RangeUint')).toBeDefined();
      expect(fileScope.symbols.get('Point')).toBeDefined();
      expect(fileScope.symbols.get('process')).toBeDefined();
    });

    it('no false diagnostics for new syntax', () => {
      const result = parse(newSyntaxSource);
      const { fileScope, references } = buildSymbolTable(result.sourceFile);
      const diagnostics = computeDiagnostics(result.errors, references, fileScope);
      // Should only have undefined errors for 'pair', 'point', 'true' (which is a boolean literal, so no ref)
      // and 'px', 'py' are destructured from point
      // Actually, 'pair' and 'point' are undefined since they're not declared
      const realErrors = diagnostics.filter((d) => d.severity === 'error');
      for (const d of realErrors) {
        // Only 'pair' and 'point' should be truly undefined
        expect(
          d.message.includes("'pair'") || d.message.includes("'point'"),
        ).toBe(true);
      }
    });

    it('hover works for new type', () => {
      const result = parse(newSyntaxSource);
      const { fileScope } = buildSymbolTable(result.sourceFile);
      // 'MyBool' is on line 4, find exact col
      const hoverResult = getHoverInfo(result, fileScope, 4, 9, newSyntaxSource);
      expect(hoverResult).toBeDefined();
      expect(hoverResult!.contents).toContain('MyBool');
    });

    it('completions include new types inside circuit body', () => {
      const result = parse(newSyntaxSource);
      const { fileScope } = buildSymbolTable(result.sourceFile);
      // Inside process body (line 12)
      const items = getCompletions(result, fileScope, 12, 2);
      const labels = items.map((c) => c.label);
      expect(labels).toContain('MyBool');
      expect(labels).toContain('RangeUint');
      expect(labels).toContain('foo');
      expect(labels).toContain('baz');
    });
  });

  describe('undefined reference diagnostics pipeline', () => {
    it('reports undefined identifier through the full pipeline', () => {
      const source = 'circuit foo() : Void {\n  undefined_var;\n}';
      const result = parse(source);
      const { fileScope, references } = buildSymbolTable(result.sourceFile);
      const diagnostics = computeDiagnostics(result.errors, references, fileScope);
      const undefDiag = diagnostics.find((d) =>
        d.message.includes("'undefined_var' is not defined"),
      );
      expect(undefDiag).toBeDefined();
      expect(undefDiag!.severity).toBe('error');
      expect(undefDiag!.source).toBe('compact-lsp');
    });

    it('does not report defined references', () => {
      const source = 'ledger counter : Field;\ncircuit inc() : Void {\n  counter;\n}';
      const result = parse(source);
      expect(result.errors).toHaveLength(0);

      const { fileScope, references } = buildSymbolTable(result.sourceFile);
      const diagnostics = computeDiagnostics(result.errors, references, fileScope);
      expect(diagnostics).toHaveLength(0);
    });
  });
});
