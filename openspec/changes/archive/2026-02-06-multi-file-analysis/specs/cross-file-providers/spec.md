## ADDED Requirements

### Requirement: Cross-file go-to-definition
The definition provider SHALL follow import resolution to jump to the original declaration in another file.

#### Scenario: Go to definition on imported symbol
- **WHEN** the user invokes go-to-definition on `add` in `import { add } from MathUtils;` or on a usage of `add` in the body
- **THEN** the server returns the location of `add`'s declaration in the MathUtils source file

#### Scenario: Go to definition on unresolvable import
- **WHEN** the import cannot be resolved (module not found)
- **THEN** the server returns no result

### Requirement: Cross-file find-references
The references provider SHALL search all indexed files for references to a symbol.

#### Scenario: Find references across files
- **WHEN** the user invokes find-references on `add` defined in `math.compact`
- **THEN** the results include the declaration in `math.compact` AND all import usages and body references in other files that import `add`

#### Scenario: Find references with includeDeclaration false
- **WHEN** `includeDeclaration` is false
- **THEN** the declaration location is excluded but cross-file usages are still included

### Requirement: Cross-file hover
The hover provider SHALL show the resolved symbol's signature when hovering over an imported symbol.

#### Scenario: Hover on imported circuit
- **WHEN** the user hovers over `add` which is imported from `MathUtils`
- **THEN** hover displays the full signature from the source file (e.g., `circuit add(x: Field, y: Field) : Field`)

#### Scenario: Hover on unresolvable import
- **WHEN** the imported symbol cannot be resolved
- **THEN** hover displays the import information only (e.g., `import add from MathUtils (unresolved)`)

### Requirement: Cross-file completion
The completion provider SHALL suggest exported symbols from imported modules.

#### Scenario: Completion inside circuit body with imports
- **WHEN** the cursor is inside a circuit body in a file that has `import { add, sub } from MathUtils;`
- **THEN** completion results include `add` and `sub` (already registered as symbols from import)

#### Scenario: Completion suggests importable symbols
- **WHEN** the cursor is at the top level and the workspace contains files exporting `processData`
- **THEN** completion MAY suggest `processData` with an auto-import annotation

### Requirement: Cross-file rename
The rename provider SHALL propagate renames across all files that import or reference the renamed symbol.

#### Scenario: Rename exported symbol
- **WHEN** the user renames `add` to `sum` in its source file `math.compact`
- **THEN** the workspace edit includes changes in `math.compact` (declaration and local usages) AND in every other file that has `import { add } from ...` or references `add` after import

#### Scenario: Rename import alias only
- **WHEN** the user renames `sum` in `import { add as sum }` from the importing file
- **THEN** only the alias in the import statement and local usages of `sum` in that file are renamed
- **AND** the original `add` in the source file is NOT changed
