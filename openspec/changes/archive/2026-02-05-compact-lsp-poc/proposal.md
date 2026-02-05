## Why

Compact developers have no IDE intelligence — no error feedback, no hover information, no help navigating code. Building an LSP server gives them real-time diagnostics and symbol information in VS Code, making Compact development significantly more productive. The LSP is decoupled from the Compact compiler so it can be installed and used independently.

## What Changes

- Add a VS Code extension that launches an LSP server for `.compact` files
- LSP server includes a hand-written recursive descent parser for Compact (lexer + declaration parser for POC)
- Build a symbol table from the AST to track declarations, scopes, and annotated types
- Provide hover responses showing declaration signatures (circuit params/return types, ledger types, struct fields, etc.)
- Provide diagnostics: syntax errors from the parser + semantic checks (undefined references, basic scope errors)
- Monorepo structure containing both the VS Code extension (client) and LSP server

## Capabilities

### New Capabilities
- `lsp-server`: Core LSP server — connection lifecycle, document sync, parsing, and message routing
- `parser`: Hand-written recursive descent parser — lexer/tokenizer + declaration-level parser producing an AST
- `symbol-table`: AST walker that builds a symbol table with declarations, scopes, and annotated types
- `hover`: Hover provider that looks up symbols at cursor position and returns formatted signatures
- `diagnostics`: Diagnostics provider — surfaces syntax errors from the parser and semantic errors from the symbol table (undefined references, scope violations)
- `vscode-extension`: VS Code extension client that launches and communicates with the LSP server

### Modified Capabilities

None — greenfield project.

## Impact

- New project scaffolding: package.json, tsconfig, ESLint, Prettier, Vitest config
- No external parser dependencies — parser is hand-written in TypeScript
- VS Code extension manifest and packaging
