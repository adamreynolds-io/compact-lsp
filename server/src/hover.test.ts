import { describe, it, expect } from 'vitest';
import { tokenize } from './lexer';
import { parse } from './parser';
import { buildSymbolTable } from './symbols';
import { getHoverInfo } from './hover';

function hover(source: string, line: number, column: number) {
  const result = parse(source);
  const { fileScope } = buildSymbolTable(result.sourceFile);
  const tokens = tokenize(source);
  return getHoverInfo(result, fileScope, line, column, tokens);
}

describe('Hover Provider', () => {
  describe('circuit hover', () => {
    it('returns circuit signature', () => {
      const source = 'circuit add(x: Field, y: Field) : Field { }';
      const result = hover(source, 0, 8); // on 'add'
      expect(result).toBeDefined();
      expect(result!.contents).toBe('circuit add(x: Field, y: Field) : Field');
    });

    it('returns export pure circuit signature', () => {
      const source = 'export pure circuit divide(a: Field, b: Field) : Field { }';
      const result = hover(source, 0, 20); // on 'divide'
      expect(result).toBeDefined();
      expect(result!.contents).toBe('export pure circuit divide(a: Field, b: Field) : Field');
    });
  });

  describe('ledger hover', () => {
    it('returns ledger signature', () => {
      const source = 'ledger myLedger : Field;';
      const result = hover(source, 0, 7); // on 'myLedger'
      expect(result).toBeDefined();
      expect(result!.contents).toBe('ledger myLedger : Field');
    });
  });

  describe('witness hover', () => {
    it('returns witness signature', () => {
      const source = 'witness myWitness(x: Field) : Field;';
      const result = hover(source, 0, 8); // on 'myWitness'
      expect(result).toBeDefined();
      expect(result!.contents).toBe('witness myWitness(x: Field) : Field');
    });
  });

  describe('struct hover', () => {
    it('returns struct signature with fields', () => {
      const source = 'struct Point { x: Field; y: Field; }';
      const result = hover(source, 0, 7); // on 'Point'
      expect(result).toBeDefined();
      expect(result!.contents).toContain('struct Point');
      expect(result!.contents).toContain('x: Field');
      expect(result!.contents).toContain('y: Field');
    });
  });

  describe('enum hover', () => {
    it('returns enum signature', () => {
      const source = 'enum Color { red, green, blue }';
      const result = hover(source, 0, 5); // on 'Color'
      expect(result).toBeDefined();
      expect(result!.contents).toBe('enum Color { red, green, blue }');
    });
  });

  describe('const hover', () => {
    it('returns const with type', () => {
      const source = 'const x: Field = 42;';
      const result = hover(source, 0, 6); // on 'x'
      expect(result).toBeDefined();
      expect(result!.contents).toBe('const x: Field');
    });

    it('returns const without type', () => {
      const source = 'const x = 42;';
      const result = hover(source, 0, 6); // on 'x'
      expect(result).toBeDefined();
      expect(result!.contents).toBe('const x');
    });
  });

  describe('parameter hover', () => {
    it('returns parameter signature', () => {
      const source = 'circuit foo(x: Field) : Field { }';
      const result = hover(source, 0, 12); // on 'x' parameter
      expect(result).toBeDefined();
      expect(result!.contents).toBe('(parameter) x: Field');
    });
  });

  describe('new type hover', () => {
    it('returns new type signature', () => {
      const source = 'new type MyBool = Boolean;';
      const result = hover(source, 0, 9); // on 'MyBool'
      expect(result).toBeDefined();
      expect(result!.contents).toContain('type');
      expect(result!.contents).toContain('MyBool');
    });

    it('returns hover for selective import specifier', () => {
      const source = 'import { foo } from MyModule;\ncircuit bar() : Void { foo; }';
      const result = hover(source, 1, 23); // on 'foo' in body
      expect(result).toBeDefined();
      expect(result!.contents).toContain('foo');
    });
  });

  describe('no hover', () => {
    it('returns undefined for keywords', () => {
      const source = 'circuit add() : Field { }';
      const result = hover(source, 0, 0); // on 'circuit' keyword
      expect(result).toBeUndefined();
    });

    it('returns undefined for whitespace', () => {
      const source = 'circuit  add() : Field { }';
      const result = hover(source, 0, 8); // on space
      expect(result).toBeUndefined();
    });

    it('returns undefined for unresolved identifier', () => {
      // 'nonexistent' is not declared
      const source = 'circuit foo(x: Field) : Field { }';
      // Hover at a position that doesn't have an identifier
      const result = hover(source, 0, 30); // on space/brace area
      expect(result).toBeUndefined();
    });
  });
});
