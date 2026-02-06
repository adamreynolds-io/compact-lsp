## 1. Standalone Server CLI

- [x] 1.1 Add `"bin": { "compact-lsp": "out/server.js" }` to `server/package.json`
- [x] 1.2 Modify server build script to prepend `#!/usr/bin/env node` shebang to `out/server.js` and set executable permissions
- [x] 1.3 Add CLI flag parsing to `server/src/server.ts`: handle `--version` (print version from package.json and exit) and `--stdio` (no-op, accepted without error); ignore unknown flags
- [x] 1.4 Verify `node server/out/server.js --version` prints version and exits, and `node server/out/server.js --stdio` starts the LSP server

## 2. Zed Extension

- [x] 2.1 Create `zed-extension/extension.toml` with extension metadata (`id`, `name`, `version`, `description`, `authors`) and `[language_servers.compact-lsp]` entry with `languages = ["Compact"]`
- [x] 2.2 Create `zed-extension/languages/compact/config.toml` with `name = "Compact"`, `path_suffixes = ["compact"]`, `line_comments = ["//"]`
- [x] 2.3 Create `zed-extension/Cargo.toml` with `zed_extension_api` dependency targeting `wasm32-wasip1`
- [x] 2.4 Create `zed-extension/src/lib.rs` implementing `language_server_command` to find `compact-lsp` on PATH and return the command with `--stdio` arg; return descriptive error if not found

## 3. Editor Documentation

- [x] 3.1 Add Neovim section to README: `vim.filetype.add` for `.compact` → `compact`, `vim.lsp.start` snippet with `cmd = { "compact-lsp", "--stdio" }` and `filetypes = { "compact" }`
- [x] 3.2 Add Emacs section to README: eglot snippet with `compact-mode` and `eglot-server-programs` entry, lsp-mode snippet with `lsp-register-client`
- [x] 3.3 Add Zed section to README: manual dev extension install instructions and `npm install -g compact-lsp-server` prerequisite
- [x] 3.4 Add prerequisites note listing Node.js requirement and `npm install -g compact-lsp-server` install command
