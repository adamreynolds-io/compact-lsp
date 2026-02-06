## ADDED Requirements

### Requirement: Go-to-definition returns declaration location for identifiers
The go-to-definition provider SHALL respond to `textDocument/definition` requests by finding the symbol at the cursor position and returning the source location of its declaration.

#### Scenario: Go-to-definition on a circuit name reference
- **WHEN** the cursor is on identifier `add` which refers to `circuit add(x: Field) : Field { }`
- **THEN** the provider returns the source range of the `add` circuit declaration

#### Scenario: Go-to-definition on a parameter reference
- **WHEN** the cursor is on identifier `x` inside a circuit body, where `x` is a parameter of that circuit
- **THEN** the provider returns the source range of the parameter `x` in the circuit's parameter list

#### Scenario: Go-to-definition on a local variable reference
- **WHEN** the cursor is on identifier `y` inside a circuit body, where `y` was declared as `const y = expr;`
- **THEN** the provider returns the source range of the `const y` declaration

#### Scenario: Go-to-definition on a ledger reference
- **WHEN** the cursor is on identifier `counter` which refers to `ledger counter : Field;`
- **THEN** the provider returns the source range of the ledger declaration

#### Scenario: Go-to-definition on a struct reference
- **WHEN** the cursor is on identifier `Point` which refers to `struct Point { ... }`
- **THEN** the provider returns the source range of the struct declaration

#### Scenario: Go-to-definition on an enum reference
- **WHEN** the cursor is on identifier `Color` which refers to `enum Color { ... }`
- **THEN** the provider returns the source range of the enum declaration

#### Scenario: Go-to-definition on a declaration name itself
- **WHEN** the cursor is on the name `add` in the declaration `circuit add(...)`
- **THEN** the provider returns the same location (declaration points to itself)

### Requirement: Go-to-definition returns no result for non-resolvable positions
The go-to-definition provider SHALL return no result when the cursor is not on an identifier that resolves to a known declaration.

#### Scenario: Go-to-definition on keyword
- **WHEN** the cursor is on the keyword `circuit`
- **THEN** no result is returned

#### Scenario: Go-to-definition on unresolved identifier
- **WHEN** the cursor is on an identifier that does not resolve to any declaration
- **THEN** no result is returned

#### Scenario: Go-to-definition on whitespace
- **WHEN** the cursor is on whitespace
- **THEN** no result is returned

#### Scenario: Go-to-definition on built-in type
- **WHEN** the cursor is on `Field` (a built-in type)
- **THEN** no result is returned (built-ins have no source location)
