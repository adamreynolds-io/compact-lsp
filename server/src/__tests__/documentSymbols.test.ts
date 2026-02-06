import { describe, it, expect } from 'vitest';
import { parse } from '../parser';
import { getDocumentSymbols, DocSymbolKind } from '../documentSymbols';

function symbols(source: string) {
  const result = parse(source);
  return getDocumentSymbols(result.sourceFile);
}

describe('Document Symbols', () => {
  describe('top-level declarations', () => {
    it('returns circuit as Function', () => {
      const syms = symbols('circuit add(x: Field, y: Field) : Field { return x; }');
      expect(syms).toHaveLength(1);
      expect(syms[0].name).toBe('add');
      expect(syms[0].kind).toBe(DocSymbolKind.Function);
      expect(syms[0].detail).toContain('(x: Field, y: Field)');
      expect(syms[0].detail).toContain(': Field');
    });

    it('returns export pure circuit with modifiers in detail', () => {
      const syms = symbols('export pure circuit verify(proof: Field) : Boolean { return proof; }');
      expect(syms).toHaveLength(1);
      expect(syms[0].name).toBe('verify');
      expect(syms[0].kind).toBe(DocSymbolKind.Function);
      expect(syms[0].detail).toContain('export');
      expect(syms[0].detail).toContain('pure');
    });

    it('returns struct as Struct with field children', () => {
      const syms = symbols('struct Point { x: Field; y: Field; }');
      expect(syms).toHaveLength(1);
      expect(syms[0].name).toBe('Point');
      expect(syms[0].kind).toBe(DocSymbolKind.Struct);
      expect(syms[0].children).toHaveLength(2);
      expect(syms[0].children[0].name).toBe('x');
      expect(syms[0].children[0].kind).toBe(DocSymbolKind.Field);
      expect(syms[0].children[1].name).toBe('y');
    });

    it('returns enum as Enum with variant children', () => {
      const syms = symbols('enum Color { red, green, blue }');
      expect(syms).toHaveLength(1);
      expect(syms[0].name).toBe('Color');
      expect(syms[0].kind).toBe(DocSymbolKind.Enum);
      expect(syms[0].children).toHaveLength(3);
      expect(syms[0].children[0].name).toBe('red');
      expect(syms[0].children[0].kind).toBe(DocSymbolKind.EnumMember);
    });

    it('returns ledger as Variable', () => {
      const syms = symbols('ledger balance : Field;');
      expect(syms).toHaveLength(1);
      expect(syms[0].name).toBe('balance');
      expect(syms[0].kind).toBe(DocSymbolKind.Variable);
      expect(syms[0].detail).toBe('Field');
    });

    it('returns witness as Function', () => {
      const syms = symbols('witness secret(x: Field) : Boolean;');
      expect(syms).toHaveLength(1);
      expect(syms[0].name).toBe('secret');
      expect(syms[0].kind).toBe(DocSymbolKind.Function);
      expect(syms[0].detail).toContain('(x: Field)');
      expect(syms[0].detail).toContain(': Boolean');
    });

    it('returns const as Constant', () => {
      const syms = symbols('const MAX : Uint<32>;');
      expect(syms).toHaveLength(1);
      expect(syms[0].name).toBe('MAX');
      expect(syms[0].kind).toBe(DocSymbolKind.Constant);
    });
  });

  describe('nested declarations', () => {
    it('returns module with nested children', () => {
      const syms = symbols('module Math { circuit add(x: Field, y: Field) : Field { return x; } }');
      expect(syms).toHaveLength(1);
      expect(syms[0].name).toBe('Math');
      expect(syms[0].kind).toBe(DocSymbolKind.Module);
      expect(syms[0].children).toHaveLength(1);
      expect(syms[0].children[0].name).toBe('add');
      expect(syms[0].children[0].kind).toBe(DocSymbolKind.Function);
    });

    it('returns contract with circuit children', () => {
      const syms = symbols(
        'contract Token { circuit transfer(to: Field, amount: Field); circuit balance(addr: Field) : Field; }',
      );
      expect(syms).toHaveLength(1);
      expect(syms[0].name).toBe('Token');
      expect(syms[0].kind).toBe(DocSymbolKind.Interface);
      expect(syms[0].children).toHaveLength(2);
      expect(syms[0].children[0].name).toBe('transfer');
      expect(syms[0].children[1].name).toBe('balance');
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty document', () => {
      const syms = symbols('');
      expect(syms).toHaveLength(0);
    });

    it('returns empty array for pragmas only', () => {
      const syms = symbols('#pragma version 1;');
      expect(syms).toHaveLength(0);
    });

    it('handles multiple top-level declarations', () => {
      const syms = symbols(`
        struct Point { x: Field; y: Field; }
        circuit add(a: Field, b: Field) : Field { return a; }
        enum Color { red, green, blue }
      `);
      expect(syms).toHaveLength(3);
      expect(syms[0].name).toBe('Point');
      expect(syms[1].name).toBe('add');
      expect(syms[2].name).toBe('Color');
    });
  });

  describe('new declaration types', () => {
    it('returns new type as Variable', () => {
      const syms = symbols('new type MyBool = Boolean;');
      expect(syms).toHaveLength(1);
      expect(syms[0].name).toBe('MyBool');
      expect(syms[0].kind).toBe(DocSymbolKind.Variable);
      expect(syms[0].detail).toBe('Boolean');
    });

    it('returns export list as Module', () => {
      const syms = symbols('export { foo, bar };');
      expect(syms).toHaveLength(1);
      expect(syms[0].name).toBe('export');
      expect(syms[0].kind).toBe(DocSymbolKind.Module);
      expect(syms[0].detail).toContain('foo');
      expect(syms[0].detail).toContain('bar');
    });

    it('handles new type with parameterized type expression', () => {
      const syms = symbols('new type SmallUint = Uint<8>;');
      expect(syms).toHaveLength(1);
      expect(syms[0].name).toBe('SmallUint');
      expect(syms[0].detail).toBe('Uint<8>');
    });

    it('handles range type argument in detail', () => {
      const syms = symbols('new type RangeUint = Uint<4..8>;');
      expect(syms).toHaveLength(1);
      expect(syms[0].name).toBe('RangeUint');
      expect(syms[0].detail).toBe('Uint<4..8>');
    });
  });

  describe('ranges', () => {
    it('range covers full declaration', () => {
      const syms = symbols('circuit add(x: Field) : Field { return x; }');
      expect(syms[0].range.start.line).toBe(0);
      expect(syms[0].range.start.column).toBe(0);
      expect(syms[0].range.end.column).toBeGreaterThan(0);
    });

    it('selectionRange starts at declaration start', () => {
      const syms = symbols('circuit add(x: Field) : Field { return x; }');
      expect(syms[0].selectionRange.start.line).toBe(0);
    });
  });
});
