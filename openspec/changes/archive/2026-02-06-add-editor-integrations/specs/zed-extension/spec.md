## ADDED Requirements

### Requirement: Extension metadata
The Zed extension SHALL have an `extension.toml` at `zed-extension/extension.toml` that registers the Compact language and its language server.

#### Scenario: extension.toml defines language server
- **WHEN** the extension is loaded by Zed
- **THEN** `extension.toml` SHALL declare a `[language_servers.compact-lsp]` entry with `languages = ["Compact"]`

#### Scenario: extension.toml metadata
- **WHEN** the extension is loaded by Zed
- **THEN** `extension.toml` SHALL include `id`, `name`, `version`, `description`, and `authors` fields

### Requirement: Language configuration
The extension SHALL include a `languages/compact/config.toml` defining the Compact language metadata for Zed.

#### Scenario: Language config maps file extension
- **WHEN** a user opens a `.compact` file in Zed with the extension installed
- **THEN** Zed SHALL recognize the file as the "Compact" language based on `path_suffixes = ["compact"]` in `config.toml`

#### Scenario: Language config specifies comment syntax
- **WHEN** the language config is loaded
- **THEN** `config.toml` SHALL specify `line_comments = ["//"]` for toggle-comment support

### Requirement: Language server command
The extension SHALL implement the `language_server_command` method in Rust (`zed-extension/src/lib.rs`) to launch the `compact-lsp` binary.

#### Scenario: Server found on PATH
- **WHEN** `compact-lsp` is installed globally and available on PATH
- **AND** a user opens a `.compact` file in Zed
- **THEN** the extension SHALL launch `compact-lsp --stdio` as the language server process

#### Scenario: Server not found on PATH
- **WHEN** `compact-lsp` is not available on PATH
- **AND** a user opens a `.compact` file in Zed
- **THEN** the extension SHALL return an error indicating `compact-lsp` was not found and suggesting `npm install -g compact-lsp-server`

### Requirement: Semantic tokens for highlighting
The extension SHALL configure Zed to use LSP semantic tokens for syntax highlighting instead of a tree-sitter grammar.

#### Scenario: Semantic tokens enabled
- **WHEN** the extension is active for a `.compact` file
- **THEN** Zed SHALL use the LSP server's semantic tokens for syntax highlighting

### Requirement: No tree-sitter grammar
The extension SHALL NOT include a tree-sitter grammar. All syntax highlighting SHALL come from LSP semantic tokens.

#### Scenario: Extension has no grammar
- **WHEN** the extension is inspected
- **THEN** `extension.toml` SHALL NOT contain a `[grammars]` section
- **AND** the `languages/compact/` directory SHALL NOT contain `highlights.scm` or other tree-sitter query files

### Requirement: Installation documentation
The repository SHALL include documentation for installing the Zed extension manually (dev extension or directory install), since it is not published to the Zed marketplace.

#### Scenario: Manual install instructions
- **WHEN** a user reads the Zed integration documentation
- **THEN** the documentation SHALL explain how to install the extension as a Zed dev extension
- **AND** the documentation SHALL note the prerequisite of `compact-lsp` on PATH via `npm install -g compact-lsp-server`
