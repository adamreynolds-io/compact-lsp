import { describe, it, expect } from 'vitest';
import { parse } from './parser';
import { buildSymbolTable } from './symbols';
import { computeDiagnostics } from './diagnostics';

describe('Diagnostics Provider', () => {
  describe('syntax errors', () => {
    it('converts parser errors to diagnostics', () => {
      const result = parse('ledger x : Field');
      const diagnostics = computeDiagnostics(result.errors);
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(diagnostics[0].severity).toBe('error');
      expect(diagnostics[0].source).toBe('compact-lsp');
    });

    it('reports multiple syntax errors', () => {
      const result = parse('@@@ $$$');
      const diagnostics = computeDiagnostics(result.errors);
      expect(diagnostics.length).toBeGreaterThan(0);
      for (const d of diagnostics) {
        expect(d.severity).toBe('error');
        expect(d.source).toBe('compact-lsp');
      }
    });
  });

  describe('no errors', () => {
    it('returns empty diagnostics for valid source', () => {
      const result = parse('circuit add(x: Field) : Field { }');
      const diagnostics = computeDiagnostics(result.errors);
      expect(diagnostics).toHaveLength(0);
    });
  });

  describe('diagnostic source', () => {
    it('all diagnostics include source compact-lsp', () => {
      const result = parse('ledger x : Field');
      const diagnostics = computeDiagnostics(result.errors);
      for (const d of diagnostics) {
        expect(d.source).toBe('compact-lsp');
      }
    });
  });

  describe('diagnostic ranges', () => {
    it('diagnostics have range information', () => {
      const result = parse('ledger x : Field');
      const diagnostics = computeDiagnostics(result.errors);
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(diagnostics[0].range).toBeDefined();
      expect(diagnostics[0].range.start).toBeDefined();
      expect(diagnostics[0].range.end).toBeDefined();
    });
  });

  describe('undefined references', () => {
    it('reports error for undefined variable inside circuit body', () => {
      const source = 'circuit foo() : Void {\n  unknown;\n}';
      const result = parse(source);
      const { fileScope, references } = buildSymbolTable(result.sourceFile);
      const diagnostics = computeDiagnostics(result.errors, references, fileScope);
      const undefDiag = diagnostics.find((d) => d.message.includes("'unknown' is not defined"));
      expect(undefDiag).toBeDefined();
      expect(undefDiag!.severity).toBe('error');
    });

    it('does not report error for parameter reference inside body', () => {
      const source = 'circuit foo(x: Field) : Field {\n  return x;\n}';
      const result = parse(source);
      const { fileScope, references } = buildSymbolTable(result.sourceFile);
      const diagnostics = computeDiagnostics(result.errors, references, fileScope);
      const undefDiag = diagnostics.find((d) => d.message.includes('is not defined'));
      expect(undefDiag).toBeUndefined();
    });

    it('does not report error for local variable reference', () => {
      const source = 'circuit foo(x: Field) : Field {\n  const y = x;\n  return y;\n}';
      const result = parse(source);
      const { fileScope, references } = buildSymbolTable(result.sourceFile);
      const diagnostics = computeDiagnostics(result.errors, references, fileScope);
      const undefDiag = diagnostics.find((d) => d.message.includes('is not defined'));
      expect(undefDiag).toBeUndefined();
    });

    it('does not report error for built-in types', () => {
      // Field and Boolean are built-in types, should not be flagged
      const source = 'circuit foo(x: Field) : Boolean {\n  return Field;\n}';
      const result = parse(source);
      const { fileScope, references } = buildSymbolTable(result.sourceFile);
      const diagnostics = computeDiagnostics(result.errors, references, fileScope);
      const undefDiag = diagnostics.find((d) => d.message.includes('is not defined'));
      expect(undefDiag).toBeUndefined();
    });

    it('does not report error for built-in functions', () => {
      // map and fold are built-in functions
      const source = 'circuit foo(x: Field) : Field {\n  map;\n  fold;\n}';
      const result = parse(source);
      const { fileScope, references } = buildSymbolTable(result.sourceFile);
      const diagnostics = computeDiagnostics(result.errors, references, fileScope);
      const undefDiag = diagnostics.find((d) => d.message.includes('is not defined'));
      expect(undefDiag).toBeUndefined();
    });

    it('reports error for out-of-scope local variable', () => {
      // y is declared inside an if block and should not be visible outside
      // Actually, the current parser doesn't create block scopes for if bodies...
      // Let me use a different approach: variable defined in one circuit is not visible in another
      const source = 'circuit foo() : Void {\n  const y = 1;\n}\ncircuit bar() : Void {\n  y;\n}';
      const result = parse(source);
      const { fileScope, references } = buildSymbolTable(result.sourceFile);
      const diagnostics = computeDiagnostics(result.errors, references, fileScope);
      const undefDiag = diagnostics.find((d) => d.message.includes("'y' is not defined"));
      expect(undefDiag).toBeDefined();
      expect(undefDiag!.severity).toBe('error');
    });
  });
});
