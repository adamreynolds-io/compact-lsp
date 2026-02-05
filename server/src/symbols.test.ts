import { describe, it, expect } from 'vitest';
import { parse } from './parser';
import { buildSymbolTable, resolveSymbol, createRootScope, formatSignature } from './symbols';

describe('Symbol Table', () => {
  describe('declaration registration', () => {
    it('registers circuit declarations', () => {
      const { sourceFile } = parse('circuit add(x: Field, y: Field) : Field { }');
      const scope = buildSymbolTable(sourceFile);
      const sym = scope.symbols.get('add');
      expect(sym).toBeDefined();
      expect(sym!.kind).toBe('circuit');
    });

    it('registers ledger declarations', () => {
      const { sourceFile } = parse('ledger counter : Field;');
      const scope = buildSymbolTable(sourceFile);
      expect(scope.symbols.get('counter')).toBeDefined();
      expect(scope.symbols.get('counter')!.kind).toBe('ledger');
    });

    it('registers witness declarations', () => {
      const { sourceFile } = parse('witness getSecret() : Field;');
      const scope = buildSymbolTable(sourceFile);
      expect(scope.symbols.get('getSecret')).toBeDefined();
      expect(scope.symbols.get('getSecret')!.kind).toBe('witness');
    });

    it('registers struct declarations', () => {
      const { sourceFile } = parse('struct Point { x: Field; y: Field; }');
      const scope = buildSymbolTable(sourceFile);
      expect(scope.symbols.get('Point')).toBeDefined();
      expect(scope.symbols.get('Point')!.kind).toBe('struct');
    });

    it('registers enum declarations', () => {
      const { sourceFile } = parse('enum Color { red, green, blue }');
      const scope = buildSymbolTable(sourceFile);
      expect(scope.symbols.get('Color')).toBeDefined();
      expect(scope.symbols.get('Color')!.kind).toBe('enum');
    });

    it('registers const declarations', () => {
      const { sourceFile } = parse('const x: Field = 42;');
      const scope = buildSymbolTable(sourceFile);
      expect(scope.symbols.get('x')).toBeDefined();
      expect(scope.symbols.get('x')!.kind).toBe('const');
    });

    it('registers contract declarations', () => {
      const { sourceFile } = parse(
        'contract MyContract { circuit foo(x: Field) : Field; }',
      );
      const scope = buildSymbolTable(sourceFile);
      expect(scope.symbols.get('MyContract')).toBeDefined();
      expect(scope.symbols.get('MyContract')!.kind).toBe('contract');
    });
  });

  describe('scope nesting', () => {
    it('creates child scope for modules', () => {
      const { sourceFile } = parse(
        'module Foo { circuit bar() : Field { } }',
      );
      const scope = buildSymbolTable(sourceFile);
      expect(scope.symbols.get('Foo')).toBeDefined();
      // Module scope is a child
      const moduleScope = scope.children.find((c) => c.name === 'Foo');
      expect(moduleScope).toBeDefined();
      expect(moduleScope!.symbols.get('bar')).toBeDefined();
    });

    it('creates child scope for circuits with parameters', () => {
      const { sourceFile } = parse('circuit add(x: Field, y: Field) : Field { }');
      const scope = buildSymbolTable(sourceFile);
      const circuitScope = scope.children.find((c) => c.name === 'add');
      expect(circuitScope).toBeDefined();
      expect(circuitScope!.symbols.get('x')).toBeDefined();
      expect(circuitScope!.symbols.get('y')).toBeDefined();
      expect(circuitScope!.symbols.get('x')!.kind).toBe('parameter');
    });

    it('circuit params not visible in parent scope', () => {
      const { sourceFile } = parse('circuit add(x: Field) : Field { }');
      const scope = buildSymbolTable(sourceFile);
      expect(scope.symbols.get('x')).toBeUndefined();
    });
  });

  describe('scope resolution', () => {
    it('resolves symbols in current scope', () => {
      const { sourceFile } = parse('circuit add(x: Field) : Field { }');
      const scope = buildSymbolTable(sourceFile);
      expect(resolveSymbol('add', scope)).toBeDefined();
    });

    it('resolves symbols from parent scope', () => {
      const { sourceFile } = parse(
        'ledger counter : Field;\ncircuit inc(x: Field) : Field { }',
      );
      const scope = buildSymbolTable(sourceFile);
      // From within circuit scope, should resolve file-level symbols
      const circuitScope = scope.children.find((c) => c.name === 'inc');
      expect(circuitScope).toBeDefined();
      expect(resolveSymbol('counter', circuitScope!)).toBeDefined();
    });

    it('returns undefined for undeclared symbols', () => {
      const { sourceFile } = parse('circuit add(x: Field) : Field { }');
      const scope = buildSymbolTable(sourceFile);
      expect(resolveSymbol('nonexistent', scope)).toBeUndefined();
    });

    it('resolves built-in types from root scope', () => {
      const { sourceFile } = parse('ledger x : Field;');
      const scope = buildSymbolTable(sourceFile);
      expect(resolveSymbol('Field', scope)).toBeDefined();
      expect(resolveSymbol('Boolean', scope)).toBeDefined();
      expect(resolveSymbol('Uint', scope)).toBeDefined();
      expect(resolveSymbol('Vector', scope)).toBeDefined();
    });

    it('resolves built-in functions from root scope', () => {
      const { sourceFile } = parse('ledger x : Field;');
      const scope = buildSymbolTable(sourceFile);
      expect(resolveSymbol('map', scope)).toBeDefined();
      expect(resolveSymbol('fold', scope)).toBeDefined();
      expect(resolveSymbol('disclose', scope)).toBeDefined();
      expect(resolveSymbol('pad', scope)).toBeDefined();
      expect(resolveSymbol('default', scope)).toBeDefined();
    });
  });

  describe('built-in registration', () => {
    it('root scope has all built-in types', () => {
      const root = createRootScope();
      for (const name of ['Field', 'Boolean', 'Uint', 'Bytes', 'Vector', 'Opaque', 'Void']) {
        expect(root.symbols.get(name)).toBeDefined();
        expect(root.symbols.get(name)!.kind).toBe('builtin-type');
      }
    });

    it('root scope has all built-in functions', () => {
      const root = createRootScope();
      for (const name of ['map', 'fold', 'disclose', 'pad', 'default']) {
        expect(root.symbols.get(name)).toBeDefined();
        expect(root.symbols.get(name)!.kind).toBe('builtin-function');
      }
    });
  });

  describe('signature formatting', () => {
    it('formats circuit signature', () => {
      const { sourceFile } = parse(
        'export pure circuit add(x: Field, y: Field) : Field { }',
      );
      const scope = buildSymbolTable(sourceFile);
      const sym = scope.symbols.get('add')!;
      expect(formatSignature(sym)).toBe(
        'export pure circuit add(x: Field, y: Field) : Field',
      );
    });

    it('formats ledger signature', () => {
      const { sourceFile } = parse('export sealed ledger counter : Field;');
      const scope = buildSymbolTable(sourceFile);
      const sym = scope.symbols.get('counter')!;
      expect(formatSignature(sym)).toBe('export sealed ledger counter : Field');
    });

    it('formats parameter signature', () => {
      const { sourceFile } = parse('circuit foo(x: Field) : Field { }');
      const scope = buildSymbolTable(sourceFile);
      const circuitScope = scope.children.find((c) => c.name === 'foo')!;
      const sym = circuitScope.symbols.get('x')!;
      expect(formatSignature(sym)).toBe('(parameter) x: Field');
    });

    it('formats const without type', () => {
      const { sourceFile } = parse('const x = 42;');
      const scope = buildSymbolTable(sourceFile);
      const sym = scope.symbols.get('x')!;
      expect(formatSignature(sym)).toBe('const x');
    });

    it('formats const with type', () => {
      const { sourceFile } = parse('const x: Field = 42;');
      const scope = buildSymbolTable(sourceFile);
      const sym = scope.symbols.get('x')!;
      expect(formatSignature(sym)).toBe('const x: Field');
    });

    it('formats enum signature', () => {
      const { sourceFile } = parse('enum Color { red, green, blue }');
      const scope = buildSymbolTable(sourceFile);
      const sym = scope.symbols.get('Color')!;
      expect(formatSignature(sym)).toBe('enum Color { red, green, blue }');
    });
  });
});
