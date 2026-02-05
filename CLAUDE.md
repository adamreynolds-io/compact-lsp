# Project Context

## Purpose

compact-lsp is a Language Server Protocol (LSP) server for the [Compact Language](https://github.com/LFDT-Minokawa/compact), a smart contract programming language. The initial goal is a simple, demoable proof of concept providing basic IDE features for `.compact` files in VS Code.

### POC Scope
- **Diagnostics:** Surface errors and warnings from the Compact compiler as editor squiggles
- **Hover:** Display type information or documentation when hovering over symbols

### Future Goals (Post-POC)
- Go-to-definition and find references
- Auto-completion
- Standalone server mode for other editors

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
- Key capabilities for this POC:
  - `textDocument/publishDiagnostics` - push errors/warnings to editor
  - `textDocument/hover` - respond to hover requests with symbol info

## Important Constraints

- **POC Focus:** Keep scope minimal - Diagnostics and Hover only
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
