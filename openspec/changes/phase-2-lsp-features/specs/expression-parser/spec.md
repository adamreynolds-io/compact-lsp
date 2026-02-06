## ADDED Requirements

### Requirement: Parser produces AST for statements inside bodies
The parser SHALL parse statements inside circuit and constructor bodies into typed AST nodes with source positions.

#### Scenario: Const binding
- **WHEN** a circuit body contains `const x: Field = 42;`
- **THEN** the AST contains a `ConstStatement` node with name `x`, type annotation `Field`, and an initializer expression

#### Scenario: Const binding without type annotation
- **WHEN** a circuit body contains `const x = someExpr;`
- **THEN** the AST contains a `ConstStatement` node with name `x`, no type annotation, and an initializer expression

#### Scenario: Return statement with value
- **WHEN** a circuit body contains `return x + y;`
- **THEN** the AST contains a `ReturnStatement` node with a binary expression as its value

#### Scenario: Return statement without value
- **WHEN** a circuit body contains `return;`
- **THEN** the AST contains a `ReturnStatement` node with no value

#### Scenario: If statement
- **WHEN** a circuit body contains `if (cond) { doSomething; }`
- **THEN** the AST contains an `IfStatement` node with a condition expression and a consequent block

#### Scenario: If-else statement
- **WHEN** a circuit body contains `if (cond) { a; } else { b; }`
- **THEN** the AST contains an `IfStatement` node with a condition, consequent block, and alternate block

#### Scenario: For-of loop
- **WHEN** a circuit body contains `for (const i of items) { doSomething; }`
- **THEN** the AST contains a `ForStatement` node with variable name `i`, iterable expression, and body

#### Scenario: Assert statement
- **WHEN** a circuit body contains `assert(condition);`
- **THEN** the AST contains an `AssertStatement` node with a condition expression

#### Scenario: Expression statement
- **WHEN** a circuit body contains `counter += amount;`
- **THEN** the AST contains an `ExpressionStatement` node wrapping an assignment expression

#### Scenario: Block statement
- **WHEN** a circuit body contains `{ const y = 1; }`
- **THEN** the AST contains a `BlockStatement` node with nested statements

### Requirement: Parser produces AST for expressions
The parser SHALL parse expressions using Pratt parsing (top-down operator precedence) into typed AST nodes with source positions.

#### Scenario: Binary arithmetic
- **WHEN** the source contains `x + y * z`
- **THEN** the AST contains a `BinaryExpression` with `+` at the top, and a `BinaryExpression` with `*` as the right operand (respecting precedence)

#### Scenario: Comparison operators
- **WHEN** the source contains `a == b` or `a != b` or `a < b` or `a >= b`
- **THEN** the AST contains a `BinaryExpression` node with the correct operator

#### Scenario: Logical operators
- **WHEN** the source contains `a && b || c`
- **THEN** the AST contains `||` at the top (lower precedence) with `&&` as the left operand

#### Scenario: Unary negation
- **WHEN** the source contains `!flag`
- **THEN** the AST contains a `UnaryExpression` node with operator `!` and operand `flag`

#### Scenario: Conditional (ternary) expression
- **WHEN** the source contains `cond ? a : b`
- **THEN** the AST contains a `ConditionalExpression` node with condition, consequent, and alternate

#### Scenario: Function call
- **WHEN** the source contains `add(x, y)`
- **THEN** the AST contains a `CallExpression` node with callee `add` and two arguments

#### Scenario: Member access
- **WHEN** the source contains `point.x`
- **THEN** the AST contains a `MemberExpression` node with object `point` and property `x`

#### Scenario: Index access
- **WHEN** the source contains `tuple[0]`
- **THEN** the AST contains an `IndexExpression` node with object `tuple` and index `0`

#### Scenario: Identifier expression
- **WHEN** the source contains an identifier `x` in expression position
- **THEN** the AST contains an `IdentifierExpression` node with name `x` and source range

#### Scenario: Numeric literal expression
- **WHEN** the source contains `42` in expression position
- **THEN** the AST contains a `LiteralExpression` node with value `42`

#### Scenario: Boolean literal expression
- **WHEN** the source contains `true` in expression position
- **THEN** the AST contains a `LiteralExpression` node with value `true`

#### Scenario: String literal expression
- **WHEN** the source contains `"hello"` in expression position
- **THEN** the AST contains a `LiteralExpression` node with value `"hello"`

#### Scenario: Tuple literal
- **WHEN** the source contains `[a, b, c]` in expression position
- **THEN** the AST contains a `TupleLiteral` node with three element expressions

#### Scenario: Struct construction
- **WHEN** the source contains `Point { x: 1, y: 2 }` in expression position
- **THEN** the AST contains a `StructConstruction` node with struct name `Point` and named field initializers

#### Scenario: Cast expression
- **WHEN** the source contains `x as Uint<32>`
- **THEN** the AST contains a `CastExpression` node with operand `x` and target type `Uint<32>`

#### Scenario: Range expression
- **WHEN** the source contains `0..10`
- **THEN** the AST contains a `BinaryExpression` node with operator `..`

#### Scenario: Arrow function
- **WHEN** the source contains `(x: Field) => x + 1`
- **THEN** the AST contains an `ArrowFunction` node with parameters, and a body expression

#### Scenario: Assignment operators
- **WHEN** the source contains `counter += amount` or `counter -= amount`
- **THEN** the AST contains an `AssignmentExpression` node with the compound operator

#### Scenario: Parenthesized expression
- **WHEN** the source contains `(a + b) * c`
- **THEN** the AST respects parentheses, with `+` nested inside `*`

### Requirement: Parser recovers from errors at statement boundaries
The parser SHALL recover from syntax errors inside bodies by synchronizing at the next `;` or `}` boundary.

#### Scenario: Malformed statement followed by valid one
- **WHEN** a circuit body contains `@@@ invalid; return 42;`
- **THEN** the parser produces an error node for the malformed statement and a valid `ReturnStatement` for the second

#### Scenario: Missing semicolon in body
- **WHEN** a circuit body contains `const x = 1 const y = 2;`
- **THEN** the parser records an error for the missing semicolon and recovers to parse `const y = 2;`

#### Scenario: Fallback to brace matching on unrecoverable error
- **WHEN** the statement parser encounters deeply broken syntax inside a body
- **THEN** it falls back to brace matching to consume the rest of the body, preserving the ability to parse subsequent declarations
