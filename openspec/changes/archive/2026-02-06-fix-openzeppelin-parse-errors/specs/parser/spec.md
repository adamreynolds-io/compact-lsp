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

#### Scenario: Line comments are skipped
- **WHEN** the source contains `// this is a comment`
- **THEN** the comment is consumed but not emitted as a token

#### Scenario: Block comments are skipped
- **WHEN** the source contains `/* this is a comment */` or `/** JSDoc comment */`
- **THEN** the block comment is consumed but not emitted as a token

#### Scenario: Multi-line block comments are skipped
- **WHEN** the source contains a block comment spanning multiple lines
- **THEN** the entire comment is consumed, line/column tracking advances correctly, and no tokens are emitted for the comment

#### Scenario: Unterminated block comment
- **WHEN** the source contains `/* unterminated` with no closing `*/`
- **THEN** the lexer consumes to EOF without crashing and produces only an EOF token

#### Scenario: Whitespace is skipped
- **WHEN** the source contains spaces, tabs, or newlines between tokens
- **THEN** whitespace is consumed but not emitted as a token

#### Scenario: Position tracking
- **WHEN** any token is produced
- **THEN** it includes the start line, start column, and byte offset in the source text

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

#### Scenario: String literal type argument
- **WHEN** a type annotation is `Opaque<"CoinInfo">`
- **THEN** it is parsed as a `ParameterizedType` with a `StringArgument` node containing the string value

#### Scenario: Nested string literal type argument
- **WHEN** a type annotation is `Map<Uint<128>, Opaque<"string">>`
- **THEN** the inner `Opaque<"string">` is parsed as a `ParameterizedType` with a `StringArgument`

#### Scenario: Safety guard prevents infinite loop on unhandled tokens
- **WHEN** `parseParameterizedType()` encounters a token it doesn't handle inside `<...>`
- **THEN** the parser force-advances past the token to prevent infinite loops

## ADDED Requirements

### Requirement: StringArgument AST node
The AST SHALL include a `StringArgument` node type for string literals used as type arguments. The `TypeArgument` union SHALL include `StringArgument` alongside `TypeNode`, `NumberArgument`, and `RangeArgument`.

#### Scenario: StringArgument structure
- **WHEN** the parser encounters a `StringLiteral` token inside type argument angle brackets
- **THEN** it produces a `StringArgument` node with `kind: 'StringArgument'`, `value` (the string token text including quotes), and `range`

### Requirement: StringArgument formatting in type display
The `formatTypeNode()` function SHALL format `StringArgument` nodes by returning the string value (including quotes).

#### Scenario: Formatting Opaque with string argument
- **WHEN** `formatTypeNode()` is called on a `ParameterizedType` with a `StringArgument`
- **THEN** it returns the formatted string like `Opaque<"CoinInfo">`
