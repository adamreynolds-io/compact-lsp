## Why

Hover, completion, and signature help providers return only type signatures for built-in types and functions (e.g., `(built-in) map`). DApp developers learning Compact have no way to understand what built-ins do without leaving the IDE. Adding single-sentence descriptions to all 32 built-ins makes the LSP immediately more useful for onboarding.

## What Changes

- Add an optional `documentation` field to `SymbolInfo` for carrying description text
- Create a static documentation registry mapping built-in names to single-sentence descriptions
- Populate `documentation` on built-in symbols during `createRootScope()`
- Update hover provider to append documentation below the signature in markdown
- Update completion provider to include documentation in completion items
- Update signature help provider to include function-level documentation

## Capabilities

### New Capabilities

- `builtin-docs`: Static documentation registry for built-in types, functions, and ledger ADT types, with integration into hover, completion, and signature help providers

### Modified Capabilities

- `hover`: Hover output includes documentation text below the signature for symbols that have documentation
- `auto-completion`: Completion items include documentation text for symbols that have documentation
- `signature-help`: Signature help includes function-level documentation for symbols that have documentation

## Impact

- **Modified file:** `server/src/symbols.ts` — add `documentation` field to `SymbolInfo`, populate during root scope creation
- **New file:** `server/src/builtinDocs.ts` — static documentation registry (32 entries)
- **Modified file:** `server/src/hover.ts` — append documentation to hover output
- **Modified file:** `server/src/completion.ts` — add documentation to `CompletionItem`
- **Modified file:** `server/src/signatureHelp.ts` — add documentation to `SignatureHelpResult`
- **Modified file:** `server/src/server.ts` — pass documentation through to LSP response types
- **No breaking changes** — `documentation` is optional, all existing behavior unchanged when absent
