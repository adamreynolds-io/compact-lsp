## Why

The diagnostics pipeline currently reports only hard errors: parse failures, undefined references, and import resolution failures. Developers also benefit from warnings about code that is technically valid but likely problematic — unused variables, unused imports, and unreachable code. These lint-style diagnostics catch common mistakes earlier and complement the existing code actions (e.g., "remove unused import" already exists but there's no warning that triggers it proactively).

## What Changes

- Add a new lint diagnostics module that analyzes the symbol table and references to detect:
  - **Unused imports**: import specifiers that are never referenced in the file
  - **Unused variables**: `const` bindings that are never referenced after declaration
  - **Unused parameters**: circuit/witness parameters that are never referenced in the body
  - **Unreachable code**: statements after a `return` in the same block
- All lint diagnostics use severity `warning` (not `error`) and carry stable diagnostic codes
- Existing code actions (remove unused import) trigger from the new lint warnings
- Diagnostics pipeline in the server merges lint warnings alongside existing errors

## Capabilities

### New Capabilities
- `lint-diagnostics`: Warning-level diagnostics for unused imports, unused variables, unused parameters, and unreachable code

### Modified Capabilities
- `diagnostics`: Diagnostics pipeline merges lint warnings alongside parse errors and import errors
- `code-actions`: Existing "remove unused import" refactoring action also triggers as a quick fix on the new `unused-import` warning diagnostic

## Impact

- New file: `server/src/lintDiagnostics.ts`
- Modified: `server/src/server.ts` (wire lint diagnostics into the pipeline)
- Modified: `server/src/codeActions.ts` (quick fix from lint warning)
- New test file: `server/src/__tests__/lintDiagnostics.test.ts`
- Modified test files for diagnostics and code actions integration
