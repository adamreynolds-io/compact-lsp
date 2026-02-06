## MODIFIED Requirements

### Requirement: Diagnostics have stable codes
Each diagnostic type SHALL have a stable string `code` field on the `Diagnostic` interface. The `code` field is optional (parse errors may omit it). The codes SHALL be:
- `"undefined-reference"` for undefined reference diagnostics
- `"module-not-found"` for module-not-found import diagnostics
- `"specifier-not-exported"` for specifier-not-exported import diagnostics
- `"unsupported-version"` for pragma language_version with an unrecognized version string
- `"version-resolved"` for pragma language_version with `>=` that resolved to a different version than requested

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

#### Scenario: Unsupported version diagnostic includes code
- **WHEN** the diagnostics pipeline detects a `pragma language_version` with an unknown version
- **THEN** the diagnostic has `code: "unsupported-version"` and severity `warning`

#### Scenario: Version resolved diagnostic includes code
- **WHEN** a `pragma language_version >= 0.15.0;` resolves to a different version (e.g., `0.20.0`)
- **THEN** the diagnostic has `code: "version-resolved"` and severity `information`
