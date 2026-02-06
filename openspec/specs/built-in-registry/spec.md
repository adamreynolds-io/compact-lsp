### Requirement: Root scope registers comprehensive built-in functions
The symbol table's root scope SHALL include all Compact built-in functions with their signatures: `map`, `fold`, `pad`, `slice`, `disclose`, `default`, `transientHash`, `transientCommit`, `persistentHash`, `persistentCommit`, `degradeToTransient`, `upgradeFromTransient`, `ecAdd`, `ecMul`, `ecMulGenerator`, `hashToCurve`, `ownPublicKey`, `createZswapInput`, `createZswapOutput`.

#### Scenario: Built-in function completion
- **WHEN** the user triggers completion in a circuit body
- **THEN** all built-in functions appear in the completion list with their parameter signatures

#### Scenario: Built-in function hover
- **WHEN** the user hovers over `disclose` in `disclose(value)`
- **THEN** hover displays the function signature including parameter types and return type

#### Scenario: Built-in function signature help
- **WHEN** the user types `pad(` to trigger signature help
- **THEN** signature help displays the parameter list for `pad`

### Requirement: Root scope registers ledger ADT types and their methods
The symbol table SHALL register ledger ADT types (`Counter`, `Set`, `Map`, `List`, `MerkleTree`, `HistoricMerkleTree`, `Cell`, `Kernel`) as known types with method signatures for member completion.

#### Scenario: Counter method completion
- **WHEN** the user types `counter.` after a `ledger counter : Counter;` declaration
- **THEN** completion suggests methods: `read`, `increment`, `decrement`, `lessThan`, `greaterThan`, `resetToDefault`

#### Scenario: Map method completion
- **WHEN** the user types `myMap.` after a `ledger myMap : Map<Field, Field>;` declaration
- **THEN** completion suggests methods: `member`, `insert`, `lookup`, `size`

#### Scenario: Cell implicit methods
- **WHEN** the user types `myCell.` after a `ledger myCell : Cell<Field>;` declaration
- **THEN** completion suggests methods: `read`, `write`, `reset_to_default`

### Requirement: Built-in functions with generic parameters support hover
Built-in functions that take generic parameters (e.g., `slice<N>`, `default<T>`, `transientHash<T>`) SHALL display their generic signatures on hover.

#### Scenario: Generic built-in hover
- **WHEN** the user hovers over `default` in `default<Counter>`
- **THEN** hover displays `default<T>(): T` or equivalent signature showing the generic parameter

### Requirement: Root scope registers version-specific NativePoint identifiers
When the resolved effective version is 0.19.0 or later, the root scope SHALL include `NativePoint` as an ADT type. When the resolved version is 0.19.0, the root scope SHALL include `NativePointX` and `NativePointY` as built-in functions. When the resolved version is 0.20.0 or later, the root scope SHALL include `nativePointX`, `nativePointY`, and `constructNativePoint` as built-in functions instead. When the resolved version is 0.18.0, the root scope SHALL include `CurvePoint` as an ADT type.

#### Scenario: Completion at version 0.18.0 includes CurvePoint
- **WHEN** a file declares `pragma language_version 0.18.0;` and the user triggers completion
- **THEN** `CurvePoint` appears in the completion list as a built-in type
- **AND** `NativePoint` does NOT appear

#### Scenario: Completion at version 0.19.0 includes NativePoint and uppercase accessors
- **WHEN** a file declares `pragma language_version 0.19.0;` and the user triggers completion
- **THEN** `NativePoint` appears as a built-in type
- **AND** `NativePointX` and `NativePointY` appear as built-in functions
- **AND** `CurvePoint` does NOT appear

#### Scenario: Completion at version 0.20.0 includes lowercase accessors and constructor
- **WHEN** a file declares `pragma language_version 0.20.0;` and the user triggers completion
- **THEN** `NativePoint` appears as a built-in type
- **AND** `nativePointX`, `nativePointY`, and `constructNativePoint` appear as built-in functions
- **AND** `NativePointX` and `NativePointY` do NOT appear

#### Scenario: Completion at version 0.21.0 matches 0.20.0
- **WHEN** a file declares `pragma language_version 0.21.0;` and the user triggers completion
- **THEN** the set of built-in types and functions is identical to version 0.20.0

#### Scenario: Hover on NativePoint shows documentation
- **WHEN** a file declares `pragma language_version >= 0.19.0;` and the user hovers over `NativePoint`
- **THEN** hover displays the type information and documentation for NativePoint

#### Scenario: No version pragma includes all built-ins
- **WHEN** a file has no pragma and the user triggers completion
- **THEN** both `NativePoint` and `CurvePoint` appear (all built-ins from all versions)
- **AND** both `nativePointX`/`nativePointY` and `NativePointX`/`NativePointY` appear
