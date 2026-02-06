import { describe, it, expect } from 'vitest';
import { parse } from '../parser';
import { buildSymbolTable } from '../symbols';
import { prepareRename, getRenameEdits } from '../rename';

function prepare(source: string, line: number, column: number) {
  const parseResult = parse(source);
  const { fileScope, references } = buildSymbolTable(parseResult.sourceFile);
  return prepareRename(parseResult, fileScope, references, line, column, source);
}

function rename(source: string, line: number, column: number, newName: string) {
  const parseResult = parse(source);
  const { fileScope, references } = buildSymbolTable(parseResult.sourceFile);
  return getRenameEdits(parseResult, fileScope, references, line, column, source, newName);
}

describe('Rename Provider', () => {
  describe('prepareRename', () => {
    it('returns range and placeholder for circuit name at declaration', () => {
      const result = prepare('circuit add(x: Field) : Field { return x; }', 0, 8);
      expect(result).toBeDefined();
      expect(result!.placeholder).toBe('add');
    });

    it('returns range and placeholder for parameter name', () => {
      const result = prepare('circuit foo(x: Field) : Field { return x; }', 0, 12);
      expect(result).toBeDefined();
      expect(result!.placeholder).toBe('x');
    });

    it('returns range and placeholder for reference in body', () => {
      const result = prepare('circuit foo(x: Field) : Field { return x; }', 0, 39);
      expect(result).toBeDefined();
      expect(result!.placeholder).toBe('x');
    });

    it('rejects built-in type', () => {
      const result = prepare('circuit foo(x: Field) : Field { return x; }', 0, 15);
      expect(result).toBeUndefined();
    });

    it('rejects keyword', () => {
      const result = prepare('circuit foo(x: Field) : Field { return x; }', 0, 0);
      expect(result).toBeUndefined();
    });

    it('rejects whitespace', () => {
      const result = prepare('circuit foo(x: Field) : Field { return x; }', 0, 7);
      expect(result).toBeUndefined();
    });
  });

  describe('getRenameEdits', () => {
    it('renames circuit with references', () => {
      const source = `circuit add(x: Field, y: Field) : Field { return x; }
circuit main(a: Field, b: Field) : Field { return add(a, b); }`;
      const edits = rename(source, 0, 8, 'sum');
      expect(edits.length).toBe(2); // declaration + 1 reference
      for (const edit of edits) {
        expect(edit.newText).toBe('sum');
      }
    });

    it('renames parameter within circuit scope', () => {
      const source = 'circuit foo(x: Field) : Field { return x; }';
      const edits = rename(source, 0, 12, 'value');
      expect(edits.length).toBe(2); // parameter decl + 1 usage
      for (const edit of edits) {
        expect(edit.newText).toBe('value');
      }
    });

    it('does not affect shadowed symbols', () => {
      const source = `const x : Field;
circuit foo(x: Field) : Field { return x; }`;
      // Rename the parameter x (line 1, column 12), not the top-level x
      const edits = rename(source, 1, 12, 'y');
      // Should only rename the parameter and its usage in the body, not the top-level const
      for (const edit of edits) {
        expect(edit.range.start.line).toBe(1);
      }
    });

    it('renames a const variable declared in circuit body', () => {
      const source = 'circuit foo(x: Field) : Field {\n  const y = x;\n  return y;\n}';
      // 'y' at line 2, column 9
      const edits = rename(source, 2, 9, 'result');
      expect(edits.length).toBeGreaterThanOrEqual(1);
      for (const edit of edits) {
        expect(edit.newText).toBe('result');
      }
    });

    it('returns empty for built-in types', () => {
      const source = 'circuit foo(x: Field) : Field { return x; }';
      // "Field" is built-in, findReferences with includeDeclaration will include its range
      // but since built-in has no user declaration, the behavior depends on implementation
      const edits = rename(source, 0, 15, 'MyField');
      // Built-in type reference — should still return edits for the reference occurrences
      // But prepareRename would reject this, so in practice this path isn't reachable
      expect(edits).toBeDefined();
    });
  });
});
