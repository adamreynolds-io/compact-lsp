import { describe, it, expect } from 'vitest';
import { parse } from './parser';
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
});
