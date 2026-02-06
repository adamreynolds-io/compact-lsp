## Requirements

### Requirement: Find-references returns all usages of a symbol
The find-references provider SHALL respond to `textDocument/references` requests by returning all locations where the symbol under the cursor is referenced, within the current file.

#### Scenario: Find references of a circuit
- **WHEN** the cursor is on `add` which is declared as `circuit add(...)` and called in two places
- **THEN** the provider returns the declaration location and both call-site locations

#### Scenario: Find references of a parameter
- **WHEN** the cursor is on parameter `x` declared in `circuit foo(x: Field)` and used in the body
- **THEN** the provider returns the parameter declaration location and all usage locations in the body

#### Scenario: Find references of a local variable
- **WHEN** the cursor is on `y` declared as `const y = 1;` and used twice in the same body
- **THEN** the provider returns the const declaration and both usage locations

#### Scenario: Find references of a ledger
- **WHEN** the cursor is on `counter` declared as `ledger counter : Field;` and referenced in circuit bodies
- **THEN** the provider returns the ledger declaration and all reference locations

#### Scenario: Find references of a struct
- **WHEN** the cursor is on `Point` which is used as a type annotation and in struct construction
- **THEN** the provider returns the struct declaration and all usage locations

#### Scenario: Include declaration option
- **WHEN** the request includes `includeDeclaration: true`
- **THEN** the declaration location is included in the results

#### Scenario: Exclude declaration option
- **WHEN** the request includes `includeDeclaration: false`
- **THEN** only reference locations are returned, not the declaration itself

### Requirement: Find-references returns no result for non-resolvable positions
The find-references provider SHALL return an empty list when the cursor is not on an identifier that resolves to a known declaration.

#### Scenario: Find references on keyword
- **WHEN** the cursor is on a keyword like `circuit`
- **THEN** an empty list is returned

#### Scenario: Find references on whitespace
- **WHEN** the cursor is on whitespace
- **THEN** an empty list is returned

#### Scenario: Find references on unresolved identifier
- **WHEN** the cursor is on an identifier that does not resolve to any declaration
- **THEN** an empty list is returned
