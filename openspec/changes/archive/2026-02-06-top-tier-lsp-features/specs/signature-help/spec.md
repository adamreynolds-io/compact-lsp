## ADDED Requirements

### Requirement: Signature help shows parameter info for circuit calls
The signature help provider SHALL respond to `textDocument/signatureHelp` requests by returning the signature and active parameter index when the cursor is inside the argument list of a call to a circuit, witness, or built-in function.

#### Scenario: Cursor inside circuit call after open paren
- **WHEN** the document contains `add(|)` with cursor at `|` and `add` is declared as `circuit add(x: Field, y: Field) : Field`
- **THEN** signature help returns the signature `circuit add(x: Field, y: Field) : Field` with active parameter index 0

#### Scenario: Cursor after first comma
- **WHEN** the document contains `add(1, |)` with cursor at `|`
- **THEN** signature help returns the same signature with active parameter index 1

#### Scenario: Cursor after second comma in 3-param call
- **WHEN** the document contains `foo(a, b, |)` with cursor at `|` and `foo` has 3 parameters
- **THEN** signature help returns the signature with active parameter index 2

#### Scenario: Cursor inside nested call
- **WHEN** the document contains `outer(inner(|))` with cursor at `|`
- **THEN** signature help returns the signature for `inner`, not `outer`

#### Scenario: Witness call
- **WHEN** the document contains `secret(|)` and `secret` is declared as `witness secret(x: Field) : Boolean`
- **THEN** signature help returns the signature `witness secret(x: Field) : Boolean` with active parameter index 0

#### Scenario: Built-in function call
- **WHEN** the document contains `map(|)` and `map` is a built-in function
- **THEN** signature help returns a signature for the built-in with active parameter index 0

### Requirement: Signature help triggers on open paren and comma
The server SHALL register `(` and `,` as signature help trigger characters.

#### Scenario: Typing open paren triggers signature help
- **WHEN** the user types `(` after a circuit name
- **THEN** the editor requests signature help and receives parameter info

#### Scenario: Typing comma advances active parameter
- **WHEN** the user types `,` inside a call argument list
- **THEN** the editor requests signature help and receives the updated active parameter index

### Requirement: Signature help returns nothing for non-call positions
The signature help provider SHALL return no result when the cursor is not inside a call expression's argument list.

#### Scenario: Cursor outside any call
- **WHEN** the cursor is on a standalone identifier like `x` not inside a call
- **THEN** signature help returns no result

#### Scenario: Cursor on a call to an unresolved name
- **WHEN** the cursor is inside `unknown(|)` where `unknown` does not resolve to any symbol
- **THEN** signature help returns no result

#### Scenario: Callee has no parameters
- **WHEN** `noArgs` is declared as `circuit noArgs() : Field` and cursor is at `noArgs(|)`
- **THEN** signature help returns the signature with an empty parameter list
