## Requirements

### Requirement: Completion suggests symbols visible in current scope
The auto-completion provider SHALL respond to `textDocument/completion` requests by returning all symbols visible from the cursor's enclosing scope, walking up the scope chain to root.

#### Scenario: Completion inside circuit body suggests parameters
- **WHEN** the cursor is inside `circuit foo(x: Field, y: Field) : Field { | }`
- **THEN** the completion list includes `x` and `y` with kind `parameter`

#### Scenario: Completion suggests file-level declarations
- **WHEN** the cursor is inside a circuit body and the file contains `ledger counter : Field;` and `struct Point { ... }`
- **THEN** the completion list includes `counter` and `Point`

#### Scenario: Completion suggests built-in types
- **WHEN** the cursor is in any scope
- **THEN** the completion list includes `Field`, `Boolean`, `Uint`, `Bytes`, `Vector`, `Opaque`, `Void`

#### Scenario: Completion suggests built-in functions
- **WHEN** the cursor is in any scope
- **THEN** the completion list includes `map`, `fold`, `disclose`, `pad`, `default`

#### Scenario: Completion suggests local variables
- **WHEN** the cursor is after `const x = 1;` in a circuit body
- **THEN** the completion list includes `x` with kind `variable`

#### Scenario: Completion inside module suggests module-scoped symbols
- **WHEN** the cursor is inside `module Foo { circuit bar() : Field { | } }` and the file also has `ledger counter : Field;`
- **THEN** the completion list includes `bar` (from module scope) and `counter` (from file scope)

### Requirement: Completion items include kind and detail
Each completion item SHALL include an appropriate `CompletionItemKind` and a `detail` string showing the symbol's signature.

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

### Requirement: Completion returns empty list outside identifier contexts
The completion provider SHALL return an empty list when the cursor position is not suitable for identifier completion.

#### Scenario: Completion on empty file
- **WHEN** the file is empty
- **THEN** the completion list contains built-in types and functions only
