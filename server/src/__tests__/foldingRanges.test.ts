import { describe, it, expect } from 'vitest';
import { FoldingRangeKind } from 'vscode-languageserver/node';
import { parse } from '../parser';
import { getFoldingRanges } from '../foldingRanges';

function folds(source: string) {
  const result = parse(source);
  return getFoldingRanges(result.sourceFile);
}

describe('Folding Ranges', () => {
  describe('block declarations', () => {
    it('returns fold for module', () => {
      const ranges = folds(`module Foo {
  const x: Field = 1;
}`);
      expect(ranges).toHaveLength(1);
      expect(ranges[0].startLine).toBe(0);
      expect(ranges[0].endLine).toBe(2);
      expect(ranges[0].kind).toBe(FoldingRangeKind.Region);
    });

    it('returns fold for circuit with body', () => {
      const ranges = folds(`circuit add(x: Field, y: Field) : Field {
  return x;
}`);
      expect(ranges).toHaveLength(1);
      expect(ranges[0].startLine).toBe(0);
      expect(ranges[0].endLine).toBe(2);
      expect(ranges[0].kind).toBe(FoldingRangeKind.Region);
    });

    it('returns fold for struct', () => {
      const ranges = folds(`struct Point {
  x: Field;
  y: Field;
}`);
      expect(ranges).toHaveLength(1);
      expect(ranges[0].startLine).toBe(0);
      expect(ranges[0].endLine).toBe(3);
      expect(ranges[0].kind).toBe(FoldingRangeKind.Region);
    });

    it('returns fold for enum', () => {
      const ranges = folds(`enum Color {
  red,
  green,
  blue
}`);
      expect(ranges).toHaveLength(1);
      expect(ranges[0].startLine).toBe(0);
      expect(ranges[0].endLine).toBe(4);
      expect(ranges[0].kind).toBe(FoldingRangeKind.Region);
    });

    it('returns fold for contract', () => {
      const ranges = folds(`contract MyContract {
  circuit verify(proof: Field) : Boolean;
  circuit submit(data: Field) : Field;
}`);
      expect(ranges).toHaveLength(1);
      expect(ranges[0].startLine).toBe(0);
      expect(ranges[0].endLine).toBe(3);
      expect(ranges[0].kind).toBe(FoldingRangeKind.Region);
    });

    it('returns fold for constructor', () => {
      const ranges = folds(`module Foo {
  constructor() {
    const x: Field = 1;
  }
}`);
      // Module fold + constructor fold
      const constructorFold = ranges.find((r) => r.startLine === 1);
      expect(constructorFold).toBeDefined();
      expect(constructorFold!.endLine).toBe(3);
    });

    it('does not fold single-line declarations', () => {
      const ranges = folds('const x: Field = 1;');
      expect(ranges).toHaveLength(0);
    });
  });

  describe('nested declarations inside modules', () => {
    it('returns folds for module and nested circuit', () => {
      const ranges = folds(`module Foo {
  circuit bar(x: Field) : Field {
    return x;
  }
}`);
      expect(ranges).toHaveLength(2);
      // Module fold
      const moduleFold = ranges.find((r) => r.startLine === 0);
      expect(moduleFold).toBeDefined();
      expect(moduleFold!.endLine).toBe(4);
      // Circuit fold
      const circuitFold = ranges.find((r) => r.startLine === 1);
      expect(circuitFold).toBeDefined();
      expect(circuitFold!.endLine).toBe(3);
    });

    it('returns folds for nested struct inside module', () => {
      const ranges = folds(`module Types {
  struct Point {
    x: Field;
    y: Field;
  }
}`);
      expect(ranges).toHaveLength(2);
      const structFold = ranges.find((r) => r.startLine === 1);
      expect(structFold).toBeDefined();
      expect(structFold!.endLine).toBe(4);
    });
  });

  describe('statement-level folds', () => {
    it('returns fold for for-loop inside circuit', () => {
      const source = `circuit compute(n: Field) : Field {
  for i in 0..n {
    const x: Field = i;
  }
}`;
      const ranges = folds(source);
      // The for-loop should produce a fold starting on line 1
      const forFold = ranges.find((r) => r.startLine === 1);
      expect(forFold).toBeDefined();
      expect(forFold!.kind).toBe(FoldingRangeKind.Region);
      // End line depends on parser range; verify it spans multiple lines
      expect(forFold!.endLine).toBeGreaterThan(forFold!.startLine);
    });

    it('returns fold for if-statement inside circuit', () => {
      const ranges = folds(`circuit check(x: Field) : Field {
  if x == 0 {
    return 0;
  }
  return x;
}`);
      const ifFold = ranges.find((r) => r.startLine === 1);
      expect(ifFold).toBeDefined();
      expect(ifFold!.endLine).toBe(3);
    });
  });

  describe('import group folding', () => {
    it('folds consecutive imports', () => {
      const ranges = folds(`import Foo;
import Bar;
import Baz;`);
      expect(ranges).toHaveLength(1);
      expect(ranges[0].startLine).toBe(0);
      expect(ranges[0].endLine).toBe(2);
      expect(ranges[0].kind).toBe(FoldingRangeKind.Imports);
    });

    it('does not fold a single import', () => {
      const ranges = folds('import Foo;');
      expect(ranges).toHaveLength(0);
    });

    it('separates non-contiguous import groups', () => {
      const ranges = folds(`import Foo;
import Bar;
const x: Field = 1;
import Baz;`);
      // Should have one import fold for lines 0-1, no fold for lone import on line 3
      const importFolds = ranges.filter((r) => r.kind === FoldingRangeKind.Imports);
      expect(importFolds).toHaveLength(1);
      expect(importFolds[0].startLine).toBe(0);
      expect(importFolds[0].endLine).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty source', () => {
      const ranges = folds('');
      expect(ranges).toHaveLength(0);
    });

    it('skips error nodes and folds valid declarations', () => {
      // This source has a valid module followed by invalid syntax
      const ranges = folds(`module Foo {
  const x: Field = 1;
}
???`);
      // Should still fold the valid module
      const moduleFold = ranges.find((r) => r.startLine === 0);
      expect(moduleFold).toBeDefined();
      expect(moduleFold!.endLine).toBe(2);
    });

    it('handles single-line struct (no fold)', () => {
      const ranges = folds('struct Empty { }');
      // Single-line: no fold
      expect(ranges.filter((r) => r.kind === FoldingRangeKind.Region)).toHaveLength(0);
    });
  });
});
