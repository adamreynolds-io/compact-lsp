## ADDED Requirements

### Requirement: Workspace index tracks all Compact files
The workspace index SHALL maintain an entry for every `.compact` file in the workspace, containing the file's URI, module name, exported symbols, file scope, parse result, and tokens.

#### Scenario: Workspace opened with multiple files
- **WHEN** the server initializes with a workspace containing files `a.compact`, `b.compact`, and `c.compact`
- **THEN** the workspace index contains entries for all three files
- **AND** each entry includes the file's parsed scope and exported symbols

#### Scenario: File added to workspace
- **WHEN** a new `.compact` file is created in the workspace
- **THEN** the workspace index adds an entry for the new file after parsing it

#### Scenario: File removed from workspace
- **WHEN** a `.compact` file is deleted from the workspace
- **THEN** the workspace index removes the entry for that file

#### Scenario: File modified
- **WHEN** a `.compact` file is modified (via open document or file watcher)
- **THEN** the workspace index re-parses the file and updates its entry with the new scope and exports

### Requirement: Workspace index extracts module names
The workspace index SHALL determine each file's module name from (in priority order): an explicit `module` declaration in the file, or the file's stem (filename without `.compact` extension).

#### Scenario: File with explicit module declaration
- **WHEN** a file contains `module MyModule { ... }`
- **THEN** the workspace index records its module name as `MyModule`

#### Scenario: File without module declaration
- **WHEN** a file named `utils.compact` contains no `module` declaration
- **THEN** the workspace index records its module name as `utils`

#### Scenario: Module name collision
- **WHEN** two files resolve to the same module name
- **THEN** the workspace index records both but resolves to the first match
- **AND** a warning is available for diagnostic reporting

### Requirement: Workspace index tracks exported symbols
The workspace index SHALL track which symbols each file exports, based on the `export` modifier on declarations and `export { ... }` lists.

#### Scenario: Exported circuit
- **WHEN** a file contains `export circuit add(x: Field) : Field { ... }`
- **THEN** the workspace index records `add` as an exported symbol from that file

#### Scenario: Export list
- **WHEN** a file contains `export { foo, bar };`
- **THEN** the workspace index records `foo` and `bar` as exported symbols

#### Scenario: Non-exported symbol
- **WHEN** a file contains `circuit helper() : Void { }` without the `export` keyword
- **THEN** `helper` is NOT recorded as an exported symbol

### Requirement: Workspace index resolves imports
The workspace index SHALL provide a method to resolve an import specifier to its source file and symbol info.

#### Scenario: Resolve selective import
- **WHEN** file A contains `import { add } from MathUtils;` and `MathUtils` maps to file B which exports `add`
- **THEN** resolving `add` from file A returns `{ uri: fileB, symbolInfo: <add's SymbolInfo> }`

#### Scenario: Resolve import with alias
- **WHEN** file A contains `import { add as sum } from MathUtils;`
- **THEN** resolving `sum` in file A returns the `add` symbol from the MathUtils file

#### Scenario: Unresolvable module
- **WHEN** file A contains `import { foo } from UnknownModule;` and no file maps to `UnknownModule`
- **THEN** resolution returns undefined
