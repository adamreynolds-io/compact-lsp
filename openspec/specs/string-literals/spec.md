## ADDED Requirements

### Requirement: Lexer tokenizes single-quoted string literals
The lexer SHALL tokenize single-quoted string literals (`'hello'`) as `StringLiteral` tokens, using the same token kind as double-quoted strings.

#### Scenario: Simple single-quoted string
- **WHEN** the source contains `'abcdefgh'`
- **THEN** it is tokenized as a `StringLiteral` token with value `abcdefgh`

#### Scenario: Single-quoted string with escape sequences
- **WHEN** the source contains `'it\'s here'`
- **THEN** it is tokenized as a `StringLiteral` token preserving the escape

#### Scenario: Single-quoted string in type argument
- **WHEN** the source contains `Opaque<'string'>`
- **THEN** the type parser produces a `ParameterizedType` with a string type argument

### Requirement: Single-quoted strings work in all expression contexts
Single-quoted string literals SHALL be usable anywhere double-quoted strings are valid.

#### Scenario: Single-quoted string as function argument
- **WHEN** the source contains `pad(50, 'a')`
- **THEN** the parser produces a `CallExpression` with a `LiteralExpression` of type `string`

#### Scenario: Single-quoted string in const declaration
- **WHEN** the source contains `const name = 'hello';`
- **THEN** the parser produces a `ConstStatement` with a `LiteralExpression` string initializer
