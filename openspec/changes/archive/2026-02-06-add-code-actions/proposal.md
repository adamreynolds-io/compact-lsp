## Why

The LSP server provides diagnostics (parse errors, undefined references, import errors) but offers no automated fixes. Users must manually resolve each issue. Code actions enable the editor to suggest quick fixes alongside diagnostics and offer refactoring operations, significantly improving the development experience.

## What Changes

- Add a new `codeActions` provider that returns LSP `CodeAction` items for a given document range
- Register `codeActionProvider` capability in the server's `onInitialize` handler
- Wire up `connection.onCodeAction()` handler in `server.ts`
- Implement quick fixes for existing diagnostics:
  - **Undefined reference**: suggest adding an import from a workspace module that exports the symbol
  - **Specifier not exported**: suggest removing the invalid specifier from the import
  - **Module not found**: suggest available module names (did-you-mean)
- Implement refactoring actions:
  - **Extract to constant**: extract a selected expression into a `const` declaration
  - **Remove unused import specifier**: remove an import specifier that has no references

## Capabilities

### New Capabilities
- `code-actions`: Quick-fix and refactoring code actions provider, including server registration, action resolution, and text edit generation

### Modified Capabilities
- `diagnostics`: Diagnostics must attach stable codes to enable code actions to match on specific diagnostic types

## Impact

- **New file**: `server/src/codeActions.ts` — provider logic
- **Modified**: `server/src/server.ts` — register capability, add handler
- **Modified**: `server/src/diagnostics.ts` — add diagnostic codes for matching
- **Modified**: `server/src/importDiagnostics.ts` — add diagnostic codes for matching
- **New test file**: `server/src/codeActions.test.ts`
- **Dependencies**: No new dependencies — uses existing `vscode-languageserver` types (`CodeAction`, `CodeActionKind`, `WorkspaceEdit`)
