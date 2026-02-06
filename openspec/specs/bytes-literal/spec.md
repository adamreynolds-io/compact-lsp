## ADDED Requirements

### Requirement: Parser parses Bytes literal expressions
The parser SHALL parse `Bytes[...]` literal expressions with the syntax `Bytes[elem1, elem2, ...]` where elements are expressions.

#### Scenario: Simple Bytes literal
- **WHEN** the source contains `Bytes[1, 2, 3, 4]`
- **THEN** the AST contains a `BytesLiteral` node with four literal expression elements

#### Scenario: Bytes literal with hex elements
- **WHEN** the source contains `Bytes[0x01, 2, 0b11, 0o4]`
- **THEN** the AST contains a `BytesLiteral` node with elements using different number bases

#### Scenario: Empty Bytes literal
- **WHEN** the source contains `Bytes[]`
- **THEN** the AST contains a `BytesLiteral` node with an empty elements list

#### Scenario: Bytes literal with spread
- **WHEN** the source contains `Bytes[1, 2, ...rest]`
- **THEN** the AST contains a `BytesLiteral` node with two literal elements and a `SpreadExpression`

### Requirement: Bytes literal disambiguation from index expression
The parser SHALL distinguish `Bytes[...]` literal syntax from an index expression on an identifier named `Bytes`.

#### Scenario: Bytes followed by bracket is a literal, not index
- **WHEN** the source contains `const a = Bytes[1, 2, 3];`
- **THEN** the parser produces a `BytesLiteral` node, NOT an `IndexExpression` on identifier `Bytes`

### Requirement: BytesLiteral AST node
The AST SHALL include a `BytesLiteral` node type with kind `BytesLiteral` and an `elements` field containing an array of expressions (including possible `SpreadExpression` nodes).

#### Scenario: BytesLiteral node structure
- **WHEN** the parser encounters `Bytes[0xff]`
- **THEN** it produces a `BytesLiteral` node with one `LiteralExpression` element in the `elements` array
