import { describe, it, expect } from 'vitest';
import { parse } from './parser';
import { buildSymbolTable } from './symbols';
import { getCompletions } from './completion';
import { WorkspaceIndex } from './workspaceIndex';
import { fsPathToUri } from './moduleResolution';

function completions(source: string, line: number, column: number) {
  const result = parse(source);
  const { fileScope } = buildSymbolTable(result.sourceFile);
  return getCompletions(result, fileScope, line, column);
}

const BUILTIN_TYPES = [
  'Field',
  'Boolean',
  'Uint',
  'Bytes',
  'Vector',
  'Opaque',
  'Void',
  'Counter',
  'Set',
  'Map',
  'List',
  'MerkleTree',
  'HistoricMerkleTree',
  'Cell',
  'Kernel',
];
const BUILTIN_FUNCTIONS = [
  'map',
  'fold',
  'disclose',
  'pad',
  'slice',
  'default',
  'transientHash',
  'transientCommit',
  'persistentHash',
  'persistentCommit',
  'degradeToTransient',
  'upgradeFromTransient',
  'ecAdd',
  'ecMul',
  'ecMulGenerator',
  'hashToCurve',
  'ownPublicKey',
  'createZswapInput',
  'createZswapOutput',
];
const ALL_BUILTINS = [...BUILTIN_TYPES, ...BUILTIN_FUNCTIONS];

describe('Completion Provider', () => {
  describe('empty file', () => {
    it('returns only built-ins for empty file', () => {
      const result = completions('', 0, 0);
      const labels = result.map((c) => c.label);
      // Should contain all built-in types and functions
      for (const builtin of ALL_BUILTINS) {
        expect(labels).toContain(builtin);
      }
      // Should only have built-ins (no file-level declarations)
      expect(result.length).toBe(ALL_BUILTINS.length);
    });

    it('built-in types have kind builtin-type', () => {
      const result = completions('', 0, 0);
      for (const name of BUILTIN_TYPES) {
        const item = result.find((c) => c.label === name);
        expect(item).toBeDefined();
        expect(item!.kind).toBe('builtin-type');
      }
    });

    it('built-in functions have kind builtin-function', () => {
      const result = completions('', 0, 0);
      for (const name of BUILTIN_FUNCTIONS) {
        const item = result.find((c) => c.label === name);
        expect(item).toBeDefined();
        expect(item!.kind).toBe('builtin-function');
      }
    });
  });

  describe('top level', () => {
    it('includes file-level declarations plus built-ins', () => {
      // Line 0: ledger counter : Field;
      // Line 1: circuit inc() : Void { }
      // Line 2: <cursor here>
      const source = 'ledger counter : Field;\ncircuit inc() : Void { }\n';
      // Position at end, outside any declaration
      const result = completions(source, 2, 0);
      const labels = result.map((c) => c.label);
      expect(labels).toContain('counter');
      expect(labels).toContain('inc');
      // Plus all built-ins
      for (const builtin of ALL_BUILTINS) {
        expect(labels).toContain(builtin);
      }
    });
  });

  describe('inside circuit body', () => {
    it('includes parameters plus file-level symbols plus built-ins', () => {
      // Line 0: ledger counter : Field;
      // Line 1: circuit foo(x: Field) : Field {
      // Line 2:   <cursor here>
      // Line 3: }
      const source = 'ledger counter : Field;\ncircuit foo(x: Field) : Field {\n  \n}';
      // Position inside circuit body at line 2, col 2
      const result = completions(source, 2, 2);
      const labels = result.map((c) => c.label);
      // Should include parameter 'x'
      expect(labels).toContain('x');
      // Should include file-level symbols
      expect(labels).toContain('counter');
      expect(labels).toContain('foo');
      // Should include all built-ins
      for (const builtin of ALL_BUILTINS) {
        expect(labels).toContain(builtin);
      }
    });

    it('parameter has kind "parameter"', () => {
      const source = 'circuit foo(x: Field) : Field {\n  \n}';
      const result = completions(source, 1, 2);
      const paramItem = result.find((c) => c.label === 'x');
      expect(paramItem).toBeDefined();
      expect(paramItem!.kind).toBe('parameter');
    });
  });

  describe('module scope', () => {
    it('includes module children plus file-level plus built-ins', () => {
      // Line 0: ledger counter : Field;
      // Line 1: module Utils {
      // Line 2:   circuit helper(v: Field) : Field { }
      // Line 3: }
      const source =
        'ledger counter : Field;\nmodule Utils {\n  circuit helper(v: Field) : Field { }\n}';
      // Position inside module at line 2, col 2 (on the circuit declaration line)
      // The findScopeForPosition will find the module scope for positions inside the module range
      // But the module scope will only have 'helper', and parent (file scope) has 'counter' + 'Utils'
      // Let me test at line 2 col 0 which should be inside the module range
      const result = completions(source, 2, 0);
      const labels = result.map((c) => c.label);
      // Module child
      expect(labels).toContain('helper');
      // File-level (via parent scope chain)
      expect(labels).toContain('counter');
      expect(labels).toContain('Utils');
      // Built-ins
      for (const builtin of ALL_BUILTINS) {
        expect(labels).toContain(builtin);
      }
    });
  });

  describe('local variables from const statements', () => {
    it('local variables are visible after declaration in circuit body', () => {
      // Line 0: circuit foo(x: Field) : Field {
      // Line 1:   const y = x;
      // Line 2:   <cursor here - y should be visible>
      // Line 3: }
      const source = 'circuit foo(x: Field) : Field {\n  const y = x;\n  \n}';
      // Position at line 2, col 2 (after const y)
      const result = completions(source, 2, 2);
      const labels = result.map((c) => c.label);
      // y should be visible (registered in circuit scope by walkStatement)
      expect(labels).toContain('y');
      // parameter x should also be visible
      expect(labels).toContain('x');
    });
  });

  describe('completion details', () => {
    it('circuit completion includes signature detail', () => {
      const source = 'circuit add(a: Field, b: Field) : Field { }\n';
      const result = completions(source, 1, 0);
      const circuitItem = result.find((c) => c.label === 'add');
      expect(circuitItem).toBeDefined();
      expect(circuitItem!.detail).toContain('circuit add');
      expect(circuitItem!.detail).toContain('a: Field');
    });

    it('ledger completion includes type detail', () => {
      const source = 'ledger counter : Field;\n';
      const result = completions(source, 1, 0);
      const ledgerItem = result.find((c) => c.label === 'counter');
      expect(ledgerItem).toBeDefined();
      expect(ledgerItem!.detail).toContain('ledger counter');
      expect(ledgerItem!.detail).toContain('Field');
    });
  });

  describe('documentation on completion items', () => {
    it('built-in type has documentation', () => {
      const source = '';
      const result = completions(source, 0, 0);
      const fieldItem = result.find((c) => c.label === 'Field');
      expect(fieldItem).toBeDefined();
      expect(fieldItem!.documentation).toBeDefined();
      expect(fieldItem!.documentation).toContain('finite field');
    });

    it('built-in function has documentation', () => {
      const source = '';
      const result = completions(source, 0, 0);
      const mapItem = result.find((c) => c.label === 'map');
      expect(mapItem).toBeDefined();
      expect(mapItem!.documentation).toBeDefined();
      expect(mapItem!.documentation).toContain('Applies a function');
    });

    it('user-defined symbol has no documentation', () => {
      const source = 'circuit foo(x: Field) : Field { return x; }\n';
      const result = completions(source, 1, 0);
      const fooItem = result.find((c) => c.label === 'foo');
      expect(fooItem).toBeDefined();
      expect(fooItem!.documentation).toBeUndefined();
    });
  });

  describe('cross-file completion', () => {
    function makeUri(name: string): string {
      return fsPathToUri(`/project/src/${name}`);
    }

    it('completions include imported symbols with module detail', () => {
      const index = new WorkspaceIndex();
      const mathUri = makeUri('math.compact');
      const mainUri = makeUri('main.compact');

      const mathSrc = 'module MathUtils { export circuit add(x: Field, y: Field) : Field { } }';
      const mainSrc = 'import { add } from MathUtils;\ncircuit bar() : Void {\n  \n}';

      index.addFile(mathUri, mathSrc);
      index.addFile(mainUri, mainSrc);
      index.resolveFileImports(mainUri);

      const mainEntry = index.getFileEntry(mainUri)!;
      // Cursor inside bar() body at line 2, col 2
      const items = getCompletions(mainEntry.parseResult, mainEntry.fileScope, 2, 2, index);

      const addItem = items.find((c) => c.label === 'add');
      expect(addItem).toBeDefined();
      expect(addItem!.detail).toContain('circuit add');
      expect(addItem!.detail).toContain('from MathUtils');
    });
  });

  describe('version-gated completions', () => {
    it('includes built-ins for known version', () => {
      const source = 'pragma language_version 0.14.0;\ncircuit foo() : Field { }';
      const items = completions(source, 1, 40);
      const labels = items.map((c) => c.label);
      expect(labels).toContain('Field');
      expect(labels).toContain('map');
    });

    it('includes all built-ins when no version declared', () => {
      const source = 'circuit foo() : Field { }';
      const items = completions(source, 0, 24);
      const labels = items.map((c) => c.label);
      expect(labels).toContain('Field');
      expect(labels).toContain('map');
    });
  });
});
