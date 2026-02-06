## MODIFIED Requirements

### Requirement: Hover returns declaration signature for symbols
The hover provider SHALL respond to `textDocument/hover` requests by looking up the symbol at the cursor position in the symbol table and returning a formatted signature. When the symbol has documentation, the provider SHALL append the documentation text below the signature.

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

#### Scenario: Hover over built-in type with documentation
- **WHEN** the cursor is on `Field` which is a built-in type with documentation
- **THEN** hover returns the signature `(built-in type) Field` followed by the documentation text

#### Scenario: Hover over built-in function with documentation
- **WHEN** the cursor is on `map` which is a built-in function with documentation
- **THEN** hover returns the signature `(built-in) map` followed by the documentation text

#### Scenario: Hover over symbol without documentation
- **WHEN** the cursor is on a user-defined symbol with no documentation
- **THEN** hover returns only the signature, with no documentation text appended
