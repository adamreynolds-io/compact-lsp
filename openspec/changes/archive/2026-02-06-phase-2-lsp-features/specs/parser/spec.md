## MODIFIED Requirements

### Requirement: Parser skips circuit/constructor bodies in Phase 1
The parser SHALL parse circuit and constructor bodies (delimited by `{ }`) into full statement and expression AST nodes. On unrecoverable errors inside a body, the parser SHALL fall back to brace matching to consume the remaining body content.

#### Scenario: Circuit body parsed into statements
- **WHEN** the source contains `circuit add(x: Field, y: Field) : Field { return x + y; }`
- **THEN** the parser produces a `CircuitDefinition` node whose body contains a `ReturnStatement` with a `BinaryExpression`

#### Scenario: Constructor body parsed into statements
- **WHEN** the source contains `constructor(x: Field) { const y = x; }`
- **THEN** the parser produces a `ConstructorDeclaration` node whose body contains a `ConstStatement`

#### Scenario: Nested braces in body produce block statements
- **WHEN** a circuit body contains `{ if (cond) { return x; } }`
- **THEN** the parser produces an `IfStatement` with a nested block containing a `ReturnStatement`

#### Scenario: Fallback to brace matching on deep error
- **WHEN** the parser encounters unrecoverable syntax errors inside a body
- **THEN** it falls back to brace matching, records an error, and continues parsing the next declaration

## MODIFIED Requirements

### Requirement: Parser recovers from errors at declaration boundaries
The parser SHALL attempt to recover from syntax errors at both declaration boundaries (top-level) and statement boundaries (inside bodies, synchronizing at `;` or `}`).

#### Scenario: Malformed declaration followed by valid one
- **WHEN** the source contains a malformed circuit followed by a valid struct definition
- **THEN** the parser produces an error node for the malformed circuit and a valid `StructDefinition` node for the struct

#### Scenario: Unexpected token at top level
- **WHEN** the parser encounters an unexpected token at the top level
- **THEN** it records an error diagnostic, skips tokens until a known declaration keyword, and continues parsing

#### Scenario: Malformed statement followed by valid statement in body
- **WHEN** a circuit body contains `@@@ invalid; return 42;`
- **THEN** the parser records an error, synchronizes at `;`, and continues to parse `return 42;`

#### Scenario: Missing semicolon recovery in body
- **WHEN** a circuit body contains `const x = 1 return y;`
- **THEN** the parser records an error for the missing semicolon and recovers to parse `return y;`
