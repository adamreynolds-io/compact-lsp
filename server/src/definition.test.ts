import { describe, it, expect } from 'vitest';
import { tokenize } from './lexer';
import { parse } from './parser';
import { buildSymbolTable } from './symbols';
import { getDefinition } from './definition';
import { WorkspaceIndex } from './workspaceIndex';
import { fsPathToUri } from './moduleResolution';

function definition(source: string, line: number, column: number) {
  const result = parse(source);
  const { fileScope, references } = buildSymbolTable(result.sourceFile);
  const tokens = tokenize(source);
  return getDefinition(result, fileScope, references, line, column, tokens);
}

describe('Definition Provider', () => {
  describe('circuit reference', () => {
    it('resolves circuit reference to circuit declaration', () => {
      // Line 0: circuit foo(x: Field) : Field {
      // Line 1:   return bar(x);
      // Line 2: }
      // Line 3: circuit bar(y: Field) : Field { }
      const source =
        'circuit foo(x: Field) : Field {\n  return bar(x);\n}\ncircuit bar(y: Field) : Field { }';
      // 'bar' on line 1 is at column 9 (2 spaces + "return " = 9, then "bar" starts at 9)
      const result = definition(source, 1, 9);
      expect(result).toBeDefined();
      // bar declaration starts at line 3, column 0
      expect(result!.range.start.line).toBe(3);
      expect(result!.range.start.column).toBe(0);
    });
  });

  describe('parameter reference', () => {
    it('resolves parameter reference inside body to parameter', () => {
      // Line 0: circuit foo(x: Field) : Field {
      //          0123456789012345678901234567890
      // Line 1:   return x;
      //          01234567
      const source = 'circuit foo(x: Field) : Field {\n  return x;\n}';
      // 'x' on line 1 is at column 9
      const result = definition(source, 1, 9);
      expect(result).toBeDefined();
      // x parameter declaration is on line 0. 'x' starts at column 12
      expect(result!.range.start.line).toBe(0);
      expect(result!.range.start.column).toBe(12);
    });
  });

  describe('local variable reference', () => {
    it('resolves const statement local variable to its declaration', () => {
      // Line 0: circuit foo(x: Field) : Field {
      // Line 1:   const y = x;
      // Line 2:   return y;
      // Line 3: }
      const source = 'circuit foo(x: Field) : Field {\n  const y = x;\n  return y;\n}';
      // 'y' on line 2 is at column 9
      const result = definition(source, 2, 9);
      expect(result).toBeDefined();
      // const y declaration is on line 1
      expect(result!.range.start.line).toBe(1);
    });

    it('resolves for-loop variable to the for statement', () => {
      // Line 0: circuit foo(items: Field) : Void {
      // Line 1:   for (const i of items) {
      // Line 2:     i;
      // Line 3:   }
      // Line 4: }
      const source =
        'circuit foo(items: Field) : Void {\n  for (const i of items) {\n    i;\n  }\n}';
      // 'i' on line 2 is at column 4
      const result = definition(source, 2, 4);
      expect(result).toBeDefined();
      // for statement is on line 1
      expect(result!.range.start.line).toBe(1);
    });

    it('resolves top-level const declaration', () => {
      // Top-level const declarations DO have a declaration AST node
      // Line 0: const MAX: Field = 100;
      // Line 1: circuit foo() : Field {
      // Line 2:   MAX;
      // Line 3: }
      const source = 'const MAX: Field = 100;\ncircuit foo() : Field {\n  MAX;\n}';
      // 'MAX' on line 2 at column 2
      const result = definition(source, 2, 2);
      expect(result).toBeDefined();
      expect(result!.range.start.line).toBe(0);
      expect(result!.range.start.column).toBe(0);
    });
  });

  describe('ledger reference', () => {
    it('resolves ledger reference to ledger declaration', () => {
      // Line 0: ledger counter : Field;
      // Line 1: circuit inc() : Void {
      // Line 2:   counter;
      // Line 3: }
      const source = 'ledger counter : Field;\ncircuit inc() : Void {\n  counter;\n}';
      // 'counter' on line 2 is at column 2
      const result = definition(source, 2, 2);
      expect(result).toBeDefined();
      // ledger declaration starts at line 0, column 0
      expect(result!.range.start.line).toBe(0);
      expect(result!.range.start.column).toBe(0);
    });
  });

  describe('struct reference', () => {
    it('resolves struct reference to struct declaration', () => {
      // Line 0: struct Point { x: Field; y: Field; }
      // Line 1: circuit use(p: Field) : Field {
      // Line 2:   Point;
      // Line 3: }
      const source =
        'struct Point { x: Field; y: Field; }\ncircuit use(p: Field) : Field {\n  Point;\n}';
      // 'Point' on line 2 at column 2. Note: 'Point' is a TypeKeyword
      const result = definition(source, 2, 2);
      // Point is not a TypeKeyword - it's an Identifier. Let me check...
      // Actually TYPE_KEYWORDS = ['Field', 'Boolean', 'Uint', 'Bytes', 'Vector', 'Opaque', 'Void']
      // 'Point' is an Identifier, not a TypeKeyword. The getDefinition only handles Identifier and TypeKeyword.
      expect(result).toBeDefined();
      expect(result!.range.start.line).toBe(0);
      expect(result!.range.start.column).toBe(0);
    });
  });

  describe('enum reference', () => {
    it('resolves enum reference to enum declaration', () => {
      // Line 0: enum Color { red, green, blue }
      // Line 1: circuit use(p: Field) : Field {
      // Line 2:   Color;
      // Line 3: }
      const source =
        'enum Color { red, green, blue }\ncircuit use(p: Field) : Field {\n  Color;\n}';
      // 'Color' on line 2 at column 2
      const result = definition(source, 2, 2);
      expect(result).toBeDefined();
      expect(result!.range.start.line).toBe(0);
      expect(result!.range.start.column).toBe(0);
    });
  });

  describe('selective import specifier', () => {
    it('resolves selective import to import declaration', () => {
      // Line 0: import { foo } from MyModule;
      // Line 1: circuit bar() : Void { foo; }
      const source = 'import { foo } from MyModule;\ncircuit bar() : Void { foo; }';
      // 'foo' on line 1 at column 23
      const result = definition(source, 1, 23);
      expect(result).toBeDefined();
      expect(result!.range.start.line).toBe(0);
    });
  });

  describe('destructured bindings', () => {
    it('resolves tuple destructured variable to const statement', () => {
      // Line 0: circuit foo() : Void {
      // Line 1:   const [a, b] = pair;
      // Line 2:   a;
      // Line 3: }
      const source = 'circuit foo() : Void {\n  const [a, b] = pair;\n  a;\n}';
      // 'a' on line 2 at column 2
      const result = definition(source, 2, 2);
      expect(result).toBeDefined();
      expect(result!.range.start.line).toBe(1);
    });

    it('resolves struct destructured variable to const statement', () => {
      const source = 'circuit foo() : Void {\n  const {x, y: z} = point;\n  z;\n}';
      // 'z' on line 2 at column 2
      const result = definition(source, 2, 2);
      expect(result).toBeDefined();
      expect(result!.range.start.line).toBe(1);
    });
  });

  describe('new type reference', () => {
    it('resolves new type reference to declaration', () => {
      // Line 0: new type MyBool = Boolean;
      // Line 1: circuit foo() : Void { MyBool; }
      const source = 'new type MyBool = Boolean;\ncircuit foo() : Void { MyBool; }';
      // 'MyBool' on line 1 at column 23
      const result = definition(source, 1, 23);
      expect(result).toBeDefined();
      expect(result!.range.start.line).toBe(0);
    });
  });

  describe('built-in types', () => {
    it('returns undefined for built-in types (no source location)', () => {
      // 'Field' is a built-in type; it has no source declaration
      const source = 'circuit foo(x: Field) : Field { }';
      // 'Field' at line 0, column 15 (in "x: Field")
      const result = definition(source, 0, 15);
      expect(result).toBeUndefined();
    });
  });

  describe('keywords', () => {
    it('returns undefined for keywords', () => {
      const source = 'circuit foo() : Field { }';
      // 'circuit' keyword at line 0, column 0
      const result = definition(source, 0, 0);
      expect(result).toBeUndefined();
    });
  });

  describe('whitespace', () => {
    it('returns undefined for whitespace', () => {
      const source = 'circuit  foo() : Field { }';
      // space at line 0, column 8
      const result = definition(source, 0, 8);
      expect(result).toBeUndefined();
    });
  });

  describe('declaration name itself', () => {
    it('returns own range when cursor is on the declaration name', () => {
      // Line 0: circuit foo(x: Field) : Field { }
      //          0123456789
      // 'foo' starts at column 8
      const source = 'circuit foo(x: Field) : Field { }';
      const result = definition(source, 0, 8);
      expect(result).toBeDefined();
      // The circuit declaration starts at line 0, column 0
      expect(result!.range.start.line).toBe(0);
      expect(result!.range.start.column).toBe(0);
    });
  });

  describe('cross-file definition', () => {
    function makeUri(name: string): string {
      return fsPathToUri(`/project/src/${name}`);
    }

    it('go-to-definition on imported symbol returns location in source file', () => {
      const index = new WorkspaceIndex();
      const mathUri = makeUri('math.compact');
      const mainUri = makeUri('main.compact');

      const mathSrc = 'module MathUtils { export circuit add(x: Field) : Field { } }';
      const mainSrc = 'import { add } from MathUtils;\ncircuit bar() : Void { add; }';

      index.addFile(mathUri, mathSrc);
      index.addFile(mainUri, mainSrc);
      index.resolveFileImports(mainUri);

      const mainEntry = index.getFileEntry(mainUri)!;
      const tokens = tokenize(mainSrc);
      // 'add' on line 1 at column 23
      const result = getDefinition(
        mainEntry.parseResult,
        mainEntry.fileScope,
        mainEntry.references,
        1,
        23,
        tokens,
        index,
      );

      expect(result).toBeDefined();
      expect(result!.uri).toBe(mathUri);
    });

    it('unresolvable import returns local range (no cross-file)', () => {
      const index = new WorkspaceIndex();
      const mainUri = makeUri('main.compact');
      const mainSrc = 'import { foo } from UnknownModule;\ncircuit bar() : Void { foo; }';

      index.addFile(mainUri, mainSrc);
      index.resolveFileImports(mainUri);

      const mainEntry = index.getFileEntry(mainUri)!;
      const tokens = tokenize(mainSrc);
      // 'foo' on line 1 at column 23
      const result = getDefinition(
        mainEntry.parseResult,
        mainEntry.fileScope,
        mainEntry.references,
        1,
        23,
        tokens,
        index,
      );

      // Should still return a result (the import declaration itself)
      expect(result).toBeDefined();
      expect(result!.uri).toBeUndefined();
    });
  });
});
