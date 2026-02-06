## MODIFIED Requirements

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
