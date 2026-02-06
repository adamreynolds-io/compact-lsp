## ADDED Requirements

### Requirement: Document symbols returns hierarchical symbol tree
The document symbols provider SHALL respond to `textDocument/documentSymbol` requests by returning a hierarchical `DocumentSymbol[]` tree reflecting the structure of the file's declarations.

#### Scenario: Top-level circuit
- **WHEN** the document contains `circuit add(x: Field, y: Field) : Field { ... }`
- **THEN** document symbols returns a symbol with name `add`, kind Function, and detail `(x: Field, y: Field) : Field`

#### Scenario: Top-level struct
- **WHEN** the document contains `struct Point { x: Field; y: Field; }`
- **THEN** document symbols returns a symbol with name `Point`, kind Struct, with children for each field

#### Scenario: Top-level enum
- **WHEN** the document contains `enum Color { red, green, blue }`
- **THEN** document symbols returns a symbol with name `Color`, kind Enum, with children for each variant

#### Scenario: Top-level ledger
- **WHEN** the document contains `ledger balance : Field`
- **THEN** document symbols returns a symbol with name `balance`, kind Variable, and detail `Field`

#### Scenario: Top-level witness
- **WHEN** the document contains `witness secret(x: Field) : Boolean`
- **THEN** document symbols returns a symbol with name `secret`, kind Function, and detail `(x: Field) : Boolean`

#### Scenario: Top-level const
- **WHEN** the document contains `const MAX : Uint<32> = 100`
- **THEN** document symbols returns a symbol with name `MAX`, kind Constant

#### Scenario: Module with nested declarations
- **WHEN** the document contains `module Math { circuit add(...) { ... } struct Vec { ... } }`
- **THEN** document symbols returns a symbol with name `Math`, kind Module, containing children `add` (Function) and `Vec` (Struct)

#### Scenario: Contract with circuits
- **WHEN** the document contains `contract Token { circuit transfer(...); circuit balance(...); }`
- **THEN** document symbols returns a symbol with name `Token`, kind Interface, containing children for each circuit

#### Scenario: Export and pure modifiers in detail
- **WHEN** the document contains `export pure circuit verify(proof: Field) : Boolean { ... }`
- **THEN** document symbols returns a symbol with name `verify`, kind Function, and the detail includes `export pure`

#### Scenario: Empty document
- **WHEN** the document is empty or contains only pragmas/imports
- **THEN** document symbols returns an empty array

### Requirement: Document symbol ranges cover full declarations
Each document symbol SHALL have a `range` covering the full declaration and a `selectionRange` covering just the name identifier.

#### Scenario: Circuit range vs selection range
- **WHEN** the document contains a circuit definition spanning lines 1-5 with name `add` on line 1
- **THEN** the symbol's `range` covers lines 1-5 and `selectionRange` covers only the `add` identifier
