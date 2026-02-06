## ADDED Requirements

### Requirement: Parser parses selective imports
The parser SHALL parse selective import declarations with the syntax `import { name1, name2 as alias } from ModuleName;`.

#### Scenario: Simple selective import
- **WHEN** the source contains `import { foo } from MyModule;`
- **THEN** the AST contains an `ImportDeclaration` node with specifier `foo` from module `MyModule`

#### Scenario: Selective import with alias
- **WHEN** the source contains `import { test as t, create as c } from TestModule;`
- **THEN** the AST contains an `ImportDeclaration` node with specifiers `test` aliased to `t` and `create` aliased to `c`

#### Scenario: Selective import with prefix
- **WHEN** the source contains `import { test as t } from TestModule prefix T$;`
- **THEN** the AST contains an `ImportDeclaration` node with specifier `test` aliased to `t`, module `TestModule`, and prefix `T$`

### Requirement: Parser parses prefix imports
The parser SHALL parse prefix import declarations with the syntax `import ModuleName prefix PrefixString;`.

#### Scenario: Module name with prefix
- **WHEN** the source contains `import Runner prefix SomePrefix_;`
- **THEN** the AST contains an `ImportDeclaration` node with module name `Runner` and prefix `SomePrefix_`

#### Scenario: String path with prefix
- **WHEN** the source contains `import "path/to/Module" prefix P$;`
- **THEN** the AST contains an `ImportDeclaration` node with source path `path/to/Module` and prefix `P$`

### Requirement: Parser parses string path imports
The parser SHALL parse import declarations that use a string path as the module source.

#### Scenario: String path import with prefix
- **WHEN** the source contains `import "A/M" prefix A_;`
- **THEN** the AST contains an `ImportDeclaration` node with source path `A/M` and prefix `A_`

### Requirement: Parser parses export lists
The parser SHALL parse export list declarations with the syntax `export { name1, name2 };`.

#### Scenario: Simple export list
- **WHEN** the source contains `export { vote, advance };`
- **THEN** the AST contains an `ExportList` node with names `vote` and `advance`

#### Scenario: Single-item export list
- **WHEN** the source contains `export { G };`
- **THEN** the AST contains an `ExportList` node with name `G`

### Requirement: Symbol table registers import specifiers
The symbol table SHALL register selective import specifiers (using their alias if provided) as symbols in the file scope.

#### Scenario: Selective import symbols available for completion
- **WHEN** the source contains `import { test as t } from TestModule;` and a circuit body references `t`
- **THEN** `t` resolves as a defined symbol and does not produce an undefined reference warning

### Requirement: Import declarations support LSP features
All import declaration forms SHALL support hover (showing the import source), go-to-definition (for specifier names), and document symbols.

#### Scenario: Hover on selective import specifier
- **WHEN** the user hovers over `foo` in `import { foo } from MyModule;`
- **THEN** hover displays information about the import including the source module
