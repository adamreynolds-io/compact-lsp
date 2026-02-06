### Requirement: Documentation registry covers all built-in types
The registry SHALL provide a single-sentence description for every built-in type: Field, Boolean, Uint, Bytes, Vector, Opaque, Void.

#### Scenario: All built-in types documented
- **WHEN** the registry is queried for each built-in type name
- **THEN** each returns a non-empty string description

### Requirement: Documentation registry covers all built-in functions
The registry SHALL provide a single-sentence description for every built-in function: map, fold, disclose, pad, slice, default, transientHash, transientCommit, persistentHash, persistentCommit, degradeToTransient, upgradeFromTransient, ecAdd, ecMul, ecMulGenerator, hashToCurve, ownPublicKey, createZswapInput, createZswapOutput, left, right, burnAddress, NativePointX, NativePointY, nativePointX, nativePointY, constructNativePoint.

#### Scenario: All built-in functions documented
- **WHEN** the registry is queried for each built-in function name
- **THEN** each returns a non-empty string description

#### Scenario: NativePoint accessor functions documented
- **WHEN** the registry is queried for `NativePointX`, `NativePointY`, `nativePointX`, `nativePointY`
- **THEN** each returns a description related to accessing NativePoint coordinates

#### Scenario: constructNativePoint documented
- **WHEN** the registry is queried for `constructNativePoint`
- **THEN** it returns a description related to constructing a NativePoint from coordinates

### Requirement: Documentation registry covers all ledger ADT types
The registry SHALL provide a single-sentence description for every ledger ADT type: Counter, Set, Map, List, MerkleTree, HistoricMerkleTree, Cell, Kernel, Either, ZswapCoinPublicKey, ContractAddress, Maybe, CurvePoint, NativePoint.

#### Scenario: All ledger ADT types documented
- **WHEN** the registry is queried for each ledger ADT type name
- **THEN** each returns a non-empty string description

#### Scenario: CurvePoint documented
- **WHEN** the registry is queried for `CurvePoint`
- **THEN** it returns a description related to an elliptic curve point type

#### Scenario: NativePoint documented
- **WHEN** the registry is queried for `NativePoint`
- **THEN** it returns a description related to a native elliptic curve point type

### Requirement: Documentation registry covers all version registry built-ins
Every built-in name that appears in any version's capabilities (types, functions, ADT types) SHALL have a corresponding entry in the documentation registry. A test SHALL validate this by iterating the union of all built-ins from the version registry and asserting each has a non-empty documentation string.

#### Scenario: All version registry built-ins have documentation
- **WHEN** the union of all built-in names across all versions is computed
- **THEN** every name has a corresponding non-empty entry in `BUILTIN_DOCS`

#### Scenario: New built-in added to version registry without docs
- **WHEN** a developer adds a new built-in name to the version registry but not to `BUILTIN_DOCS`
- **THEN** the completeness test fails, identifying the missing entry

### Requirement: SymbolInfo carries documentation
The `SymbolInfo` interface SHALL include an optional `documentation` field of type `string`. Built-in symbols SHALL have this field populated from the registry during root scope creation.

#### Scenario: Built-in symbol has documentation
- **WHEN** `createRootScope()` registers the built-in type `Field`
- **THEN** the resulting `SymbolInfo` has `documentation` set to the registry's description for Field

#### Scenario: User-defined symbol has no documentation
- **WHEN** a user-defined circuit is added to the symbol table
- **THEN** the resulting `SymbolInfo` has `documentation` as `undefined`
