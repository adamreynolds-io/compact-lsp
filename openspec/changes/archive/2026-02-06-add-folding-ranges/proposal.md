## Why

The LSP server currently lacks code folding support. Editors like VS Code can only guess at fold points using indentation, which is unreliable. Adding `textDocument/foldingRange` support lets the server provide precise, AST-aware folding regions so users can collapse modules, circuits, functions, loops, and import groups — improving navigation in larger Compact files.

## What Changes

- Add a new `foldingRanges` provider that computes folding ranges from the AST
- Register the `foldingRangeProvider` capability in the LSP server
- Handle `textDocument/foldingRange` requests by delegating to the new provider
- Support folding for: module declarations, circuit declarations, function/method bodies, for loops, contract declarations, ledger blocks, and consecutive import groups

## Capabilities

### New Capabilities

- `folding-ranges`: Compute and return LSP folding ranges for Compact source files, covering block-level constructs and import groups

### Modified Capabilities

- `lsp-server`: Register foldingRange capability and wire up the request handler

## Impact

- **New file:** `server/src/foldingRanges.ts` — the folding range provider
- **New file:** `server/src/foldingRanges.test.ts` — tests for the provider
- **Modified file:** `server/src/server.ts` — register capability and add request handler
- **No breaking changes** — purely additive feature
- **No new dependencies** — uses existing AST types and vscode-languageserver's FoldingRange types
