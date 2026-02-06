import { describe, it, expect } from 'vitest';
import { parse } from '../parser';
import { buildSymbolTable } from '../symbols';
import { getSignatureHelp } from '../signatureHelp';

function sigHelp(source: string, line: number, column: number) {
  const parseResult = parse(source);
  const { fileScope } = buildSymbolTable(parseResult.sourceFile);
  return getSignatureHelp(parseResult, fileScope, line, column, source);
}

describe('Signature Help', () => {
  describe('basic calls', () => {
    it('returns signature for cursor after open paren', () => {
      const source =
        'circuit add(x: Field, y: Field) : Field { return x; }\ncircuit main() : Field { return add(); }';
      // cursor inside add() — line 1, col 36 (after the open paren of add()
      const result = sigHelp(source, 1, 36);
      expect(result).toBeDefined();
      expect(result!.label).toContain('add');
      expect(result!.label).toContain('x: Field');
      expect(result!.parameters).toHaveLength(2);
      expect(result!.activeParameter).toBe(0);
    });

    it('advances active parameter after comma', () => {
      const source =
        'circuit add(x: Field, y: Field) : Field { return x; }\ncircuit main() : Field { return add(1, ); }';
      // cursor after comma — line 1, col 39
      const result = sigHelp(source, 1, 39);
      expect(result).toBeDefined();
      expect(result!.activeParameter).toBe(1);
    });
  });

  describe('different declaration types', () => {
    it('returns signature for witness call', () => {
      // Line 0: witness secret(x: Field) : Boolean;
      // Line 1: circuit main() : Boolean { return secret(); }
      //         0         1         2         3         4
      //         0123456789012345678901234567890123456789012345678
      // "secret(" starts at col 34, open paren at col 40, cursor at col 41
      const source =
        'witness secret(x: Field) : Boolean;\ncircuit main() : Boolean { return secret(); }';
      const result = sigHelp(source, 1, 41);
      expect(result).toBeDefined();
      expect(result!.label).toContain('witness');
      expect(result!.label).toContain('secret');
      expect(result!.parameters).toHaveLength(1);
    });

    it('returns signature for built-in function call', () => {
      const source = 'circuit main() : Field { return map(); }';
      const result = sigHelp(source, 0, 36);
      expect(result).toBeDefined();
      expect(result!.label).toContain('map');
      expect(result!.parameters).toHaveLength(0);
    });
  });

  describe('nested calls', () => {
    it('returns inner call signature for nested calls', () => {
      const source = `circuit outer(a: Field) : Field { return a; }
circuit inner(b: Field, c: Field) : Field { return b; }
circuit main() : Field { return outer(inner()); }`;
      // Line 2: "circuit main() : Field { return outer(inner()); }"
      //          0         1         2         3         4
      //          012345678901234567890123456789012345678901234567
      // "outer(" at col 32, open paren at 37
      // "inner(" at col 38, open paren at 43, cursor at 44 (inside inner's parens)
      const result = sigHelp(source, 2, 44);
      expect(result).toBeDefined();
      expect(result!.label).toContain('inner');
      expect(result!.parameters).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('returns undefined when cursor is outside any call', () => {
      const source = 'circuit main() : Field { return 42; }';
      const result = sigHelp(source, 0, 32);
      expect(result).toBeUndefined();
    });

    it('returns undefined for unresolved callee', () => {
      const source = 'circuit main() : Field { return unknown(); }';
      const result = sigHelp(source, 0, 40);
      expect(result).toBeUndefined();
    });

    it('handles zero-parameter call', () => {
      const source =
        'circuit noArgs() : Field { return 1; }\ncircuit main() : Field { return noArgs(); }';
      const result = sigHelp(source, 1, 39);
      expect(result).toBeDefined();
      expect(result!.parameters).toHaveLength(0);
      expect(result!.activeParameter).toBe(0);
    });

    it('clamps active parameter to last parameter', () => {
      // Call with more commas than parameters
      const source =
        'circuit one(x: Field) : Field { return x; }\ncircuit main() : Field { return one(1, 2, 3); }';
      // After 2 commas, active should clamp to last param (index 0)
      const result = sigHelp(source, 1, 42);
      expect(result).toBeDefined();
      expect(result!.activeParameter).toBe(0); // clamped to max index
    });
  });
});
