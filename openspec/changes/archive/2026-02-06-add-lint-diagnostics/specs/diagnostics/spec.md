## MODIFIED Requirements

### Requirement: Import diagnostics merged with existing diagnostics
The diagnostics pipeline SHALL include import-related diagnostics (unresolvable modules, unresolvable specifiers) and lint diagnostics (unused imports, unused variables, unused parameters, unreachable code) alongside existing parse error and undefined reference diagnostics. Each diagnostic SHALL include a stable `code` field identifying its type.

#### Scenario: File with both parse errors and import errors
- **WHEN** a file has a syntax error AND an unresolvable import
- **THEN** both diagnostics are published in a single `publishDiagnostics` call

#### Scenario: File with only import errors
- **WHEN** a file parses successfully but has an unresolvable import
- **THEN** the import diagnostic is published

#### Scenario: No import errors
- **WHEN** all imports in a file resolve successfully
- **THEN** no import-related diagnostics are published

#### Scenario: File with lint warnings and no errors
- **WHEN** a file parses successfully with no undefined references, but has an unused import
- **THEN** the lint warning is published alongside an empty error set

#### Scenario: File with both errors and lint warnings
- **WHEN** a file has an undefined reference error AND an unused variable
- **THEN** both diagnostics are published in a single `publishDiagnostics` call with their respective severities
