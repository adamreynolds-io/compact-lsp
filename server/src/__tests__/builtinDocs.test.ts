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
  // Built-in functions (0.18.0+)
  'left',
  'right',
  'burnAddress',
  // Ledger ADT types
  'Counter',
  'Set',
  'Map',
  'List',
  'MerkleTree',
  'HistoricMerkleTree',
  'Cell',
  'Kernel',
  // Built-in functions (0.19.0+)
  'NativePointX',
  'NativePointY',
  // Built-in functions (0.20.0+)
  'nativePointX',
  'nativePointY',
  'constructNativePoint',
  // Ledger ADT types (0.18.0+)
  'Either',
  'ZswapCoinPublicKey',
  'ContractAddress',
  'Maybe',
  'CurvePoint',
  // Ledger ADT types (0.19.0+)
  'NativePoint',
];

describe('Built-in Documentation', () => {
  it('has a non-empty description for all built-ins', () => {
    for (const name of EXPECTED_BUILTINS) {
      expect(BUILTIN_DOCS[name], `Missing docs for ${name}`).toBeDefined();
      expect(BUILTIN_DOCS[name].length, `Empty docs for ${name}`).toBeGreaterThan(0);
    }
    expect(EXPECTED_BUILTINS).toHaveLength(48);
  });

  it('populates documentation on SymbolInfo during createRootScope (0.21.0)', () => {
    const result = parse('pragma language_version 0.21.0;');
    const { fileScope } = buildSymbolTable(result.sourceFile);
    let root = fileScope;
    while (root.parent) root = root.parent;

    // 0.21.0 built-ins (excludes CurvePoint, NativePointX, NativePointY)
    const v21Builtins = EXPECTED_BUILTINS.filter(
      (n) => !['CurvePoint', 'NativePointX', 'NativePointY'].includes(n)
    );
    for (const name of v21Builtins) {
      const sym = root.symbols.get(name);
      expect(sym, `Symbol ${name} not in root scope`).toBeDefined();
      expect(sym!.documentation, `No docs on SymbolInfo for ${name}`).toBe(BUILTIN_DOCS[name]);
    }
  });

  it('populates documentation for version-specific built-ins at their version', () => {
    // CurvePoint is available at 0.18.0
    const r18 = parse('pragma language_version 0.18.0;');
    const { fileScope: fs18 } = buildSymbolTable(r18.sourceFile);
    let root18 = fs18;
    while (root18.parent) root18 = root18.parent;
    expect(root18.symbols.get('CurvePoint')?.documentation).toBe(BUILTIN_DOCS['CurvePoint']);

    // NativePointX/Y are available at 0.19.0
    const r19 = parse('pragma language_version 0.19.0;');
    const { fileScope: fs19 } = buildSymbolTable(r19.sourceFile);
    let root19 = fs19;
    while (root19.parent) root19 = root19.parent;
    expect(root19.symbols.get('NativePointX')?.documentation).toBe(BUILTIN_DOCS['NativePointX']);
    expect(root19.symbols.get('NativePointY')?.documentation).toBe(BUILTIN_DOCS['NativePointY']);
  });

  it('has non-empty documentation for all 7 new NativePoint-related entries', () => {
    const newEntries = [
      'CurvePoint',
      'NativePoint',
      'NativePointX',
      'NativePointY',
      'nativePointX',
      'nativePointY',
      'constructNativePoint',
    ];
    for (const name of newEntries) {
      expect(BUILTIN_DOCS[name], `Missing docs for ${name}`).toBeDefined();
      expect(BUILTIN_DOCS[name].length, `Empty docs for ${name}`).toBeGreaterThan(0);
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
