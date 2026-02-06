import { describe, it, expect } from 'vitest';
import { BUILTIN_DOCS } from '../builtinDocs';
import { buildSymbolTable } from '../symbols';
import { parse } from '../parser';

const EXPECTED_BUILTINS = [
  // Built-in types
  'Field',
  'Boolean',
  'Uint',
  'Bytes',
  'Vector',
  'Opaque',
  'Void',
  // Built-in functions
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
  // Ledger ADT types
  'Counter',
  'Set',
  'Map',
  'List',
  'MerkleTree',
  'HistoricMerkleTree',
  'Cell',
  'Kernel',
];

describe('Built-in Documentation', () => {
  it('has a non-empty description for all 32 built-ins', () => {
    for (const name of EXPECTED_BUILTINS) {
      expect(BUILTIN_DOCS[name], `Missing docs for ${name}`).toBeDefined();
      expect(BUILTIN_DOCS[name].length, `Empty docs for ${name}`).toBeGreaterThan(0);
    }
    expect(EXPECTED_BUILTINS).toHaveLength(34);
  });

  it('populates documentation on SymbolInfo during createRootScope', () => {
    const result = parse('');
    const { fileScope } = buildSymbolTable(result.sourceFile);
    // Walk up to root scope
    let root = fileScope;
    while (root.parent) root = root.parent;

    for (const name of EXPECTED_BUILTINS) {
      const sym = root.symbols.get(name);
      expect(sym, `Symbol ${name} not in root scope`).toBeDefined();
      expect(sym!.documentation, `No docs on SymbolInfo for ${name}`).toBe(BUILTIN_DOCS[name]);
    }
  });

  it('does not set documentation on user-defined symbols', () => {
    const result = parse('circuit foo(x: Field) : Field { return x; }');
    const { fileScope } = buildSymbolTable(result.sourceFile);
    const sym = fileScope.symbols.get('foo');
    expect(sym).toBeDefined();
    expect(sym!.documentation).toBeUndefined();
  });
});
