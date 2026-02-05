## ADDED Requirements

### Requirement: Report syntax errors from the parser
The diagnostics provider SHALL convert parser syntax errors into LSP diagnostics with severity `Error`.

#### Scenario: Syntax error in source
- **WHEN** the parser records a syntax error at line 5, columns 10-15
- **THEN** a diagnostic is published with severity `Error`, range covering line 5 columns 10-15, and the parser's error message

#### Scenario: Multiple syntax errors
- **WHEN** the parser records multiple syntax errors
- **THEN** each is published as a separate diagnostic

#### Scenario: No syntax errors
- **WHEN** the parser produces no syntax errors
- **THEN** no syntax error diagnostics are published

### Requirement: Report undefined references
The diagnostics provider SHALL report an error diagnostic for each identifier reference that cannot be resolved in any enclosing scope.

#### Scenario: Undefined variable reference
- **WHEN** identifier `foo` is used in an expression and `foo` is not declared in any enclosing scope
- **THEN** a diagnostic is published with severity `Error` and message indicating `foo` is not defined

#### Scenario: Reference to built-in type is not flagged
- **WHEN** identifier `Field`, `Boolean`, `Uint`, `Bytes`, `Vector`, `Opaque`, or `Void` is used
- **THEN** no undefined reference diagnostic is published (these are recognized as built-in types)

#### Scenario: Reference to built-in function is not flagged
- **WHEN** identifier `map`, `fold`, `disclose`, `pad`, or `default` is used
- **THEN** no undefined reference diagnostic is published (these are recognized as built-in functions)

### Requirement: Diagnostics are cleared when errors are fixed
The diagnostics provider SHALL publish an empty diagnostics array for a document when re-analysis finds no errors.

#### Scenario: Error fixed
- **WHEN** a document previously had diagnostics and the user fixes all errors
- **THEN** the server publishes an empty diagnostics array, clearing all squiggles

### Requirement: Diagnostics include source identifier
All diagnostics SHALL include `source: "compact-lsp"` so users can identify where diagnostics come from.

#### Scenario: Diagnostic source
- **WHEN** any diagnostic is published
- **THEN** the diagnostic object includes `source: "compact-lsp"`
