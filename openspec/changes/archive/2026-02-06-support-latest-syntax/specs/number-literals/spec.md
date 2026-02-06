## ADDED Requirements

### Requirement: Lexer tokenizes hexadecimal number literals
The lexer SHALL tokenize hexadecimal number literals prefixed with `0x` or `0X` as `NumberLiteral` tokens.

#### Scenario: Lowercase hex prefix
- **WHEN** the source contains `0xff`
- **THEN** it is tokenized as a `NumberLiteral` token with value `0xff`

#### Scenario: Uppercase hex prefix
- **WHEN** the source contains `0XAB`
- **THEN** it is tokenized as a `NumberLiteral` token with value `0XAB`

#### Scenario: Mixed case hex digits
- **WHEN** the source contains `0xAbCd`
- **THEN** it is tokenized as a `NumberLiteral` token with value `0xAbCd`

### Requirement: Lexer tokenizes binary number literals
The lexer SHALL tokenize binary number literals prefixed with `0b` or `0B` as `NumberLiteral` tokens.

#### Scenario: Lowercase binary prefix
- **WHEN** the source contains `0b1010`
- **THEN** it is tokenized as a `NumberLiteral` token with value `0b1010`

#### Scenario: Uppercase binary prefix
- **WHEN** the source contains `0B1`
- **THEN** it is tokenized as a `NumberLiteral` token with value `0B1`

### Requirement: Lexer tokenizes octal number literals
The lexer SHALL tokenize octal number literals prefixed with `0o` or `0O` as `NumberLiteral` tokens.

#### Scenario: Lowercase octal prefix
- **WHEN** the source contains `0o77`
- **THEN** it is tokenized as a `NumberLiteral` token with value `0o77`

#### Scenario: Uppercase octal prefix
- **WHEN** the source contains `0O12`
- **THEN** it is tokenized as a `NumberLiteral` token with value `0O12`

### Requirement: Non-decimal literals work in all expression contexts
Hex, binary, and octal literals SHALL be valid in any expression position where a decimal `NumberLiteral` is valid (assignments, function arguments, array elements, range bounds, type arguments).

#### Scenario: Hex literal in range expression
- **WHEN** the source contains `for (const i of 0x00..0xff) { }`
- **THEN** the parser produces a `ForStatement` with an iterable `BinaryExpression` using `..` over two hex literals

#### Scenario: Octal literal as type argument
- **WHEN** the source contains `Uint<0o10>`
- **THEN** the parser produces a `ParameterizedType` with a `NumberArgument` of value `0o10`
