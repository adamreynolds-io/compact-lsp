## ADDED Requirements

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
The symbol table SHALL maintain a hierarchy of scopes matching Compact's lexical scoping rules: file → module → circuit → block.

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

### Requirement: Symbol table records identifier references
The symbol table builder SHALL record all identifier references (usages) with their position and enclosing scope, enabling resolution against declarations.

#### Scenario: Reference to a declared symbol
- **WHEN** an identifier `x` is used in an expression and `x` is declared in an enclosing scope
- **THEN** the reference is resolvable

#### Scenario: Reference to an undeclared symbol
- **WHEN** an identifier `foo` is used in an expression and `foo` is not declared in any enclosing scope
- **THEN** the reference is unresolvable
