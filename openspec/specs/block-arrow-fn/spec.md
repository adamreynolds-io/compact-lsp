## ADDED Requirements

### Requirement: Parser parses arrow functions with block bodies
The parser SHALL parse arrow functions whose body is a block statement (`{ ... }`) in addition to the existing single-expression body form.

#### Scenario: Arrow function with block body
- **WHEN** the source contains `(x: Field) => { return x + 1; }`
- **THEN** the AST contains an `ArrowFunction` node whose body is a `Statement[]` containing a `ReturnStatement`

#### Scenario: Arrow function with multi-statement block body
- **WHEN** the source contains `(x, y) => { const z = x + y; return z; }`
- **THEN** the AST contains an `ArrowFunction` node whose body is a `Statement[]` containing a `ConstStatement` followed by a `ReturnStatement`

#### Scenario: Arrow function with block body containing for loop
- **WHEN** the source contains `(a, b) => { for (const i of 0..9) { assert(a[i] == b[i]); } }`
- **THEN** the AST contains an `ArrowFunction` with a block body containing a `ForStatement`

#### Scenario: Existing single-expression arrow functions still work
- **WHEN** the source contains `(x: Field) => x + 1`
- **THEN** the AST contains an `ArrowFunction` node whose body is a `BinaryExpression` (unchanged behavior)

### Requirement: ArrowFunction body type is a union
The `ArrowFunction` AST node's `body` field SHALL accept either `Expression` (single-expression form) or `Statement[]` (block body form).

#### Scenario: Body type discrimination
- **WHEN** a provider inspects an `ArrowFunction` node
- **THEN** it can determine the body form by checking if `body` is an array (block) or an expression object

### Requirement: Symbol table creates scope for block arrow function bodies
The symbol table SHALL create a new scope for arrow functions with block bodies, registering parameters and body-local bindings.

#### Scenario: Block arrow function scope
- **WHEN** the source contains `map(items, (x: Field) => { const y = x + 1; return y; })`
- **THEN** `x` and `y` are registered as symbols within the arrow function scope
