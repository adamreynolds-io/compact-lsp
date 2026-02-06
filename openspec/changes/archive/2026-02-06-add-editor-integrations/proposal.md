## Why

The LSP server currently only works through the VS Code extension. Developers using Vim/Neovim, Emacs, or Zed have no way to get Compact language support. Since the server already uses stdio transport (the standard for editor LSP clients), making it available as a standalone binary requires minimal server changes — the main work is packaging, documentation, and a Zed extension.

## What Changes

- Add a CLI entry point with shebang and `bin` field to `server/package.json` so the server can be invoked as `compact-lsp` after npm global install
- Create editor configuration documentation for Neovim (nvim-lspconfig), Emacs (lsp-mode/eglot), and Zed
- Build a Zed extension that bundles the LSP server for native Zed integration
- Add a `--stdio` flag (no-op but conventional) and `--version` flag to the server CLI

## Capabilities

### New Capabilities
- `standalone-server`: CLI packaging of the LSP server as an installable binary (`compact-lsp`) with conventional flags (`--stdio`, `--version`)
- `vim-integration`: Neovim/Vim configuration guide and nvim-lspconfig setup for the Compact LSP
- `emacs-integration`: Emacs configuration guide for lsp-mode and eglot with the Compact LSP
- `zed-extension`: Zed editor extension that packages the Compact LSP for native Zed support

### Modified Capabilities

None — the server's LSP protocol behavior is unchanged. This is purely packaging and documentation.

## Impact

- **server/package.json**: Add `bin` entry pointing to the compiled server
- **server/src/server.ts**: Minor CLI flag handling (`--stdio`, `--version`)
- **New directory**: `zed-extension/` for the Zed plugin (extension.toml, language config)
- **Documentation**: Editor setup guides (can live in repo README or dedicated docs)
- **Dependencies**: No new runtime dependencies for the server; Zed extension uses Zed's extension API
- **Build**: Server build script may need to prepend shebang to output
