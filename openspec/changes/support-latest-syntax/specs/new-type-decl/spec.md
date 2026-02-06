## ADDED Requirements

### Requirement: Parser parses `new type` declarations
The parser SHALL parse `new type` declarations with the syntax `[export] new type Name [<#Generics>] = TypeExpr;`.

#### Scenario: Simple new type
- **WHEN** the source contains `new type t0_bool = Boolean;`
- **THEN** the AST contains a `NewTypeDeclaration` node with name `t0_bool` and type expression `Boolean`

#### Scenario: New type with generic parameters
- **WHEN** the source contains `new type T14b<#N> = T14a;`
- **THEN** the AST contains a `NewTypeDeclaration` node with name `T14b`, generic parameter `N`, and type expression `T14a`

#### Scenario: Exported new type
- **WHEN** the source contains `export new type NativePoint = SimplePoint;`
- **THEN** the AST contains a `NewTypeDeclaration` node with `isExport: true`

#### Scenario: New type with parameterized type expression
- **WHEN** the source contains `new type t4_u32 = Uint<32>;`
- **THEN** the AST contains a `NewTypeDeclaration` with type expression as `ParameterizedType` for `Uint<32>`

### Requirement: Parser parses generic type aliases
The parser SHALL parse type alias declarations with generic parameters using the syntax `[export] type Name<#A, #B> = TypeExpr;`.

#### Scenario: Generic type alias
- **WHEN** the source contains `type Pair<#A, #B> = [Vector<A, Field>, Bytes<B>];`
- **THEN** the AST contains a type alias node with name `Pair`, generic parameters `A` and `B`, and a tuple type expression

#### Scenario: Simple exported type alias
- **WHEN** the source contains `export type MyField = Field;`
- **THEN** the AST contains a type alias node with name `MyField`, `isExport: true`, and type expression `Field`

### Requirement: Symbol table registers new type and type alias declarations
The symbol table SHALL register `new type` and `type` alias names as type symbols in the enclosing scope.

#### Scenario: New type available for references
- **WHEN** the source contains `new type MyBool = Boolean;` followed by `ledger x : MyBool;`
- **THEN** `MyBool` resolves as a defined symbol

#### Scenario: Generic type alias in scope
- **WHEN** the source contains `type Pair<#A, #B> = [A, B];` followed by usage of `Pair<Field, Field>`
- **THEN** `Pair` resolves as a defined symbol
