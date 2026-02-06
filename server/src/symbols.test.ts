import { describe, it, expect } from 'vitest';
import { parse } from './parser';
import {
  buildSymbolTable,
  resolveSymbol,
  createRootScope,
  formatSignature,
  getExportedSymbols,
} from './symbols';

describe('Symbol Table', () => {
  describe('declaration registration', () => {
    it('registers circuit declarations', () => {
      const { sourceFile } = parse('circuit add(x: Field, y: Field) : Field { }');
      const { fileScope } = buildSymbolTable(sourceFile);
      const sym = fileScope.symbols.get('add');
      expect(sym).toBeDefined();
      expect(sym!.kind).toBe('circuit');
    });

    it('registers ledger declarations', () => {
      const { sourceFile } = parse('ledger counter : Field;');
      const { fileScope } = buildSymbolTable(sourceFile);
      expect(fileScope.symbols.get('counter')).toBeDefined();
      expect(fileScope.symbols.get('counter')!.kind).toBe('ledger');
    });

    it('registers witness declarations', () => {
      const { sourceFile } = parse('witness getSecret() : Field;');
      const { fileScope } = buildSymbolTable(sourceFile);
      expect(fileScope.symbols.get('getSecret')).toBeDefined();
      expect(fileScope.symbols.get('getSecret')!.kind).toBe('witness');
    });

    it('registers struct declarations', () => {
      const { sourceFile } = parse('struct Point { x: Field; y: Field; }');
      const { fileScope } = buildSymbolTable(sourceFile);
      expect(fileScope.symbols.get('Point')).toBeDefined();
      expect(fileScope.symbols.get('Point')!.kind).toBe('struct');
    });

    it('registers enum declarations', () => {
      const { sourceFile } = parse('enum Color { red, green, blue }');
      const { fileScope } = buildSymbolTable(sourceFile);
      expect(fileScope.symbols.get('Color')).toBeDefined();
      expect(fileScope.symbols.get('Color')!.kind).toBe('enum');
    });

    it('registers const declarations', () => {
      const { sourceFile } = parse('const x: Field = 42;');
      const { fileScope } = buildSymbolTable(sourceFile);
      expect(fileScope.symbols.get('x')).toBeDefined();
      expect(fileScope.symbols.get('x')!.kind).toBe('const');
    });

    it('registers contract declarations', () => {
      const { sourceFile } = parse('contract MyContract { circuit foo(x: Field) : Field; }');
      const { fileScope } = buildSymbolTable(sourceFile);
      expect(fileScope.symbols.get('MyContract')).toBeDefined();
      expect(fileScope.symbols.get('MyContract')!.kind).toBe('contract');
    });
  });

  describe('scope nesting', () => {
    it('creates child scope for modules', () => {
      const { sourceFile } = parse('module Foo { circuit bar() : Field { } }');
      const { fileScope } = buildSymbolTable(sourceFile);
      expect(fileScope.symbols.get('Foo')).toBeDefined();
      // Module scope is a child
      const moduleScope = fileScope.children.find((c) => c.name === 'Foo');
      expect(moduleScope).toBeDefined();
      expect(moduleScope!.symbols.get('bar')).toBeDefined();
    });

    it('creates child scope for circuits with parameters', () => {
      const { sourceFile } = parse('circuit add(x: Field, y: Field) : Field { }');
      const { fileScope } = buildSymbolTable(sourceFile);
      const circuitScope = fileScope.children.find((c) => c.name === 'add');
      expect(circuitScope).toBeDefined();
      expect(circuitScope!.symbols.get('x')).toBeDefined();
      expect(circuitScope!.symbols.get('y')).toBeDefined();
      expect(circuitScope!.symbols.get('x')!.kind).toBe('parameter');
    });

    it('circuit params not visible in parent scope', () => {
      const { sourceFile } = parse('circuit add(x: Field) : Field { }');
      const { fileScope } = buildSymbolTable(sourceFile);
      expect(fileScope.symbols.get('x')).toBeUndefined();
    });
  });

  describe('scope resolution', () => {
    it('resolves symbols in current scope', () => {
      const { sourceFile } = parse('circuit add(x: Field) : Field { }');
      const { fileScope } = buildSymbolTable(sourceFile);
      expect(resolveSymbol('add', fileScope)).toBeDefined();
    });

    it('resolves symbols from parent scope', () => {
      const { sourceFile } = parse('ledger counter : Field;\ncircuit inc(x: Field) : Field { }');
      const { fileScope } = buildSymbolTable(sourceFile);
      // From within circuit scope, should resolve file-level symbols
      const circuitScope = fileScope.children.find((c) => c.name === 'inc');
      expect(circuitScope).toBeDefined();
      expect(resolveSymbol('counter', circuitScope!)).toBeDefined();
    });

    it('returns undefined for undeclared symbols', () => {
      const { sourceFile } = parse('circuit add(x: Field) : Field { }');
      const { fileScope } = buildSymbolTable(sourceFile);
      expect(resolveSymbol('nonexistent', fileScope)).toBeUndefined();
    });

    it('resolves built-in types from root scope', () => {
      const { sourceFile } = parse('ledger x : Field;');
      const { fileScope } = buildSymbolTable(sourceFile);
      expect(resolveSymbol('Field', fileScope)).toBeDefined();
      expect(resolveSymbol('Boolean', fileScope)).toBeDefined();
      expect(resolveSymbol('Uint', fileScope)).toBeDefined();
      expect(resolveSymbol('Vector', fileScope)).toBeDefined();
    });

    it('resolves built-in functions from root scope', () => {
      const { sourceFile } = parse('ledger x : Field;');
      const { fileScope } = buildSymbolTable(sourceFile);
      expect(resolveSymbol('map', fileScope)).toBeDefined();
      expect(resolveSymbol('fold', fileScope)).toBeDefined();
      expect(resolveSymbol('disclose', fileScope)).toBeDefined();
      expect(resolveSymbol('pad', fileScope)).toBeDefined();
      expect(resolveSymbol('default', fileScope)).toBeDefined();
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
      const { sourceFile } = parse('export pure circuit add(x: Field, y: Field) : Field { }');
      const { fileScope } = buildSymbolTable(sourceFile);
      const sym = fileScope.symbols.get('add')!;
      expect(formatSignature(sym)).toBe('export pure circuit add(x: Field, y: Field) : Field');
    });

    it('formats ledger signature', () => {
      const { sourceFile } = parse('export sealed ledger counter : Field;');
      const { fileScope } = buildSymbolTable(sourceFile);
      const sym = fileScope.symbols.get('counter')!;
      expect(formatSignature(sym)).toBe('export sealed ledger counter : Field');
    });

    it('formats parameter signature', () => {
      const { sourceFile } = parse('circuit foo(x: Field) : Field { }');
      const { fileScope } = buildSymbolTable(sourceFile);
      const circuitScope = fileScope.children.find((c) => c.name === 'foo')!;
      const sym = circuitScope.symbols.get('x')!;
      expect(formatSignature(sym)).toBe('(parameter) x: Field');
    });

    it('formats const without type', () => {
      const { sourceFile } = parse('const x = 42;');
      const { fileScope } = buildSymbolTable(sourceFile);
      const sym = fileScope.symbols.get('x')!;
      expect(formatSignature(sym)).toBe('const x');
    });

    it('formats const with type', () => {
      const { sourceFile } = parse('const x: Field = 42;');
      const { fileScope } = buildSymbolTable(sourceFile);
      const sym = fileScope.symbols.get('x')!;
      expect(formatSignature(sym)).toBe('const x: Field');
    });

    it('formats enum signature', () => {
      const { sourceFile } = parse('enum Color { red, green, blue }');
      const { fileScope } = buildSymbolTable(sourceFile);
      const sym = fileScope.symbols.get('Color')!;
      expect(formatSignature(sym)).toBe('enum Color { red, green, blue }');
    });
  });

  describe('reference tracking', () => {
    it('collects identifier references from circuit body', () => {
      const { sourceFile } = parse('circuit foo(x: Field) : Field { return x; }');
      const { references } = buildSymbolTable(sourceFile);
      expect(references.length).toBeGreaterThan(0);
      const xRef = references.find((r) => r.name === 'x');
      expect(xRef).toBeDefined();
    });

    it('registers local variables from const statements', () => {
      const { sourceFile } = parse('circuit foo() : Field { const y = 1; return y; }');
      const { fileScope, references } = buildSymbolTable(sourceFile);
      const circuitScope = fileScope.children.find((c) => c.name === 'foo');
      expect(circuitScope).toBeDefined();
      expect(circuitScope!.symbols.get('y')).toBeDefined();
      expect(circuitScope!.symbols.get('y')!.kind).toBe('const');
      const yRefs = references.filter((r) => r.name === 'y');
      expect(yRefs.length).toBeGreaterThan(0);
    });

    it('creates block scope for block statements', () => {
      const { sourceFile } = parse('circuit foo() : Void { { const z = 1; } }');
      const { fileScope } = buildSymbolTable(sourceFile);
      const circuitScope = fileScope.children.find((c) => c.name === 'foo');
      expect(circuitScope).toBeDefined();
      // z should be in a child block scope, not in the circuit scope
      expect(circuitScope!.symbols.get('z')).toBeUndefined();
      const blockScope = circuitScope!.children.find((c) => c.name === '<block>');
      expect(blockScope).toBeDefined();
      expect(blockScope!.symbols.get('z')).toBeDefined();
    });

    it('creates scope for for-loop with iteration variable', () => {
      const { sourceFile } = parse('circuit foo() : Void { for (const i of items) { i; } }');
      const { fileScope } = buildSymbolTable(sourceFile);
      const circuitScope = fileScope.children.find((c) => c.name === 'foo');
      expect(circuitScope).toBeDefined();
      // i should be in a for-loop child scope
      expect(circuitScope!.symbols.get('i')).toBeUndefined();
      const forScope = circuitScope!.children.find((c) => c.name === '<for>');
      expect(forScope).toBeDefined();
      expect(forScope!.symbols.get('i')).toBeDefined();
    });
  });

  describe('new declaration types', () => {
    it('registers new type declarations', () => {
      const { sourceFile } = parse('new type MyBool = Boolean;');
      const { fileScope } = buildSymbolTable(sourceFile);
      const sym = fileScope.symbols.get('MyBool');
      expect(sym).toBeDefined();
      expect(sym!.kind).toBe('type');
    });

    it('registers selective import specifiers', () => {
      const { sourceFile } = parse('import { foo, bar as baz } from MyModule;');
      const { fileScope } = buildSymbolTable(sourceFile);
      expect(fileScope.symbols.get('foo')).toBeDefined();
      expect(fileScope.symbols.get('baz')).toBeDefined();
      expect(fileScope.symbols.get('bar')).toBeUndefined(); // aliased, not registered under original
    });

    it('registers destructured bindings in const', () => {
      const { sourceFile } = parse('circuit f() : Void { const [a, b] = pair; }');
      const { fileScope } = buildSymbolTable(sourceFile);
      const circuitScope = fileScope.children[0];
      expect(circuitScope.symbols.get('a')).toBeDefined();
      expect(circuitScope.symbols.get('b')).toBeDefined();
    });

    it('registers struct destructured bindings', () => {
      const { sourceFile } = parse('circuit f() : Void { const {x, y: z} = point; }');
      const { fileScope } = buildSymbolTable(sourceFile);
      const circuitScope = fileScope.children[0];
      expect(circuitScope.symbols.get('x')).toBeDefined();
      expect(circuitScope.symbols.get('z')).toBeDefined(); // alias
      expect(circuitScope.symbols.get('y')).toBeUndefined(); // not the alias
    });

    it('creates scope for block-body arrow function', () => {
      const { sourceFile } = parse(
        'circuit f() : Void { const a = (x: Field) => { const y = x; return y; }; }',
      );
      const { fileScope } = buildSymbolTable(sourceFile);
      const circuitScope = fileScope.children[0];
      const arrowScope = circuitScope.children.find((c) => c.name === '<arrow>');
      expect(arrowScope).toBeDefined();
      expect(arrowScope!.symbols.get('x')).toBeDefined();
      expect(arrowScope!.symbols.get('y')).toBeDefined();
    });
  });

  describe('resolvedUri / resolvedName', () => {
    it('non-imported symbols have resolvedUri and resolvedName as undefined', () => {
      const { sourceFile } = parse('circuit add(x: Field) : Field { }');
      const { fileScope } = buildSymbolTable(sourceFile);
      const sym = fileScope.symbols.get('add')!;
      expect(sym.resolvedUri).toBeUndefined();
      expect(sym.resolvedName).toBeUndefined();
    });

    it('imported specifiers have resolvedUri and resolvedName as undefined before resolution', () => {
      const { sourceFile } = parse('import { foo } from MyModule;');
      const { fileScope } = buildSymbolTable(sourceFile);
      const sym = fileScope.symbols.get('foo')!;
      expect(sym.resolvedUri).toBeUndefined();
      expect(sym.resolvedName).toBeUndefined();
    });
  });

  describe('getExportedSymbols', () => {
    it('finds exported circuit', () => {
      const { sourceFile } = parse('export circuit add(x: Field) : Field { }');
      const { fileScope } = buildSymbolTable(sourceFile);
      const exports = getExportedSymbols(sourceFile, fileScope);
      expect(exports.has('add')).toBe(true);
      expect(exports.get('add')!.kind).toBe('circuit');
    });

    it('finds exported struct', () => {
      const { sourceFile } = parse('export struct Point { x: Field; y: Field; }');
      const { fileScope } = buildSymbolTable(sourceFile);
      const exports = getExportedSymbols(sourceFile, fileScope);
      expect(exports.has('Point')).toBe(true);
    });

    it('finds export list entries', () => {
      const { sourceFile } = parse(
        'circuit foo() : Field { }\ncircuit bar() : Field { }\nexport { foo, bar };',
      );
      const { fileScope } = buildSymbolTable(sourceFile);
      const exports = getExportedSymbols(sourceFile, fileScope);
      expect(exports.has('foo')).toBe(true);
      expect(exports.has('bar')).toBe(true);
    });

    it('excludes non-exported symbol', () => {
      const { sourceFile } = parse(
        'circuit helper() : Void { }\nexport circuit add(x: Field) : Field { }',
      );
      const { fileScope } = buildSymbolTable(sourceFile);
      const exports = getExportedSymbols(sourceFile, fileScope);
      expect(exports.has('helper')).toBe(false);
      expect(exports.has('add')).toBe(true);
    });

    it('finds exported ledger', () => {
      const { sourceFile } = parse('export ledger counter : Field;');
      const { fileScope } = buildSymbolTable(sourceFile);
      const exports = getExportedSymbols(sourceFile, fileScope);
      expect(exports.has('counter')).toBe(true);
    });

    it('finds exported new type', () => {
      const { sourceFile } = parse('export new type MyBool = Boolean;');
      const { fileScope } = buildSymbolTable(sourceFile);
      const exports = getExportedSymbols(sourceFile, fileScope);
      expect(exports.has('MyBool')).toBe(true);
    });
  });

  describe('expanded built-in registry', () => {
    it('has all built-in functions', () => {
      const rootScope = createRootScope();
      const expectedFns = [
        'map',
        'fold',
        'disclose',
        'pad',
        'slice',
        'default',
        'transientHash',
        'persistentHash',
        'ecAdd',
        'ecMul',
        'ecMulGenerator',
        'hashToCurve',
        'ownPublicKey',
      ];
      for (const name of expectedFns) {
        const sym = rootScope.symbols.get(name);
        expect(sym).toBeDefined();
        expect(sym!.kind).toBe('builtin-function');
      }
    });

    it('has ledger ADT types', () => {
      const rootScope = createRootScope();
      const expectedTypes = ['Counter', 'Set', 'Map', 'List', 'MerkleTree', 'Cell', 'Kernel'];
      for (const name of expectedTypes) {
        const sym = rootScope.symbols.get(name);
        expect(sym).toBeDefined();
        expect(sym!.kind).toBe('builtin-type');
      }
    });
  });

  describe('version-gated root scope', () => {
    it('registers all built-ins when no version is provided', () => {
      const root = createRootScope();
      expect(root.symbols.has('Field')).toBe(true);
      expect(root.symbols.has('map')).toBe(true);
      expect(root.symbols.has('Counter')).toBe(true);
    });

    it('registers built-ins for a recognized version', () => {
      const root = createRootScope('0.14.0');
      expect(root.symbols.has('Field')).toBe(true);
      expect(root.symbols.has('map')).toBe(true);
      expect(root.symbols.has('Counter')).toBe(true);
    });

    it('registers all built-ins for an unrecognized version', () => {
      const root = createRootScope('99.0.0');
      // Unknown version falls back to all built-ins
      expect(root.symbols.has('Field')).toBe(true);
      expect(root.symbols.has('map')).toBe(true);
    });

    it('buildSymbolTable resolves version from SourceFile', () => {
      const { sourceFile } = parse('pragma language_version 0.14.0;');
      const { fileScope } = buildSymbolTable(sourceFile);
      // Root scope should have Field (it's in 0.14.0)
      const root = fileScope.parent!;
      expect(root.symbols.has('Field')).toBe(true);
    });
  });
});
