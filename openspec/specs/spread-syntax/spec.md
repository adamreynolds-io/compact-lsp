## ADDED Requirements

### Requirement: Parser parses spread expressions in tuple/vector literals
The parser SHALL parse spread expressions (`...expr`) as elements within tuple/vector literal syntax `[a, ...b, c]`.

#### Scenario: Spread in tuple literal
- **WHEN** the source contains `[...a, ...b]`
- **THEN** the AST contains a `TupleLiteral` with two `SpreadExpression` elements

#### Scenario: Mixed spread and regular elements
- **WHEN** the source contains `[1, ...[2 as Uint<16>], 3]`
- **THEN** the AST contains a `TupleLiteral` with a literal, a spread expression, and another literal

#### Scenario: Spread with cast
- **WHEN** the source contains `[...a as Vector<5, Uint<8>>, ...default<[]>]`
- **THEN** the AST contains a `TupleLiteral` with spread expressions containing cast sub-expressions

### Requirement: Parser parses spread expressions in struct construction
The parser SHALL parse spread expressions in struct construction syntax `S { ...base, field: value }`.

#### Scenario: Struct spread with override
- **WHEN** the source contains `S { ...s1, b: true }`
- **THEN** the AST contains a `StructConstruction` with a spread source `s1` and a field override `b`

### Requirement: Parser parses spread in Bytes literals
The parser SHALL parse spread expressions within `Bytes[...]` literals.

#### Scenario: Spread in Bytes literal
- **WHEN** the source contains `Bytes[1, 2, ...var3]`
- **THEN** the AST contains a `BytesLiteral` with two literal elements and a `SpreadExpression`

### Requirement: SpreadExpression AST node
The AST SHALL include a `SpreadExpression` node type with kind `SpreadExpression` and an `argument` field containing the spread operand expression.

#### Scenario: SpreadExpression structure
- **WHEN** the parser encounters `...myArray` in a tuple context
- **THEN** it produces a `SpreadExpression` node with `argument` being an `IdentifierExpression` for `myArray`
