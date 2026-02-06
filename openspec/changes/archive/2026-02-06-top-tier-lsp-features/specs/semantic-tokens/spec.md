## ADDED Requirements

### Requirement: Semantic tokens classifies all tokens in the document
The semantic tokens provider SHALL respond to `textDocument/semanticTokens/full` requests by returning token classifications for the entire document.

#### Scenario: Keyword tokens
- **WHEN** the document contains keywords like `circuit`, `ledger`, `struct`, `enum`, `module`, `const`, `return`, `if`, `for`, `assert`, `export`, `pure`, `sealed`, `contract`, `witness`
- **THEN** each keyword token is classified as semantic type `keyword`

#### Scenario: Type keyword tokens
- **WHEN** the document contains built-in type keywords like `Field`, `Boolean`, `Uint`, `Bytes`, `Vector`
- **THEN** each type keyword token is classified as semantic type `type`

#### Scenario: Number literal tokens
- **WHEN** the document contains number literals like `42`, `0xFF`
- **THEN** each is classified as semantic type `number`

#### Scenario: String literal tokens
- **WHEN** the document contains string literals like `"hello"`
- **THEN** each is classified as semantic type `string`

#### Scenario: Identifier resolving to a circuit or witness
- **WHEN** the document contains an identifier that resolves to a circuit or witness declaration
- **THEN** the identifier is classified as semantic type `function`

#### Scenario: Identifier resolving to a struct
- **WHEN** the document contains an identifier that resolves to a struct declaration
- **THEN** the identifier is classified as semantic type `struct`

#### Scenario: Identifier resolving to an enum
- **WHEN** the document contains an identifier that resolves to an enum declaration
- **THEN** the identifier is classified as semantic type `enum`

#### Scenario: Identifier resolving to a module or contract
- **WHEN** the document contains an identifier that resolves to a module or contract
- **THEN** the identifier is classified as semantic type `namespace`

#### Scenario: Identifier resolving to a parameter
- **WHEN** the document contains an identifier that resolves to a parameter
- **THEN** the identifier is classified as semantic type `parameter`

#### Scenario: Identifier resolving to a const or ledger
- **WHEN** the document contains an identifier that resolves to a const or ledger declaration
- **THEN** the identifier is classified as semantic type `variable`

#### Scenario: Identifier resolving to a built-in function
- **WHEN** the document contains an identifier like `map` or `fold` that resolves to a built-in function
- **THEN** the identifier is classified as semantic type `function`

#### Scenario: Unresolved identifier
- **WHEN** the document contains an identifier that does not resolve to any symbol
- **THEN** the identifier is not assigned a semantic token type (left to TextMate grammar)

#### Scenario: Boolean literal tokens
- **WHEN** the document contains `true` or `false`
- **THEN** each is classified as semantic type `keyword`

### Requirement: Semantic tokens includes declaration modifier
The semantic tokens provider SHALL apply the `declaration` modifier to tokens that appear at a symbol's definition site.

#### Scenario: Circuit name at definition
- **WHEN** the token is the name `add` in `circuit add(x: Field) : Field { ... }`
- **THEN** the token is classified as `function` with modifier `declaration`

#### Scenario: Parameter at definition
- **WHEN** the token is the parameter name `x` in `circuit foo(x: Field)`
- **THEN** the token is classified as `parameter` with modifier `declaration`

#### Scenario: Reference to a circuit
- **WHEN** the token is a call to `add` in the body of another circuit
- **THEN** the token is classified as `function` WITHOUT the `declaration` modifier

### Requirement: Semantic tokens includes readonly modifier
The semantic tokens provider SHALL apply the `readonly` modifier to tokens that refer to const or ledger declarations.

#### Scenario: Const variable
- **WHEN** the token refers to a symbol declared with `const`
- **THEN** the token includes the `readonly` modifier

#### Scenario: Ledger variable
- **WHEN** the token refers to a symbol declared as a `ledger`
- **THEN** the token includes the `readonly` modifier

### Requirement: Semantic token legend is registered
The server SHALL register a `SemanticTokensLegend` with the supported token types and modifiers.

#### Scenario: Token types include standard LSP types
- **WHEN** the server initializes
- **THEN** the semantic tokens legend includes at minimum: `keyword`, `type`, `function`, `variable`, `parameter`, `struct`, `enum`, `namespace`, `number`, `string`

#### Scenario: Token modifiers include declaration and readonly
- **WHEN** the server initializes
- **THEN** the semantic tokens legend includes modifiers: `declaration`, `readonly`

### Requirement: Semantic tokens uses delta encoding
The server SHALL encode semantic tokens using the LSP delta encoding format (line delta, start delta, length, token type index, modifier bitmask).

#### Scenario: Tokens are sorted by position
- **WHEN** the document contains multiple tokens
- **THEN** the encoded data represents tokens in document order, each encoded as a 5-tuple relative to the previous token

#### Scenario: Multi-line document
- **WHEN** tokens span multiple lines
- **THEN** line deltas are computed correctly, and start deltas reset to absolute column on new lines
