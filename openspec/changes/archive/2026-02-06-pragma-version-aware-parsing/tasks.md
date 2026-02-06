## 1. AST and Parser Changes

- [x] 1.1 Add optional `languageVersion?: string` and `languageVersionOperator?: '=' | '>='` fields to `SourceFile` interface in `ast.ts`
- [x] 1.2 Update `parse()` in `parser.ts` to extract `language_version` from the first `PragmaDeclaration`, parse the `>=` operator prefix if present, and set both fields on `SourceFile`
- [x] 1.3 Add parser tests: exact version, `>=` version, no pragma, multiple pragmas (first wins), non-version pragma

## 2. Version Registry

- [x] 2.1 Create `versionRegistry.ts` with `VersionCapabilities` interface (`builtinTypes: string[]`, `builtinFunctions: string[]`) and `LANGUAGE_VERSIONS: Record<string, VersionCapabilities>` map
- [x] 2.2 Populate the registry with version `"0.14.0"` built-in types and functions (from current `createRootScope`)
- [x] 2.3 Export helper functions: `isKnownVersion(version)`, `getVersionCapabilities(version)`, `resolveVersion(version, operator)` — where `resolveVersion` returns `{ effectiveVersion, fallback }` or `undefined`
- [x] 2.4 Implement `resolveVersion` logic: for `=` return exact match or undefined; for `>=` return exact match if present, else next highest version in registry (semver sorted), else undefined
- [x] 2.5 Add unit tests for the version registry including: exact lookup, `>=` exact match, `>=` fallback to next highest, `>=` with no match, unknown version

## 3. Version-Gated Root Scope

- [x] 3.1 Update `createRootScope()` in `symbols.ts` to accept optional effective version string (already resolved)
- [x] 3.2 When a recognized version is provided, register only the built-ins defined for that version; when absent, register all built-ins (preserve current behavior)
- [x] 3.3 Update `buildSymbolTable()` to resolve the version and pass the effective version to `createRootScope()`
- [x] 3.4 Add symbol table tests: root scope with resolved version, root scope without version, root scope with failed resolution (all built-ins)

## 4. Version Diagnostics

- [x] 4.1 Create `computeVersionDiagnostics(sourceFile: SourceFile): Diagnostic[]` function
- [x] 4.2 Report `"unsupported-version"` warning when version resolution fails entirely
- [x] 4.3 Report `"version-resolved"` informational diagnostic when `>=` resolves to a different version than requested, including which version is being used in the message
- [x] 4.4 Wire `computeVersionDiagnostics` into the server diagnostics pipeline alongside existing diagnostics
- [x] 4.5 Add diagnostic tests: unsupported version warning, `>=` fallback info diagnostic, exact match no diagnostic, no pragma no diagnostic

## 5. Hover for Pragma

- [x] 5.1 Update hover provider to check if cursor is on a `PragmaDeclaration` with `name === "language_version"` by checking against `sourceFile.declarations`
- [x] 5.2 Return hover content showing the declared version, the operator, and whether it is supported (and which effective version is being used if different)
- [x] 5.3 Add hover tests: hover on supported exact version, hover on `>=` version with fallback, hover on unsupported version, hover on non-version pragma returns nothing

## 6. Version-Gated Completions

- [x] 6.1 Update completion provider to resolve `sourceFile.languageVersion` with operator and filter built-in suggestions using the effective version's capabilities
- [x] 6.2 When no version is declared or resolution fails, suggest all built-ins (current behavior)
- [x] 6.3 Add completion tests: completions with exact version, completions with `>=` fallback version, completions without version show all

## 7. Integration and Workspace

- [x] 7.1 Ensure `WorkspaceIndex` passes through `languageVersion` and `languageVersionOperator` when re-analyzing files
- [x] 7.2 Add integration test: file with exact pragma version gets correct diagnostics, hover, and completions
- [x] 7.3 Add integration test: file with `>=` pragma version gets informational diagnostic and correct effective behavior
