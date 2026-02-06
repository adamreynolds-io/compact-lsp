## MODIFIED Requirements

### Requirement: Completion items include kind and detail
Each completion item SHALL include an appropriate `CompletionItemKind`, a `detail` string showing the symbol's signature, and when available, a `documentation` field with the symbol's description.

#### Scenario: Circuit completion item
- **WHEN** `circuit add(x: Field, y: Field) : Field` is in scope
- **THEN** the completion item has kind `Function` and detail `circuit add(x: Field, y: Field) : Field`

#### Scenario: Ledger completion item
- **WHEN** `ledger counter : Field` is in scope
- **THEN** the completion item has kind `Variable` and detail `ledger counter : Field`

#### Scenario: Struct completion item
- **WHEN** `struct Point { x: Field; y: Field; }` is in scope
- **THEN** the completion item has kind `Struct` and detail showing the struct name

#### Scenario: Enum completion item
- **WHEN** `enum Color { red, green, blue }` is in scope
- **THEN** the completion item has kind `Enum` and detail showing the enum name

#### Scenario: Parameter completion item
- **WHEN** parameter `x: Field` is in scope
- **THEN** the completion item has kind `Variable` and detail `(parameter) x: Field`

#### Scenario: Built-in type completion item with documentation
- **WHEN** `Field` is a built-in type with documentation
- **THEN** the completion item includes the documentation text

#### Scenario: Built-in function completion item with documentation
- **WHEN** `map` is a built-in function with documentation
- **THEN** the completion item includes the documentation text

#### Scenario: User-defined symbol without documentation
- **WHEN** a user-defined circuit is in scope with no documentation
- **THEN** the completion item has no documentation field
