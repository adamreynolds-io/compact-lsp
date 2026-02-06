import { describe, it, expect } from 'vitest';
import { tokenize } from './lexer';
import { parse } from './parser';
import { buildSymbolTable } from './symbols';
import { getHoverInfo } from './hover';
import { WorkspaceIndex } from './workspaceIndex';
import { fsPathToUri } from './moduleResolution';

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

  describe('cross-file hover', () => {
    function makeUri(name: string): string {
      return fsPathToUri(`/project/src/${name}`);
    }

    it('hover on imported symbol shows source signature', () => {
      const index = new WorkspaceIndex();
      const mathUri = makeUri('math.compact');
      const mainUri = makeUri('main.compact');

      const mathSrc = 'module MathUtils { export circuit add(x: Field, y: Field) : Field { } }';
      const mainSrc = 'import { add } from MathUtils;\ncircuit bar() : Void { add; }';

      index.addFile(mathUri, mathSrc);
      index.addFile(mainUri, mainSrc);
      index.resolveFileImports(mainUri);

      const mainEntry = index.getFileEntry(mainUri)!;
      const tokens = tokenize(mainSrc);
      // 'add' on line 1 at column 23
      const result = getHoverInfo(mainEntry.parseResult, mainEntry.fileScope, 1, 23, tokens, index);

      expect(result).toBeDefined();
      expect(result!.contents).toContain('circuit add');
      expect(result!.contents).toContain('x: Field');
    });

    it('hover on built-in type includes documentation', () => {
      const source = 'circuit foo(x: Field) : Field { return x; }';
      const result = hover(source, 0, 15); // on 'Field' in parameter type
      expect(result).toBeDefined();
      expect(result!.documentation).toBeDefined();
      expect(result!.documentation).toContain('finite field');
    });

    it('hover on built-in function includes documentation', () => {
      const source = 'circuit foo() : Void { map; }';
      const result = hover(source, 0, 23); // on 'map'
      expect(result).toBeDefined();
      expect(result!.documentation).toBeDefined();
      expect(result!.documentation).toContain('Applies a function');
    });

    it('hover on user-defined symbol has no documentation', () => {
      const source = 'circuit add(x: Field) : Field { return x; }';
      const result = hover(source, 0, 8); // on 'add'
      expect(result).toBeDefined();
      expect(result!.documentation).toBeUndefined();
    });

    it('hover on unresolvable import shows import-only info', () => {
      const index = new WorkspaceIndex();
      const mainUri = makeUri('main.compact');
      const mainSrc = 'import { foo } from MyModule;\ncircuit bar() : Void { foo; }';

      index.addFile(mainUri, mainSrc);
      // Don't resolve imports — so resolvedUri/resolvedName are undefined
      // The symbol won't have resolvedUri, so it falls through to regular hover

      const mainEntry = index.getFileEntry(mainUri)!;
      const tokens = tokenize(mainSrc);
      // 'foo' on line 1 at column 23
      const result = getHoverInfo(mainEntry.parseResult, mainEntry.fileScope, 1, 23, tokens, index);

      // Without resolvedUri, it just shows the local symbol info
      expect(result).toBeDefined();
    });
  });

  describe('pragma version hover', () => {
    it('shows supported for known exact version', () => {
      const result = hover('pragma language_version 0.14.0;', 0, 10);
      expect(result).toBeDefined();
      expect(result!.contents).toContain('0.14.0');
      expect(result!.contents).toContain('supported');
    });

    it('shows unsupported for unknown version', () => {
      const result = hover('pragma language_version 99.0.0;', 0, 10);
      expect(result).toBeDefined();
      expect(result!.contents).toContain('99.0.0');
      expect(result!.contents).toContain('unsupported');
    });

    it('shows effective version for >= fallback', () => {
      const result = hover('pragma language_version >= 0.10.0;', 0, 10);
      expect(result).toBeDefined();
      expect(result!.contents).toContain('0.10.0');
      expect(result!.contents).toContain('0.14.0');
    });

    it('returns nothing for non-version pragma', () => {
      const result = hover('pragma other_thing 1.0;', 0, 10);
      expect(result).toBeUndefined();
    });
  });
});
