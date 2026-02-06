## ADDED Requirements

### Requirement: Import diagnostics merged with existing diagnostics
The diagnostics pipeline SHALL include import-related diagnostics (unresolvable modules, unresolvable specifiers) alongside existing parse error and undefined reference diagnostics.

#### Scenario: File with both parse errors and import errors
- **WHEN** a file has a syntax error AND an unresolvable import
- **THEN** both diagnostics are published in a single `publishDiagnostics` call

#### Scenario: File with only import errors
- **WHEN** a file parses successfully but has an unresolvable import
- **THEN** the import diagnostic is published

#### Scenario: No import errors
- **WHEN** all imports in a file resolve successfully
- **THEN** no import-related diagnostics are published

### Requirement: Imported symbols not flagged as undefined
The undefined reference diagnostics SHALL NOT flag imported symbols that are registered in the file scope, even if the import is unresolvable at the workspace level.

#### Scenario: Imported symbol used in body
- **WHEN** a file has `import { add } from MathUtils;` and uses `add` in a circuit body
- **THEN** `add` is NOT flagged as an undefined reference (it is registered in scope from the import)
- **AND** if `MathUtils` is not found, a separate module-not-found diagnostic is reported on the import line
