## MODIFIED Requirements

### Requirement: Signature help shows parameter info for circuit calls
The signature help provider SHALL respond to `textDocument/signatureHelp` requests by returning the signature, active parameter index, and when available, function-level documentation when the cursor is inside the argument list of a call to a circuit, witness, or built-in function.

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

#### Scenario: Built-in function call with documentation
- **WHEN** the document contains `map(|)` and `map` is a built-in function with documentation
- **THEN** signature help returns the signature with active parameter index 0 and includes the documentation text

#### Scenario: User-defined circuit call without documentation
- **WHEN** the document contains `foo(|)` and `foo` is a user-defined circuit with no documentation
- **THEN** signature help returns the signature without documentation
