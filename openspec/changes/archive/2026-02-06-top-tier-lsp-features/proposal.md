## Why

The LSP server currently provides core navigation features (hover, go-to-definition, find-references, completion, diagnostics) but lacks the next tier of capabilities that make a language server feel polished and productive. Document Symbols, Rename Symbol, Signature Help, and Semantic Tokens are the highest-impact missing features — they cover outline navigation, safe refactoring, parameter guidance, and rich syntax highlighting respectively.

## What Changes

- Add **Document Symbols** provider: return a hierarchical symbol tree (modules → circuits/structs/enums/ledgers/witnesses/consts) for the outline panel and breadcrumbs
- Add **Rename Symbol** provider: rename a symbol at the cursor and update all references in the document, with a prepare step for validation
- Add **Signature Help** provider: show parameter names, types, and active parameter highlighting when typing arguments inside circuit/function calls
- Add **Semantic Tokens** provider: emit token classifications (type, function, variable, parameter, keyword, etc.) so the editor can apply semantic highlighting on top of TextMate grammars

## Capabilities

### New Capabilities
- `document-symbols`: Hierarchical document symbol provider for outline view, breadcrumbs, and Go-to-Symbol-in-File
- `rename-symbol`: Rename symbol with prepare support, updating all references within the document
- `signature-help`: Parameter hints and active-parameter tracking for circuit/function call arguments
- `semantic-tokens`: Full and range-based semantic token classification for rich editor highlighting

### Modified Capabilities

None — these are all additive features that don't change existing behavior.

## Impact

- **Server**: New provider files (`documentSymbols.ts`, `rename.ts`, `signatureHelp.ts`, `semanticTokens.ts`) plus capability registration and handler wiring in `server.ts`
- **AST/Symbols**: May need minor extensions — e.g., exposing parameter index info for signature help, walking the AST for semantic token spans. No breaking changes to existing interfaces.
- **Extension**: The VS Code extension client already forwards all standard LSP capabilities; no extension changes needed
- **Tests**: New test files for each provider following existing patterns (vitest, mock documents)
