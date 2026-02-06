## Why

The compact-lsp codebase has grown organically through feature additions without a dedicated review pass. Before moving toward marketplace publishing and standalone server mode, we need to address parser resource exhaustion risks, reduce duplicated logic across providers, and improve observability for production debugging.

## What Changes

- Add recursion depth limit to the Pratt expression parser to prevent stack overflow on adversarial input
- Add file size limit to `analyzeDocument()` to prevent LSP server freeze on oversized files
- Add lookahead limit to parser backtracking functions (`looksLikeArrowFunction`, `looksLikeStructConstruction`)
- Cache tokens in document state to eliminate redundant `tokenize()` calls across providers
- Consolidate duplicated `formatTypeNode()` logic from `symbols.ts`, `signatureHelp.ts`, and `documentSymbols.ts` into a shared utility
- Improve error logging in parser catch blocks (currently swallowed silently)

## Capabilities

### New Capabilities
- `parser-resource-limits`: Recursion depth limit, file size guard, and lookahead bounds to prevent resource exhaustion
- `token-caching`: Cache tokenization results in document state to avoid re-tokenizing on every LSP request
- `shared-formatting`: Extract duplicated type formatting logic into a shared utility module
- `error-observability`: Improve error logging in parser error recovery and server startup paths

### Modified Capabilities

## Impact

- `server/src/parser.ts`: Add depth parameter to `parseExpression`/`parsePrefixExpression`/`parseInfixExpression`; add limit to lookahead functions
- `server/src/server.ts`: Add file size check in `analyzeDocument()`; add cached tokens to document state map; improve error logging
- `server/src/utils.ts` or new `server/src/format.ts`: Shared `formatTypeNode()` and related formatting functions
- `server/src/symbols.ts`, `server/src/signatureHelp.ts`, `server/src/documentSymbols.ts`: Replace local `formatTypeNode()` with shared import
- `server/src/hover.ts`, `server/src/definition.ts`, `server/src/references.ts`, `server/src/rename.ts`, `server/src/completion.ts`: Use cached tokens instead of calling `tokenize()` directly
- All existing tests must continue passing; new tests for depth limits and file size guard
