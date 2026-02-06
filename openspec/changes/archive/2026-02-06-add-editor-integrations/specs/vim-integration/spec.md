## ADDED Requirements

### Requirement: Neovim LSP configuration snippet
The repository documentation SHALL include a Neovim configuration snippet using `vim.lsp.start()` that launches the `compact-lsp` server for `.compact` files.

#### Scenario: Neovim snippet contains required fields
- **WHEN** a user reads the Neovim configuration documentation
- **THEN** the snippet SHALL specify the `cmd` as `{ "compact-lsp", "--stdio" }`
- **AND** the snippet SHALL specify `filetypes` including `compact`
- **AND** the snippet SHALL specify a `root_dir` detection pattern (e.g., finding the nearest directory with `.compact` files)

#### Scenario: Neovim snippet works with vim.lsp.start
- **WHEN** a user copies the snippet into their Neovim config and opens a `.compact` file
- **THEN** Neovim SHALL start the `compact-lsp` server and attach it to the buffer

### Requirement: Neovim filetype detection
The documentation SHALL include instructions for registering the `compact` filetype for `.compact` files in Neovim.

#### Scenario: Filetype autocommand provided
- **WHEN** a user reads the Neovim setup documentation
- **THEN** the documentation SHALL include a `vim.filetype.add` call mapping `*.compact` to the `compact` filetype

### Requirement: Prerequisites documented
The documentation SHALL list prerequisites: Node.js installed and `compact-lsp` available on PATH (via `npm install -g`).

#### Scenario: Install instructions present
- **WHEN** a user reads the Vim/Neovim integration documentation
- **THEN** the documentation SHALL include the `npm install -g compact-lsp-server` command
- **AND** the documentation SHALL note the Node.js prerequisite
