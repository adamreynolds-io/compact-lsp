## 1. Core Lint Diagnostics Module

- [x] 1.1 Create `server/src/lintDiagnostics.ts` with `computeLintDiagnostics(sourceFile, fileScope, references)` returning `Diagnostic[]`
- [x] 1.2 Implement unused import detection: walk `ImportDeclaration` specifiers, check each name against references, report `"unused-import"` warnings
- [x] 1.3 Implement unused variable detection: walk `ConstDeclaration` in all scopes, check each name against references, report `"unused-variable"` warnings; exclude `_` names
- [x] 1.4 Implement unused parameter detection: walk `CircuitDefinition` parameters, check each name against references scoped to the circuit body, report `"unused-parameter"` warnings; exclude witness parameters and `_` names
- [x] 1.5 Implement unreachable code detection: walk statement lists, detect statements after `ReturnStatement` in the same block, report `"unreachable-code"` warnings

## 2. Server Integration

- [x] 2.1 Wire `computeLintDiagnostics()` into the server's document change handler, merging lint warnings with existing parse/reference/import diagnostics before publishing
- [x] 2.2 Verify lint warnings appear alongside errors in a single `publishDiagnostics` call

## 3. Code Action Integration

- [x] 3.1 Update `codeActions.ts` to offer a quick fix for `"unused-import"` diagnostics that removes the unused specifier (or the entire import if it's the only specifier)

## 4. Tests

- [x] 4.1 Create `server/src/__tests__/lintDiagnostics.test.ts` with tests for unused import detection (referenced, unreferenced, aliased, multi-specifier, non-selective)
- [x] 4.2 Add tests for unused variable detection (referenced, unreferenced, underscore exclusion)
- [x] 4.3 Add tests for unused parameter detection (referenced, unreferenced, witness exclusion, underscore exclusion)
- [x] 4.4 Add tests for unreachable code detection (after return, multiple statements, nested block return, no return)
- [x] 4.5 Add tests for code action integration: quick fix offered for `"unused-import"` diagnostic
- [x] 4.6 Run full test suite and verify all tests pass
