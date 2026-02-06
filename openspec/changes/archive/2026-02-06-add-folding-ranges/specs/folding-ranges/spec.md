## ADDED Requirements

### Requirement: Folding ranges for block declarations
The provider SHALL return a folding range for each multi-line block declaration: `ModuleDefinition`, `CircuitDefinition`, `StructDefinition`, `EnumDefinition`, `ContractDeclaration`, and `ConstructorDeclaration`.

#### Scenario: Module with nested declarations
- **WHEN** a source file contains `module Foo { ... }` spanning lines 0–10
- **THEN** the provider returns a folding range with `startLine: 0`, `endLine: 10`, `kind: Region`

#### Scenario: Circuit with body
- **WHEN** a source file contains `circuit bar(...) { ... }` spanning lines 2–8
- **THEN** the provider returns a folding range with `startLine: 2`, `endLine: 8`, `kind: Region`

#### Scenario: Struct with fields
- **WHEN** a source file contains `struct Point { x: Field, y: Field }` spanning lines 1–4
- **THEN** the provider returns a folding range with `startLine: 1`, `endLine: 4`, `kind: Region`

#### Scenario: Enum with variants
- **WHEN** a source file contains `enum Color { Red, Green, Blue }` spanning lines 0–3
- **THEN** the provider returns a folding range with `startLine: 0`, `endLine: 3`, `kind: Region`

#### Scenario: Contract declaration
- **WHEN** a source file contains `contract MyContract { ... }` spanning lines 5–15
- **THEN** the provider returns a folding range with `startLine: 5`, `endLine: 15`, `kind: Region`

#### Scenario: Single-line declaration produces no fold
- **WHEN** a declaration starts and ends on the same line
- **THEN** the provider SHALL NOT return a folding range for that declaration

### Requirement: Folding ranges for statement blocks
The provider SHALL return a folding range for each multi-line `ForStatement`, `IfStatement`, and `BlockStatement` nested inside circuit/constructor bodies.

#### Scenario: For loop
- **WHEN** a circuit body contains `for i in range { ... }` spanning lines 3–6
- **THEN** the provider returns a folding range with `startLine: 3`, `endLine: 6`, `kind: Region`

#### Scenario: If statement
- **WHEN** a circuit body contains an if statement spanning lines 2–7
- **THEN** the provider returns a folding range with `startLine: 2`, `endLine: 7`, `kind: Region`

### Requirement: Folding ranges for nested declarations inside modules
The provider SHALL recurse into `ModuleDefinition` declarations to produce folding ranges for nested circuits, structs, enums, and other block constructs.

#### Scenario: Circuit inside a module
- **WHEN** a module contains a circuit spanning lines 2–5
- **THEN** the provider returns folding ranges for both the module and the nested circuit

### Requirement: Folding ranges for consecutive import groups
The provider SHALL group consecutive `ImportDeclaration` nodes (with no non-import declarations between them) into a single folding range with `kind: Imports`.

#### Scenario: Three consecutive imports
- **WHEN** a source file has three consecutive import declarations spanning lines 0–2
- **THEN** the provider returns a single folding range with `startLine: 0`, `endLine: 2`, `kind: Imports`

#### Scenario: Single import produces no fold
- **WHEN** a source file has only one import declaration
- **THEN** the provider SHALL NOT return an import group folding range

#### Scenario: Non-contiguous imports are separate groups
- **WHEN** imports on lines 0–1 are followed by a const on line 2, then another import on line 3
- **THEN** the provider returns one import group fold for lines 0–1 only (and no fold for the lone import on line 3)

### Requirement: Provider function signature
The `getFoldingRanges` function SHALL accept a `SourceFile` and return an array of `FoldingRange` objects (from `vscode-languageserver-types`).

#### Scenario: Empty source file
- **WHEN** the source file has no declarations
- **THEN** the provider returns an empty array

#### Scenario: File with parse errors
- **WHEN** the source file contains `ErrorNode` declarations
- **THEN** the provider skips error nodes and returns folding ranges for all valid declarations
