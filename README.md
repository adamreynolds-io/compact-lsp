# compact-lsp

A Language Server Protocol (LSP) implementation for the [Compact](https://github.com/LFDT-Minokawa/compact) smart contract language, providing rich IDE features for `.compact` files.

## Features

- **Diagnostics** — Parse errors and undefined reference warnings as editor squiggles
- **Hover** — Type information and signatures on hover
- **Go to Definition** — Jump to symbol declarations
- **Find References** — Find all usages of a symbol across the file
- **Auto-completion** — Context-aware symbol suggestions
- **Document Symbols** — Outline view with hierarchical symbol tree
- **Rename Symbol** — Rename a symbol and all its references
- **Signature Help** — Parameter hints when typing function calls
- **Semantic Tokens** — Rich syntax highlighting based on symbol resolution

## Installation

The extension is not yet published to the VS Code Marketplace. To install from source:

1. Clone the repository:
   ```sh
   git clone https://github.com/adamreynolds-io/compact-lsp.git
   cd compact-lsp
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Build the server and extension:
   ```sh
   npm run build
   ```

4. Open the project in VS Code, then press **F5** to launch the Extension Development Host with the extension loaded.

## Development

```sh
# Install dependencies
npm install

# Build all workspaces
npm run build

# Run tests (297 tests across 13 test files)
npm test

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint

# Format
npm run format
```

## Project Structure

```
compact-lsp/
├── server/                 # LSP server
│   ├── src/
│   │   ├── server.ts       # Server entry point, LSP handler wiring
│   │   ├── lexer.ts        # Tokenizer for Compact source
│   │   ├── parser.ts       # Pratt parser producing AST
│   │   ├── ast.ts          # AST node type definitions
│   │   ├── symbols.ts      # Symbol table with scope hierarchy
│   │   ├── utils.ts        # Shared provider utilities
│   │   ├── hover.ts        # Hover provider
│   │   ├── definition.ts   # Go-to-definition provider
│   │   ├── references.ts   # Find-references provider
│   │   ├── completion.ts   # Auto-completion provider
│   │   ├── diagnostics.ts  # Diagnostics provider
│   │   ├── documentSymbols.ts  # Document symbols provider
│   │   ├── rename.ts       # Rename provider
│   │   ├── signatureHelp.ts    # Signature help provider
│   │   └── semanticTokens.ts   # Semantic tokens provider
│   └── tsconfig.json
├── extension/              # VS Code extension client
│   ├── src/
│   │   └── extension.ts    # Extension entry point
│   └── package.json        # Extension manifest (language contribution, activation)
├── package.json            # Root workspace config
└── CONTRIBUTING.md         # Architecture and development guide
```

## Tech Stack

- **TypeScript** — Server and extension source language
- **Node.js** — Runtime
- **Vitest** — Test framework
- **vscode-languageserver** — Microsoft's LSP implementation for Node.js
- **vscode-languageclient** — Client library for the VS Code extension

## Links

- [Compact Language (original)](https://github.com/LFDT-Minokawa/compact)
- [Compact Language (active development)](https://github.com/midnightntwrk/compact)

## License

This project is not yet licensed. See the repository for details.
