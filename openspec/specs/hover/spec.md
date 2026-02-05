## ADDED Requirements

### Requirement: Hover returns declaration signature for symbols
The hover provider SHALL respond to `textDocument/hover` requests by looking up the symbol at the cursor position in the symbol table and returning a formatted signature.

#### Scenario: Hover over circuit name
- **WHEN** the cursor is on the identifier `add` which refers to `circuit add(x: Field, y: Field) : Field`
- **THEN** hover returns the signature: `circuit add(x: Field, y: Field) : Field`

#### Scenario: Hover over pure exported circuit
- **WHEN** the cursor is on a circuit declared as `export pure circuit divide(a: Field, b: Field) : Field`
- **THEN** hover returns: `export pure circuit divide(a: Field, b: Field) : Field`

#### Scenario: Hover over ledger name
- **WHEN** the cursor is on `myLedger` which refers to `ledger myLedger : Field`
- **THEN** hover returns: `ledger myLedger : Field`

#### Scenario: Hover over witness name
- **WHEN** the cursor is on `myWitness` which refers to `witness myWitness(x: Field) : Field`
- **THEN** hover returns: `witness myWitness(x: Field) : Field`

#### Scenario: Hover over struct name
- **WHEN** the cursor is on `Point` which refers to `struct Point { x: Field; y: Field; }`
- **THEN** hover returns the struct definition showing name and fields

#### Scenario: Hover over enum name
- **WHEN** the cursor is on `Color` which refers to `enum Color { red, green, blue }`
- **THEN** hover returns: `enum Color { red, green, blue }`

#### Scenario: Hover over const name
- **WHEN** the cursor is on `x` which refers to `const x: Field = 42`
- **THEN** hover returns: `const x: Field`

#### Scenario: Hover over const without type annotation
- **WHEN** the cursor is on `x` which refers to `const x = someExpr`
- **THEN** hover returns: `const x`

#### Scenario: Hover over parameter name
- **WHEN** the cursor is on parameter `x` inside `circuit foo(x: Field) : Field { ... }`
- **THEN** hover returns: `(parameter) x: Field`

### Requirement: Hover returns nothing for non-symbol positions
The hover provider SHALL return no result when the cursor is not on an identifier that resolves to a known symbol.

#### Scenario: Hover over keyword
- **WHEN** the cursor is on the keyword `circuit`
- **THEN** hover returns no result

#### Scenario: Hover over whitespace
- **WHEN** the cursor is on whitespace
- **THEN** hover returns no result

#### Scenario: Hover over unresolved identifier
- **WHEN** the cursor is on an identifier that does not resolve to any declaration
- **THEN** hover returns no result
