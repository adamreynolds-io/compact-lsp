# Project Context

## Purpose

compact-lsp is a Language Server Protocol (LSP) server for the [Compact Language](https://github.com/LFDT-Minokawa/compact), a smart contract programming language, providing rich IDE features for `.compact` files in VS Code.

### Current Capabilities
- **Diagnostics:** Parse errors, undefined references, import errors, and lint warnings (unused imports/variables/parameters, unreachable code)
- **Hover:** Type information, signatures, and built-in documentation on hover
- **Go to Definition:** Jump to symbol declarations, including cross-file imports
- **Find References:** Find all usages of a symbol across the workspace
- **Auto-completion:** Context-aware symbol suggestions with documentation
- **Document Symbols:** Hierarchical symbol outline
- **Rename Symbol:** Rename a symbol and all its references across files
- **Signature Help:** Parameter hints for function calls, with documentation
- **Semantic Tokens:** Symbol-aware syntax highlighting
- **Code Actions:** Quick fixes (add import, did-you-mean, remove unused import) and refactoring (extract to const)
- **Folding Ranges:** Code folding for modules, circuits, structs, enums, control flow, and import groups
- **Multi-file Analysis:** Workspace-wide indexing with cross-file navigation and import diagnostics

### Future Goals
- Standalone server mode for other editors (Neovim, Emacs, etc.)
- Marketplace publishing for the VS Code extension

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Testing:** Vitest
- **LSP Library:** vscode-languageserver (Microsoft's official LSP implementation for Node.js)
- **Editor Integration:** VS Code extension using vscode-languageclient

## Project Conventions

### Code Style
- **Linting:** ESLint with TypeScript support
- **Formatting:** Prettier
- Run `npm run lint` and `npm run format` before committing

### Architecture Patterns
- Separate LSP server logic from VS Code extension client
- Integrate directly with the Compact compiler for parsing and analysis
- Keep the codebase minimal - this is a POC, avoid over-engineering

### Testing Strategy
- Use Vitest for unit and integration tests
- Test LSP message handling with mock documents
- Prioritize testing diagnostic and hover logic

### Git Workflow
- **Trunk-based development:** Short-lived feature branches merged frequently to main
- Keep commits focused and atomic
- No strict commit message convention required for POC

## Domain Context

### The Compact Language
- **Purpose:** Smart contract development for blockchain/distributed ledger platforms
- **File Extension:** `.compact`
- **Repositories:**
  - https://github.com/LFDT-Minokawa/compact (original)
  - https://github.com/midnightntwrk/compact (active development)

### LSP Concepts
- LSP separates the editor (client) from language intelligence (server)
- Communication happens over JSON-RPC (stdio for VS Code extensions)
- Supported LSP methods:
  - `textDocument/publishDiagnostics` — push errors/warnings to editor
  - `textDocument/hover` — type information and signatures
  - `textDocument/definition` — go to symbol declaration
  - `textDocument/references` — find all symbol usages
  - `textDocument/completion` — context-aware suggestions
  - `textDocument/documentSymbol` — hierarchical outline
  - `textDocument/rename` and `textDocument/prepareRename` — symbol renaming
  - `textDocument/signatureHelp` — parameter hints
  - `textDocument/semanticTokens/full` — rich syntax highlighting
  - `textDocument/codeAction` — quick fixes and refactoring
  - `textDocument/foldingRange` — code folding

## Important Constraints

- **Integration:** Must work with the existing Compact compiler/parser
- **Performance:** Should handle typical smart contract file sizes without noticeable lag

## External Dependencies

- **Compact Compiler:**
  - https://github.com/LFDT-Minokawa/compact (original)
  - https://github.com/midnightntwrk/compact (active development)
  - Used for parsing, analysis, and diagnostics
  - Integration approach TBD (CLI invocation, library import, or WASM)
- **vscode-languageserver:** Microsoft's LSP implementation for Node.js
- **vscode-languageclient:** Client library for VS Code extension

## Research References (Not Implementation Dependencies)

- **compact-tree-sitter:** https://github.com/midnightntwrk/compact-tree-sitter
  - Useful for understanding Compact syntax structure
  - NOT used in implementation
  - Abandoned ~9 months ago; language has evolved since. Validate any syntax details against current Compact compiler.
