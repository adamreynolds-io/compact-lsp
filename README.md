# compact-lsp

A Language Server Protocol (LSP) implementation for the [Compact](https://github.com/LFDT-Minokawa/compact) smart contract language, providing rich IDE features for `.compact` files.

## Features

- **Diagnostics** — Parse errors, undefined references, import errors, lint warnings (unused imports/variables/parameters, unreachable code), and version diagnostics
- **Hover** — Type information, signatures, and built-in documentation on hover
- **Go to Definition** — Jump to symbol declarations, including cross-file imports
- **Find References** — Find all usages of a symbol across the workspace
- **Auto-completion** — Context-aware symbol suggestions with documentation
- **Document Symbols** — Outline view with hierarchical symbol tree
- **Rename Symbol** — Rename a symbol and all its references across files
- **Signature Help** — Parameter hints when typing function calls, with documentation
- **Semantic Tokens** — Rich syntax highlighting based on symbol resolution
- **Code Actions** — Quick fixes (add import, did-you-mean, remove unused import) and refactoring (extract to const)
- **Folding Ranges** — Code folding for modules, circuits, structs, enums, control flow, and import groups
- **Multi-file Analysis** — Workspace-wide indexing with cross-file navigation and import diagnostics
- **Version-Aware Parsing** — Pragma-based version gating of built-in types, functions, and ADT types
- **MCP Server** — Model Context Protocol server exposing all language features as tools for AI agents

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)

## Installation

### Standalone Server (for Neovim, Emacs, Zed, and other editors)

Install the LSP server globally:

```sh
npm install -g compact-lsp-server
```

This makes the `compact-lsp` binary available on your PATH. Verify with:

```sh
compact-lsp --version
```

### VS Code

The extension is not yet published to the VS Code Marketplace. To install from source:

1. Clone the repository:
   ```sh
   git clone https://github.com/adamreynolds-io/compact-lsp.git
   cd compact-lsp
   ```

2. Install dependencies and build:
   ```sh
   npm install
   npm run build
   ```

3. Open the project in VS Code, then press **F5** to launch the Extension Development Host with the extension loaded.

### Neovim

Add the following to your Neovim configuration (e.g. `~/.config/nvim/init.lua`):

```lua
vim.filetype.add({
  extension = {
    compact = "compact",
  },
})

vim.api.nvim_create_autocmd("FileType", {
  pattern = "compact",
  callback = function()
    vim.lsp.start({
      name = "compact-lsp",
      cmd = { "compact-lsp", "--stdio" },
      root_dir = vim.fs.dirname(vim.fs.find({ ".git" }, { upward = true })[1]),
    })
  end,
})
```

### Emacs

#### With eglot (built-in since Emacs 29)

```elisp
(define-derived-mode compact-mode prog-mode "Compact"
  "Major mode for editing Compact smart contract files.")

(add-to-list 'auto-mode-alist '("\\.compact\\'" . compact-mode))

(with-eval-after-load 'eglot
  (add-to-list 'eglot-server-programs
               '(compact-mode . ("compact-lsp" "--stdio"))))
```

#### With lsp-mode

```elisp
(define-derived-mode compact-mode prog-mode "Compact"
  "Major mode for editing Compact smart contract files.")

(add-to-list 'auto-mode-alist '("\\.compact\\'" . compact-mode))

(with-eval-after-load 'lsp-mode
  (lsp-register-client
   (make-lsp-client
    :new-connection (lsp-stdio-connection '("compact-lsp" "--stdio"))
    :major-modes '(compact-mode)
    :server-id 'compact-lsp)))
```

### Zed

The Zed extension is not yet published to the Zed extension marketplace. To install as a dev extension:

1. Make sure `compact-lsp` is installed globally (see above).
2. In Zed, open **Extensions** (Cmd+Shift+X / Ctrl+Shift+X).
3. Click **Install Dev Extension** and select the `zed-extension/` directory from this repository.

The extension uses LSP semantic tokens for syntax highlighting — no tree-sitter grammar is needed.

## Development

```sh
# Install dependencies
npm install

# Build all workspaces
npm run build

# Run tests (526 tests across 26 test files)
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
│   │   ├── semanticTokens.ts   # Semantic tokens provider
│   │   ├── codeActions.ts      # Code actions (quick fixes + refactoring)
│   │   ├── foldingRanges.ts    # Folding ranges provider
│   │   ├── builtinDocs.ts      # Built-in documentation registry
│   │   ├── workspaceIndex.ts   # Workspace-wide file indexing
│   │   ├── moduleResolution.ts # Import path resolution
│   │   ├── importDiagnostics.ts # Import error diagnostics
│   │   ├── lintDiagnostics.ts  # Lint warnings (unused symbols, unreachable code)
│   │   ├── versionRegistry.ts  # Language version definitions and resolution
│   │   └── versionDiagnostics.ts # Version-related diagnostics
│   └── tsconfig.json
├── extension/              # VS Code extension client
│   ├── src/
│   │   └── extension.ts    # Extension entry point
│   └── package.json        # Extension manifest (language contribution, activation)
├── mcp-server/             # MCP server for AI agents
│   ├── src/
│   │   ├── index.ts        # CLI entry point (--workspace arg, stdio transport)
│   │   ├── server.ts       # MCP tool and resource registration
│   │   └── workspace.ts    # Workspace manager wrapping WorkspaceIndex
│   └── package.json
├── zed-extension/          # Zed editor extension
│   ├── extension.toml      # Extension metadata and language server registration
│   ├── languages/compact/
│   │   └── config.toml     # Compact language configuration for Zed
│   ├── src/
│   │   └── lib.rs          # Extension entry point (locates compact-lsp on PATH)
│   └── Cargo.toml
└── package.json            # Root workspace config
```

## Tech Stack

- **TypeScript** — Server and extension source language
- **Node.js** — Runtime
- **Vitest** — Test framework
- **vscode-languageserver** — Microsoft's LSP implementation for Node.js
- **vscode-languageclient** — Client library for the VS Code extension
- **@modelcontextprotocol/sdk** — MCP server SDK for AI agent integration

## MCP Server

The MCP server exposes all language features as tools for AI agents (Claude Code, Cursor, etc.) over the [Model Context Protocol](https://modelcontextprotocol.io/).

### Usage

```sh
npm run build
node mcp-server/out/index.js --workspace /path/to/compact/project
```

The server communicates over stdio. Point your MCP client at the command above.

### Tools

| Tool | Description |
|------|-------------|
| `compact_diagnostics` | Run the full diagnostic pipeline on a file or inline source |
| `compact_hover` | Get type information and documentation for a position |
| `compact_definition` | Jump to a symbol's definition |
| `compact_references` | Find all usages of a symbol across the workspace |
| `compact_completions` | Get completion suggestions for a position |
| `compact_symbols` | Get the hierarchical symbol outline of a file |
| `compact_rename` | Compute rename edits across the workspace |
| `compact_signature` | Get parameter hints for a function call |
| `compact_analyze` | Run the full analysis pipeline (diagnostics + symbols + exports) |
| `compact_refresh` | Re-scan the workspace and rebuild the index |

### Resources

| Resource | Description |
|----------|-------------|
| `compact://files` | List all `.compact` files in the workspace |
| `compact://file/{path}` | Read a file's contents |

## Links

- [Compact Language](https://github.com/LFDT-Minokawa/compact)

## License

This project is not yet licensed. See the repository for details.
