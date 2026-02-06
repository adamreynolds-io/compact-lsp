## ADDED Requirements

### Requirement: Parser parses tuple destructuring in const statements
The parser SHALL parse tuple destructuring patterns in const bindings with the syntax `const [a, b, c] = expr;`.

#### Scenario: Simple tuple destructuring
- **WHEN** a circuit body contains `const [x, y] = someExpr;`
- **THEN** the AST contains a `ConstStatement` with a `TuplePattern` having elements `x` and `y`

#### Scenario: Tuple destructuring with type annotation
- **WHEN** a circuit body contains `const [x, y] : [Field, Field] = someExpr;`
- **THEN** the AST contains a `ConstStatement` with a `TuplePattern`, type annotation as `TupleType`, and an initializer

#### Scenario: Tuple destructuring with skipped elements
- **WHEN** a circuit body contains `const [x, , , y] = someExpr;`
- **THEN** the AST contains a `ConstStatement` with a `TuplePattern` having elements `x`, `null`, `null`, `y`

#### Scenario: Tuple destructuring with underscore placeholder
- **WHEN** a circuit body contains `const [h, _] = someExpr;`
- **THEN** the AST contains a `ConstStatement` with a `TuplePattern` having elements `h` and `_`

### Requirement: Parser parses struct destructuring in const statements
The parser SHALL parse struct destructuring patterns in const bindings with the syntax `const {a, b: alias} = expr;`.

#### Scenario: Simple struct destructuring
- **WHEN** a circuit body contains `const {a, b} = myStruct;`
- **THEN** the AST contains a `ConstStatement` with a `StructPattern` having fields `a` and `b`

#### Scenario: Struct destructuring with alias
- **WHEN** a circuit body contains `const {a: x, b} = myStruct;`
- **THEN** the AST contains a `ConstStatement` with a `StructPattern` having field `a` aliased to `x` and field `b`

### Requirement: Parser parses destructuring in parameter positions
The parser SHALL parse destructuring patterns in circuit and constructor parameter positions.

#### Scenario: Tuple destructuring in circuit parameter
- **WHEN** the source contains `circuit f([x, y]: [Field, Field]) : Field { return x + y; }`
- **THEN** the AST contains a `CircuitDefinition` with a parameter having a `TuplePattern` and type annotation

### Requirement: Symbol table registers destructured bindings
The symbol table SHALL register each named binding from a destructuring pattern as a symbol in the enclosing scope.

#### Scenario: Destructured names available for references
- **WHEN** a circuit body contains `const [a, b] = pair;` followed by `return a + b;`
- **THEN** `a` and `b` resolve as defined symbols and do not produce undefined reference warnings

#### Scenario: Destructured struct alias used in references
- **WHEN** a circuit body contains `const {a: x} = s;` followed by `return x;`
- **THEN** `x` resolves as a defined symbol (the alias, not the field name `a`)
