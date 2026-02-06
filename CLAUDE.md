# Project Context

## Purpose

compact-lsp is a Language Server Protocol (LSP) server for the [Compact Language](https://github.com/LFDT-Minokawa/compact), a smart contract programming language, providing rich IDE features for `.compact` files in VS Code.

### Current Capabilities
- **Diagnostics:** Parse errors, undefined references, import errors, lint warnings (unused imports/variables/parameters, unreachable code), and version diagnostics
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
- **Version-Aware Parsing:** Pragma-based version gating of built-in types, functions, and ADT types
- **MCP Server:** Model Context Protocol server exposing all language features as tools for AI agents (Claude Code, Cursor, etc.)

### Future Goals
- Standalone server mode for other editors (Neovim, Emacs, etc.)
- Marketplace publishing for the VS Code extension

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Testing:** Vitest
- **LSP Library:** vscode-languageserver (Microsoft's official LSP implementation for Node.js)
- **MCP Library:** @modelcontextprotocol/sdk (Model Context Protocol for AI agent integration)
- **Editor Integration:** VS Code extension using vscode-languageclient

## Project Conventions

### Code Style
- **Linting:** ESLint with TypeScript support
- **Formatting:** Prettier
- Run `npm run lint` and `npm run format` before committing

### Architecture Patterns
- Three packages: `server/` (LSP server), `extension/` (VS Code client), `mcp-server/` (MCP server for AI agents)
- Hand-written lexer and Pratt parser (no external compiler dependency)
- MCP server reuses the same analysis pipeline (lexer, parser, symbol table, providers) as the LSP server
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
- **Repository:** https://github.com/LFDT-Minokawa/compact
- **Version Registry:** The LSP tracks language versions `0.14.0`, `0.18.0`, `0.19.0`, `0.20.0`, and `0.21.0` in `server/src/versionRegistry.ts`
- **Version Registry Maintenance:** Periodically check https://github.com/OpenZeppelin/compact-contracts for `pragma language_version` updates. If the contracts move to a newer version, add a corresponding entry to `server/src/versionRegistry.ts` with the appropriate built-in types, functions, and ADT types, and add documentation to `server/src/builtinDocs.ts`.

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

- **Performance:** Should handle typical smart contract file sizes without noticeable lag
- **Parser Safety:** Expression recursion depth limit (200), file size limit (1M chars), arrow function lookahead bounds (500 tokens)

## External Dependencies

- **vscode-languageserver:** Microsoft's LSP implementation for Node.js
- **vscode-languageclient:** Client library for VS Code extension
- **@modelcontextprotocol/sdk:** MCP server SDK with stdio transport (used by mcp-server package)
- **zod:** Schema validation (peer dependency of MCP SDK, used in mcp-server only)
- **Note:** The project uses a hand-written lexer and parser — there is no runtime dependency on the Compact compiler

## Research References (Not Implementation Dependencies)

- **compact-tree-sitter:** https://github.com/midnightntwrk/compact-tree-sitter
  - Useful for understanding Compact syntax structure
  - NOT used in implementation
  - Abandoned ~9 months ago; language has evolved since. Validate any syntax details against current Compact compiler.
