## ADDED Requirements

### Requirement: Imported symbols carry resolved source metadata
Imported symbol entries in the file scope SHALL support optional `resolvedUri` and `resolvedName` fields that link them to their source declaration in another file.

#### Scenario: Import resolved by workspace index
- **WHEN** the workspace index resolves `import { add } from MathUtils;` to file `math.compact`
- **THEN** the `add` symbol in the importing file's scope has `resolvedUri` set to `math.compact`'s URI and `resolvedName` set to `add`

#### Scenario: Import with alias resolved
- **WHEN** the workspace index resolves `import { add as sum } from MathUtils;`
- **THEN** the `sum` symbol has `resolvedUri` set to `math.compact`'s URI and `resolvedName` set to `add`

#### Scenario: Import not resolved
- **WHEN** the workspace index cannot resolve an import (module not found)
- **THEN** the imported symbol has `resolvedUri` and `resolvedName` as undefined

### Requirement: SymbolInfo interface extended
The `SymbolInfo` interface SHALL include optional `resolvedUri?: string` and `resolvedName?: string` fields for import resolution metadata.

#### Scenario: Non-imported symbol
- **WHEN** a symbol is declared locally (not from an import)
- **THEN** `resolvedUri` and `resolvedName` are undefined
