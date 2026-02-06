## ADDED Requirements

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

### Requirement: Hover shows version info for pragma language_version
The hover provider SHALL return version information when the cursor is on a `pragma language_version` declaration line. The hover content SHALL show the declared version string and whether it is a supported version.

#### Scenario: Hover over supported pragma language_version
- **WHEN** the cursor is on a `pragma language_version 0.14.0;` line and `0.14.0` is a supported version
- **THEN** hover returns content indicating the language version `0.14.0` and that it is supported

#### Scenario: Hover over unsupported pragma language_version
- **WHEN** the cursor is on a `pragma language_version 99.0.0;` line and `99.0.0` is not a supported version
- **THEN** hover returns content indicating the language version `99.0.0` and that it is not recognized

#### Scenario: Hover over non-version pragma
- **WHEN** the cursor is on a `pragma other_thing 1.0;` line
- **THEN** hover returns no result (no special handling for non-version pragmas)
