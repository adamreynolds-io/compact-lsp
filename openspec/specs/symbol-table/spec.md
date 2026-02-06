## Requirements

### Requirement: Symbol table collects declarations from AST
The symbol table builder SHALL walk the tree-sitter AST and collect all top-level and nested declarations, recording their name, kind, type signature (as written), position, and enclosing scope.

#### Scenario: Circuit declaration
- **WHEN** the AST contains a circuit definition `circuit add(x: Field, y: Field) : Field { ... }`
- **THEN** the symbol table records a declaration with name `add`, kind `circuit`, parameters `[(x, Field), (y, Field)]`, return type `Field`, and any modifiers (`export`, `pure`)

#### Scenario: Ledger declaration
- **WHEN** the AST contains `ledger myLedger : Field;`
- **THEN** the symbol table records a declaration with name `myLedger`, kind `ledger`, type `Field`, and any modifiers (`export`, `sealed`)

#### Scenario: Witness declaration
- **WHEN** the AST contains `witness myWitness(x: Field) : Field;`
- **THEN** the symbol table records a declaration with name `myWitness`, kind `witness`, parameters `[(x, Field)]`, and return type `Field`

#### Scenario: Struct declaration
- **WHEN** the AST contains `struct Point { x: Field; y: Field; }`
- **THEN** the symbol table records a declaration with name `Point`, kind `struct`, and fields `[(x, Field), (y, Field)]`

#### Scenario: Enum declaration
- **WHEN** the AST contains `enum Color { red, green, blue }`
- **THEN** the symbol table records a declaration with name `Color`, kind `enum`, and variants `[red, green, blue]`

#### Scenario: Const declaration
- **WHEN** the AST contains `const x: Field = 42;`
- **THEN** the symbol table records a declaration with name `x`, kind `const`, and annotated type `Field`

#### Scenario: Const without type annotation
- **WHEN** the AST contains `const x = 42;`
- **THEN** the symbol table records a declaration with name `x`, kind `const`, and no type (type is unknown)

### Requirement: Symbol table tracks lexical scopes
The symbol table SHALL maintain a hierarchy of scopes matching Compact's lexical scoping rules: file → module → circuit → block → for-loop.

#### Scenario: Module creates a scope
- **WHEN** a module definition `module Foo { ... }` is encountered
- **THEN** declarations inside the module are scoped to `Foo` and not visible outside it (unless exported)

#### Scenario: Circuit creates a scope
- **WHEN** a circuit definition `circuit bar(x: Field) : Field { ... }` is encountered
- **THEN** the parameter `x` is scoped to the circuit body and not visible outside it

#### Scenario: Block creates a scope
- **WHEN** a block `{ const y: Field = 1; ... }` is encountered inside a circuit
- **THEN** `y` is scoped to the block and not visible outside it

#### Scenario: Nested scope resolution
- **WHEN** an identifier is referenced inside a nested scope
- **THEN** the symbol table resolves it by searching the current scope first, then parent scopes outward to the file scope

#### Scenario: For-loop creates a scope
- **WHEN** a for-loop `for (const i of items) { ... }` is encountered
- **THEN** the iteration variable `i` is scoped to the for-loop body and not visible outside

### Requirement: Symbol table records identifier references
The symbol table builder SHALL record all identifier references (usages) with their position and enclosing scope, enabling resolution against declarations.

#### Scenario: Reference to a declared symbol
- **WHEN** an identifier `x` is used in an expression and `x` is declared in an enclosing scope
- **THEN** the reference is resolvable

#### Scenario: Reference to an undeclared symbol
- **WHEN** an identifier `foo` is used in an expression and `foo` is not declared in any enclosing scope
- **THEN** the reference is unresolvable

### Requirement: Symbol table tracks identifier references
The symbol table builder SHALL record all identifier references (usages) found in expression AST nodes, storing each with its name, source range, and enclosing scope.

#### Scenario: Reference in function call
- **WHEN** a circuit body contains `add(x, y)` and `add`, `x`, `y` are identifiers
- **THEN** the symbol table records references for `add`, `x`, and `y` with their positions and enclosing scope

#### Scenario: Reference in binary expression
- **WHEN** a circuit body contains `x + y`
- **THEN** the symbol table records references for `x` and `y`

#### Scenario: Reference in return statement
- **WHEN** a circuit body contains `return counter;`
- **THEN** the symbol table records a reference for `counter`

#### Scenario: Reference in condition
- **WHEN** a circuit body contains `if (flag) { ... }`
- **THEN** the symbol table records a reference for `flag`

#### Scenario: References stored in flat list on file scope
- **WHEN** the symbol table builder finishes walking a file
- **THEN** all references are stored in a flat list accessible from the file scope

### Requirement: Symbol table registers local variables from body statements
The symbol table builder SHALL register `const` bindings found inside circuit and constructor bodies as symbols in the appropriate scope.

#### Scenario: Const binding in circuit body
- **WHEN** a circuit body contains `const x: Field = 42;`
- **THEN** the symbol table registers `x` with kind `const` in the circuit's body scope

#### Scenario: For-loop variable scoped to loop body
- **WHEN** a circuit body contains `for (const i of items) { ... }`
- **THEN** the symbol table registers `i` in a scope local to the for-loop body, not visible outside the loop

#### Scenario: Block scope for nested blocks
- **WHEN** a circuit body contains `{ const y = 1; } const z = y;`
- **THEN** `y` is scoped to the inner block and `z` cannot resolve `y`
