### Requirement: findTokenAtPosition returns token at cursor
The test suite SHALL verify that `findTokenAtPosition()` correctly identifies the token at a given line and column.

#### Scenario: Cursor on a keyword
- **WHEN** the cursor is positioned on a keyword token (e.g. `circuit`)
- **THEN** the function returns that token

#### Scenario: Cursor between tokens
- **WHEN** the cursor is at a position that falls between tokens (whitespace)
- **THEN** the function returns undefined

#### Scenario: EOF token is skipped
- **WHEN** the cursor is at the end of the file where only the EOF token exists
- **THEN** the function returns undefined (EOF tokens are skipped)

### Requirement: isPositionInRange checks boundaries correctly
The test suite SHALL verify that `isPositionInRange()` handles all boundary conditions for range checking.

#### Scenario: Position inside range
- **WHEN** line and column are strictly inside the range
- **THEN** the function returns true

#### Scenario: Position before range
- **WHEN** line is before the range start, or column is before start on the same line
- **THEN** the function returns false

#### Scenario: Position after range
- **WHEN** line is after the range end, or column is after end on the same line
- **THEN** the function returns false

#### Scenario: Position on boundary
- **WHEN** the position is exactly at the start or end of the range
- **THEN** the function returns true

### Requirement: findScopeForPosition resolves to deepest scope
The test suite SHALL verify that `findScopeForPosition()` returns the most specific scope for a given position.

#### Scenario: Cursor inside a circuit body
- **WHEN** the cursor is inside a circuit declaration
- **THEN** the function returns the circuit's child scope

#### Scenario: Cursor outside any declaration
- **WHEN** the cursor is at a position not inside any declaration
- **THEN** the function returns the file scope

### Requirement: findChildScopeForDecl finds matching child
The test suite SHALL verify that `findChildScopeForDecl()` correctly locates child scopes for declarations.

#### Scenario: Named declaration
- **WHEN** the declaration has a `name` property (e.g. circuit, struct)
- **THEN** the function returns the child scope matching that name

#### Scenario: Constructor declaration
- **WHEN** the declaration is a `ConstructorDeclaration`
- **THEN** the function returns the child scope named `<constructor>`

#### Scenario: No matching child scope
- **WHEN** no child scope matches the declaration
- **THEN** the function returns undefined
