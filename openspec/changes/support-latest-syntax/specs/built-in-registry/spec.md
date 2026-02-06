## ADDED Requirements

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
