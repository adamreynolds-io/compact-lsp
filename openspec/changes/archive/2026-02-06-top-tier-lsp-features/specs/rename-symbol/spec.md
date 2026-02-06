## ADDED Requirements

### Requirement: Prepare rename validates the cursor position
The rename provider SHALL respond to `textDocument/prepareRename` requests by returning the range and placeholder text of the symbol under the cursor, or rejecting if the position is not renameable.

#### Scenario: Cursor on a circuit name at its declaration
- **WHEN** the cursor is on the identifier `add` in `circuit add(x: Field) : Field { ... }`
- **THEN** prepare rename returns the range of `add` and placeholder text `add`

#### Scenario: Cursor on a reference to a symbol
- **WHEN** the cursor is on the identifier `add` in a call expression `add(1, 2)`
- **THEN** prepare rename returns the range of `add` and placeholder text `add`

#### Scenario: Cursor on a parameter name
- **WHEN** the cursor is on the parameter `x` inside `circuit foo(x: Field) : Field { ... }`
- **THEN** prepare rename returns the range and placeholder text `x`

#### Scenario: Cursor on a built-in type
- **WHEN** the cursor is on the type keyword `Field`
- **THEN** prepare rename rejects (built-in types cannot be renamed)

#### Scenario: Cursor on a built-in function
- **WHEN** the cursor is on the built-in function `map`
- **THEN** prepare rename rejects (built-in functions cannot be renamed)

#### Scenario: Cursor on a keyword
- **WHEN** the cursor is on the keyword `circuit`
- **THEN** prepare rename rejects (keywords are not symbols)

#### Scenario: Cursor on whitespace
- **WHEN** the cursor is on whitespace or punctuation
- **THEN** prepare rename rejects

### Requirement: Rename updates all references in the document
The rename provider SHALL respond to `textDocument/rename` requests by returning a `WorkspaceEdit` containing text edits that replace the symbol name at its declaration and all references with the new name.

#### Scenario: Rename a circuit with multiple references
- **WHEN** the cursor is on `add` which is declared as a circuit and referenced 3 times
- **AND** the new name is `sum`
- **THEN** the workspace edit contains 4 text edits (1 declaration + 3 references) all replacing `add` with `sum`

#### Scenario: Rename a parameter used within a circuit body
- **WHEN** the cursor is on parameter `x` in `circuit foo(x: Field) : Field { return x; }`
- **AND** the new name is `value`
- **THEN** the workspace edit replaces `x` at the parameter declaration and the reference in the body

#### Scenario: Rename does not affect shadowed symbols
- **WHEN** a module-level `x` is shadowed by a parameter `x` in a circuit
- **AND** the user renames the parameter `x` to `y`
- **THEN** only the parameter declaration and references within that circuit scope are renamed, not the module-level `x`

#### Scenario: Rename a for-loop variable
- **WHEN** the cursor is on the loop variable `item` in `for item of items { ... }`
- **AND** the new name is `element`
- **THEN** the workspace edit replaces `item` at the for-statement and all references within the loop body
