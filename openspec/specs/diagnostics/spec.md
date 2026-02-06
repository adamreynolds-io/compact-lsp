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

### Requirement: Imported symbols not flagged as undefined
The undefined reference diagnostics SHALL NOT flag imported symbols that are registered in the file scope, even if the import is unresolvable at the workspace level.

#### Scenario: Imported symbol used in body
- **WHEN** a file has `import { add } from MathUtils;` and uses `add` in a circuit body
- **THEN** `add` is NOT flagged as an undefined reference (it is registered in scope from the import)
- **AND** if `MathUtils` is not found, a separate module-not-found diagnostic is reported on the import line

### Requirement: Diagnostics have stable codes
Each diagnostic type SHALL have a stable string `code` field on the `Diagnostic` interface. The `code` field is optional (parse errors may omit it). The codes SHALL be:
- `"undefined-reference"` for undefined reference diagnostics
- `"module-not-found"` for module-not-found import diagnostics
- `"specifier-not-exported"` for specifier-not-exported import diagnostics

#### Scenario: Undefined reference diagnostic includes code
- **WHEN** `computeDiagnostics()` produces an undefined reference diagnostic
- **THEN** the diagnostic has `code: "undefined-reference"`

#### Scenario: Module not found diagnostic includes code
- **WHEN** `computeImportDiagnostics()` produces a module-not-found diagnostic
- **THEN** the diagnostic has `code: "module-not-found"`

#### Scenario: Specifier not exported diagnostic includes code
- **WHEN** `computeImportDiagnostics()` produces a specifier-not-exported diagnostic
- **THEN** the diagnostic has `code: "specifier-not-exported"`

#### Scenario: Parse error diagnostics may omit code
- **WHEN** `computeDiagnostics()` produces a parse error diagnostic
- **THEN** the diagnostic `code` field is undefined
