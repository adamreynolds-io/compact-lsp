## MODIFIED Requirements

### Requirement: Lexer tokenizes Compact source
The lexer SHALL tokenize Compact source text into a stream of tokens, each with a kind, text value, and source position (line, column, offset).

#### Scenario: Keywords
- **WHEN** the source contains `circuit`, `ledger`, `witness`, `struct`, `enum`, `module`, `export`, `pure`, `sealed`, `const`, `constructor`, `contract`, `pragma`, `import`, `include`, `return`, `if`, `else`, `for`, `of`, `assert`, `as`, `type`, `new`
- **THEN** each is tokenized as its respective keyword token kind

#### Scenario: Identifiers
- **WHEN** the source contains `myCircuit`, `_x`, `foo123`
- **THEN** each is tokenized as an `Identifier` token (not matching any keyword)

#### Scenario: Identifiers include contextual keywords
- **WHEN** the source contains `from`, `prefix` as identifiers outside of import context
- **THEN** each is tokenized as an `Identifier` token (they are contextual, not reserved keywords)

#### Scenario: Built-in type names
- **WHEN** the source contains `Field`, `Boolean`, `Uint`, `Bytes`, `Vector`, `Opaque`, `Void`
- **THEN** each is tokenized as a `TypeKeyword` token

#### Scenario: Numeric literals
- **WHEN** the source contains `42`, `0`, `1000`
- **THEN** each is tokenized as a `NumberLiteral` token

#### Scenario: Hexadecimal numeric literals
- **WHEN** the source contains `0xff`, `0XAB`
- **THEN** each is tokenized as a `NumberLiteral` token preserving the original text

#### Scenario: Binary numeric literals
- **WHEN** the source contains `0b1010`, `0B1`
- **THEN** each is tokenized as a `NumberLiteral` token preserving the original text

#### Scenario: Octal numeric literals
- **WHEN** the source contains `0o77`, `0O12`
- **THEN** each is tokenized as a `NumberLiteral` token preserving the original text

#### Scenario: String literals
- **WHEN** the source contains `"hello"` or `'hello'`
- **THEN** each is tokenized as a `StringLiteral` token

#### Scenario: Boolean literals
- **WHEN** the source contains `true` or `false`
- **THEN** each is tokenized as a `BooleanLiteral` token

#### Scenario: Punctuation and operators
- **WHEN** the source contains `{`, `}`, `(`, `)`, `[`, `]`, `<`, `>`, `:`, `;`, `,`, `.`, `=`, `+`, `-`, `*`, `!`, `?`, `=>`, `..`, `...`, `==`, `!=`, `<=`, `>=`, `&&`, `||`, `+=`, `-=`, `#`
- **THEN** each is tokenized as its respective punctuation/operator token kind

#### Scenario: Comments are skipped
- **WHEN** the source contains `// this is a comment`
- **THEN** the comment is consumed but not emitted as a token (or emitted as a trivia token)

#### Scenario: Whitespace is skipped
- **WHEN** the source contains spaces, tabs, or newlines between tokens
- **THEN** whitespace is consumed but not emitted as a token

#### Scenario: Position tracking
- **WHEN** any token is produced
- **THEN** it includes the start line, start column, and byte offset in the source text

### Requirement: Parser produces AST for top-level declarations
The parser SHALL parse top-level Compact declarations into an AST with typed nodes, preserving source positions on each node.

#### Scenario: Circuit definition
- **WHEN** the source contains `circuit add(x: Field, y: Field) : Field { ... }`
- **THEN** the AST contains a `CircuitDefinition` node with name `add`, parameters, return type, and modifiers

#### Scenario: Circuit with modifiers
- **WHEN** the source contains `export pure circuit divide(a: Field, b: Field) : Field { ... }`
- **THEN** the AST contains a `CircuitDefinition` node with `export: true` and `pure: true`

#### Scenario: External circuit declaration
- **WHEN** the source contains `circuit multiply(a: Field, b: Field) : Field;`
- **THEN** the AST contains an `ExternalCircuit` node with name, parameters, and return type (no body)

#### Scenario: Ledger declaration
- **WHEN** the source contains `export sealed ledger myLedger : Field;`
- **THEN** the AST contains a `LedgerDeclaration` node with name, type, `export: true`, `sealed: true`

#### Scenario: Witness declaration
- **WHEN** the source contains `witness myWitness(x: Field) : Field;`
- **THEN** the AST contains a `WitnessDeclaration` node with name, parameters, and return type

#### Scenario: Struct definition
- **WHEN** the source contains `struct Point { x: Field; y: Field; }`
- **THEN** the AST contains a `StructDefinition` node with name and fields list

#### Scenario: Enum definition
- **WHEN** the source contains `enum Color { red, green, blue }`
- **THEN** the AST contains an `EnumDefinition` node with name and variants list

#### Scenario: Module definition
- **WHEN** the source contains `module Foo { circuit bar() : Field { ... } }`
- **THEN** the AST contains a `ModuleDefinition` node with name and nested declarations

#### Scenario: Constructor
- **WHEN** the source contains `constructor(x: Field) { ... }`
- **THEN** the AST contains a `Constructor` node with parameters

#### Scenario: Const declaration at top level
- **WHEN** the source contains `const x: Field = 42;`
- **THEN** the AST contains a `ConstDeclaration` node with name and annotated type

#### Scenario: External contract
- **WHEN** the source contains `contract MyContract { circuit foo(x: Field) : Field; }`
- **THEN** the AST contains a `ContractDeclaration` node with name and circuit signatures

#### Scenario: Pragma
- **WHEN** the source contains `pragma language_version 0.14.0;`
- **THEN** the AST contains a `Pragma` node

#### Scenario: Import declaration
- **WHEN** the source contains `import myModule;`
- **THEN** the AST contains an `ImportDeclaration` node with the module name

#### Scenario: Include declaration
- **WHEN** the source contains `include "standard_library.compact";`
- **THEN** the AST contains an `IncludeDeclaration` node with the file path

#### Scenario: New type declaration
- **WHEN** the source contains `new type MyBool = Boolean;`
- **THEN** the AST contains a `NewTypeDeclaration` node with name and type expression

#### Scenario: Export list
- **WHEN** the source contains `export { foo, bar };`
- **THEN** the AST contains an `ExportList` node with names `foo` and `bar`

### Requirement: Parser parses type annotations
The parser SHALL parse type annotations appearing in declarations (parameter types, return types, field types, ledger types).

#### Scenario: Simple type reference
- **WHEN** a type annotation is `Field`
- **THEN** it is parsed as a type reference to `Field`

#### Scenario: Parameterized built-in type
- **WHEN** a type annotation is `Uint<32>` or `Vector<10, Field>`
- **THEN** it is parsed as a parameterized type with the size/type arguments

#### Scenario: User-defined generic type
- **WHEN** a type annotation is `MyType<Field>`
- **THEN** it is parsed as a type reference with generic arguments

#### Scenario: Tuple type
- **WHEN** a type annotation is `[Field, Boolean]`
- **THEN** it is parsed as a tuple type with element types

#### Scenario: Range type argument
- **WHEN** a type annotation is `Uint<0..4294967295>`
- **THEN** it is parsed as a parameterized type with a range expression as the type argument

### Requirement: Parser parses circuit and constructor bodies
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

### Requirement: Parser parses multiple const bindings
The parser SHALL parse multiple const bindings in a single statement separated by commas: `const a = 1, b = 2;`.

#### Scenario: Two const bindings
- **WHEN** a circuit body contains `const a: Field = 1, b: Field = 2;`
- **THEN** the AST contains two `ConstStatement` nodes (or a single node with multiple bindings), each with name, type, and initializer

#### Scenario: Multiple bindings with mixed types
- **WHEN** a circuit body contains `const a: Boolean = true, b: Field = 1, c = [1, 2];`
- **THEN** each binding is parsed with its own type annotation and initializer

### Requirement: Parser parses assert with message
The parser SHALL parse `assert(condition, "message");` with an optional second string argument.

#### Scenario: Assert with message string
- **WHEN** a circuit body contains `assert(x == 0, "x must be zero");`
- **THEN** the AST contains an `AssertStatement` with condition `x == 0` and message `"x must be zero"`

#### Scenario: Assert without message still works
- **WHEN** a circuit body contains `assert(x == 0);`
- **THEN** the AST contains an `AssertStatement` with condition only (unchanged behavior)

### Requirement: Parser parses struct field shorthand
The parser SHALL parse struct construction with field shorthand where `S { x, y }` is equivalent to `S { x: x, y: y }`.

#### Scenario: Shorthand field
- **WHEN** the source contains `Point { x, y }`
- **THEN** the AST contains a `StructConstruction` with fields where name and value reference the same identifier

#### Scenario: Mixed shorthand and explicit fields
- **WHEN** the source contains `Point { x, y: someExpr }`
- **THEN** the AST contains a `StructConstruction` with `x` as shorthand and `y` with explicit value

### Requirement: Parser recovers from errors at declaration and statement boundaries
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

### Requirement: Parser records syntax errors with positions
The parser SHALL record all syntax errors encountered during parsing, each with a message and source position range.

#### Scenario: Missing semicolon
- **WHEN** the source contains `ledger x : Field` (missing semicolon)
- **THEN** a syntax error is recorded with a message like "Expected ';'" and the position where the semicolon was expected

#### Scenario: Missing type annotation
- **WHEN** the source contains `circuit foo(x) : Field { }` (parameter missing type)
- **THEN** a syntax error is recorded indicating the missing type annotation
