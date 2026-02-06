## Context

The LSP server (`server/out/server.js`) already uses stdio transport via `createConnection(ProposedFeatures.all)`, which is the standard transport for editor LSP clients. The VS Code extension launches this as a child process with `TransportKind.stdio`. No protocol changes are needed — this is a packaging and integration effort.

The MCP server package already demonstrates the pattern we need: it has a `bin` entry in `package.json` and a shebang in the compiled output.

Zed extensions are Rust-based WebAssembly modules that implement the `zed::Extension` trait. They use `extension.toml` for metadata and `languages/<name>/config.toml` for language configuration.

## Goals / Non-Goals

**Goals:**
- Make the LSP server invocable as `compact-lsp --stdio` from any terminal
- Provide copy-paste configuration snippets for Neovim and Emacs
- Build a Zed extension that installs the server and provides language support
- Support `npm install -g` as the primary distribution method for Vim/Emacs users

**Non-Goals:**
- Tree-sitter grammar for Compact (Zed extension will rely on LSP semantic tokens only)
- Publishing to npm registry or Zed extension marketplace (future goal, not this change)
- Custom editor plugins with Compact-specific UI (just standard LSP features)
- Socket or TCP transport — stdio is sufficient and universal

## Decisions

### 1. CLI entry point: shebang in server.js + bin field

**Choice:** Add `"bin": { "compact-lsp": "out/server.js" }` to `server/package.json` and prepend a shebang (`#!/usr/bin/env node`) to the build output.

**Alternatives considered:**
- Separate `bin/compact-lsp` wrapper script — unnecessary indirection, the server.js already works directly
- Bundled binary (pkg/nexe) — too heavy for a POC, requires Node.js anyway

**Rationale:** Follows the same pattern as the MCP server package. The server already defaults to stdio, so no transport configuration is needed. Adding `--stdio` as a recognized-but-no-op flag satisfies conventions (many LSP clients pass it).

### 2. Shebang injection: build script, not source

**Choice:** Modify the server build script to prepend `#!/usr/bin/env node\n` to `out/server.js` after TypeScript compilation.

**Alternatives considered:**
- Put shebang in `server.ts` source — TypeScript strips it, or it causes issues with module resolution
- Use a separate entry point file — adds complexity for no benefit

**Rationale:** The MCP server already uses this approach (its output has a shebang). A simple `echo '#!/usr/bin/env node' | cat - out/server.js > tmp && mv tmp out/server.js` in the build script handles it.

### 3. Vim/Emacs: documentation only, no plugin code

**Choice:** Provide configuration snippets in docs. No vim plugin or emacs package.

**Alternatives considered:**
- Create an nvim-lspconfig upstream PR — good future goal, but requires the package to be published first
- Create a custom vim/emacs plugin — unnecessary, both editors have generic LSP clients that work with any server

**Rationale:** Neovim's `vim.lsp.start()` and Emacs' `eglot`/`lsp-mode` both accept arbitrary `cmd` configurations. A 5-line snippet is all users need. Documentation lives in the repo README.

### 4. Zed: minimal Rust extension with LSP-only highlighting

**Choice:** Create a Zed extension (`zed-extension/`) with a Rust `src/lib.rs` implementing `language_server_command` to locate and launch `compact-lsp`. Use LSP semantic tokens for highlighting instead of a tree-sitter grammar.

**Alternatives considered:**
- Tree-sitter grammar — the existing `compact-tree-sitter` repo is abandoned and the language has evolved; writing a new grammar is a large effort orthogonal to this change
- No Zed extension (just docs) — Zed doesn't support arbitrary `cmd` config like Vim/Emacs; an extension is required

**Rationale:** Zed requires extensions to register language servers. The extension is minimal: `extension.toml` + `languages/compact/config.toml` + a small Rust file. Using `semantic_tokens = "full"` in Zed config lets the LSP server handle all highlighting via the existing semantic tokens provider.

### 5. Server discovery in Zed: expect compact-lsp on PATH

**Choice:** The Zed extension will look for `compact-lsp` on PATH (installed via `npm install -g compact-lsp-server`).

**Alternatives considered:**
- Bundle Node.js + server in the extension — bloated, complex build
- Download server binary on first use — requires a release/CDN pipeline we don't have

**Rationale:** Simplest approach. Users install the server globally with npm, then the Zed extension finds it. Same as how `typescript-language-server`, `vscode-langservers-extracted`, etc. work.

## Risks / Trade-offs

- **[Node.js required]** → Users must have Node.js installed. This is standard for LSP servers in the JS ecosystem and documented as a prerequisite.
- **[No tree-sitter for Zed]** → Zed users get highlighting only from semantic tokens, which may be slower or less complete than tree-sitter. → Mitigation: Set `semantic_tokens = "full"` in config; a tree-sitter grammar can be added later independently.
- **[Global npm install]** → Users need `npm install -g` which may require sudo or path configuration. → Mitigation: Document alternatives (npx, direct node invocation).
- **[Zed extension not in marketplace]** → Users must install the extension manually or from source. → Mitigation: Document manual install; marketplace publishing is a future goal.

## Open Questions

- Should `--version` output the `package.json` version or a hardcoded string? (Leaning toward reading `package.json` at runtime.)
- Should the Zed extension attempt to auto-install the server via npm if not found on PATH? (Leaning no — keep it simple.)
