## 1. Diagnostic Codes

- [x] 1.1 Add optional `code` field to `Diagnostic` interface in `diagnostics.ts`
- [x] 1.2 Set `code: "undefined-reference"` on undefined reference diagnostics in `computeDiagnostics()`
- [x] 1.3 Set `code: "module-not-found"` and `code: "specifier-not-exported"` on import diagnostics in `computeImportDiagnostics()`
- [x] 1.4 Pass diagnostic codes through to LSP `Diagnostic` objects in `server.ts`
- [x] 1.5 Update existing diagnostic tests to verify codes are present

## 2. Code Action Provider

- [x] 2.1 Create `server/src/codeActions.ts` with `CodeActionResult` and `TextEditResult` types
- [x] 2.2 Implement `getCodeActions()` main function that dispatches to per-action helpers based on diagnostic codes and selection range
- [x] 2.3 Implement `fixUndefinedReference()` — scan workspace exports for matching symbol, generate import insertion edit
- [x] 2.4 Implement `fixSpecifierNotExported()` — remove invalid specifier from import (or remove entire import if only specifier)
- [x] 2.5 Implement `suggestSimilarModule()` — find workspace modules with similar names to the not-found module, generate replacement edit
- [x] 2.6 Implement `extractToConst()` — extract selected expression text to a `const` declaration before the containing statement
- [x] 2.7 Implement `removeUnusedImport()` — detect unused import specifiers at cursor position and offer removal

## 3. Server Integration

- [x] 3.1 Register `codeActionProvider` capability in `onInitialize` with supported `codeActionKinds`
- [x] 3.2 Add `connection.onCodeAction()` handler that calls `getCodeActions()` and translates results to LSP `CodeAction` objects
- [x] 3.3 Translate `TextEditResult[]` to `WorkspaceEdit` with changes grouped by URI

## 4. Tests

- [x] 4.1 Create `server/src/codeActions.test.ts` with test helpers
- [x] 4.2 Test: undefined reference with matching workspace export → add import action offered
- [x] 4.3 Test: undefined reference with multiple matching exports → multiple actions offered
- [x] 4.4 Test: undefined reference with no matching export → no action
- [x] 4.5 Test: specifier not exported with multiple specifiers → remove single specifier
- [x] 4.6 Test: specifier not exported as only specifier → remove entire import
- [x] 4.7 Test: module not found with similar name → did-you-mean action
- [x] 4.8 Test: module not found with no similar name → no action
- [x] 4.9 Test: extract to const with valid expression selection → extract action
- [x] 4.10 Test: extract to const with invalid selection → no action
- [x] 4.11 Test: remove unused import specifier → removal action offered
- [x] 4.12 Test: all specifiers used → no removal action
- [x] 4.13 Test: no workspace index → import-related actions skipped, other actions work
- [x] 4.14 Update existing diagnostic tests to verify `code` field values
