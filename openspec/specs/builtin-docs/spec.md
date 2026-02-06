### Requirement: Documentation registry covers all built-in types
The registry SHALL provide a single-sentence description for every built-in type: Field, Boolean, Uint, Bytes, Vector, Opaque, Void.

#### Scenario: All built-in types documented
- **WHEN** the registry is queried for each built-in type name
- **THEN** each returns a non-empty string description

### Requirement: Documentation registry covers all built-in functions
The registry SHALL provide a single-sentence description for every built-in function: map, fold, disclose, pad, slice, default, transientHash, transientCommit, persistentHash, persistentCommit, degradeToTransient, upgradeFromTransient, ecAdd, ecMul, ecMulGenerator, hashToCurve, ownPublicKey, createZswapInput, createZswapOutput.

#### Scenario: All built-in functions documented
- **WHEN** the registry is queried for each built-in function name
- **THEN** each returns a non-empty string description

### Requirement: Documentation registry covers all ledger ADT types
The registry SHALL provide a single-sentence description for every ledger ADT type: Counter, Set, Map, List, MerkleTree, HistoricMerkleTree, Cell, Kernel.

#### Scenario: All ledger ADT types documented
- **WHEN** the registry is queried for each ledger ADT type name
- **THEN** each returns a non-empty string description

### Requirement: SymbolInfo carries documentation
The `SymbolInfo` interface SHALL include an optional `documentation` field of type `string`. Built-in symbols SHALL have this field populated from the registry during root scope creation.

#### Scenario: Built-in symbol has documentation
- **WHEN** `createRootScope()` registers the built-in type `Field`
- **THEN** the resulting `SymbolInfo` has `documentation` set to the registry's description for Field

#### Scenario: User-defined symbol has no documentation
- **WHEN** a user-defined circuit is added to the symbol table
- **THEN** the resulting `SymbolInfo` has `documentation` as `undefined`
