## Why

The LSP currently ignores `pragma language_version` declarations — the pragma is parsed into the AST but has no effect on parsing behavior, diagnostics, or IDE features. As the Compact language evolves across versions (e.g., 0.14.0 → 0.26.0), syntax and semantics change. Without version awareness, the LSP cannot provide accurate diagnostics or completions for files targeting a specific language version, and users get no feedback about version compatibility.

## What Changes

- Extract `language_version` from parsed `PragmaDeclaration` nodes (supporting both exact `0.14.0` and `>= 0.14.0` forms) and expose it on the `SourceFile` AST
- Define a version capability registry that maps language versions to supported syntax features, built-in types, and built-in functions
- Resolve `>=` versions: use the exact version if available, otherwise fall back to the next highest registered version
- Use the resolved effective version to gate diagnostics, completion suggestions, and hover information
- Report a warning diagnostic when `pragma language_version` specifies a version that cannot be resolved
- Report an informational diagnostic when a `>=` version resolves to a different version than requested, making it clear which version is active
- Expose the detected and effective language version in hover information for the pragma itself

## Capabilities

### New Capabilities
- `version-aware-parsing`: Extracting and validating `pragma language_version`, gating parser/provider behavior based on declared version, and reporting version-related diagnostics

### Modified Capabilities
- `diagnostics`: Add version-related diagnostic codes (`"unsupported-version"`, `"version-resolved"`) to the diagnostic pipeline
- `parser`: Extract and surface the `language_version` value from pragma declarations on the `SourceFile` node
- `hover`: Show version information when hovering over a `pragma language_version` declaration

## Impact

- **AST (`ast.ts`)**: Add optional `languageVersion` and `languageVersionOperator` fields to `SourceFile`
- **Parser (`parser.ts`)**: Extract version and operator (`=` / `>=`) from pragma during parsing
- **Diagnostics pipeline**: New version-related diagnostic codes integrated into existing flow
- **Hover provider**: Version-aware hover for pragma lines
- **Completion provider**: Version-gated built-in suggestions
- **New file**: Version registry defining per-version feature sets
