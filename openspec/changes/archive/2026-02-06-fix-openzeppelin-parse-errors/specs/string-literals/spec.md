## ADDED Requirements

### Requirement: String literals as type arguments
String literals SHALL be valid type arguments inside angle brackets for parameterized types. This supports syntax like `Opaque<"CoinInfo">` used in real-world Compact code.

#### Scenario: String literal in parameterized type
- **WHEN** a type annotation contains `Opaque<"CoinInfo">`
- **THEN** the parser produces a `ParameterizedType` with a `StringArgument` containing the quoted string value

#### Scenario: String literal nested in complex type
- **WHEN** a type annotation contains `Map<Uint<128>, Opaque<"string">>`
- **THEN** the outer `Map` type has two arguments: a `ParameterizedType` (`Uint<128>`) and a `ParameterizedType` (`Opaque<"string">`) with a `StringArgument`

#### Scenario: Hover displays string type arguments
- **WHEN** the user hovers over a ledger typed `Opaque<"CoinInfo">`
- **THEN** the hover tooltip displays the type as `Opaque<"CoinInfo">`
