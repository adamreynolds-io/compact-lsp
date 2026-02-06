## ADDED Requirements

### Requirement: Eglot configuration snippet
The repository documentation SHALL include an Emacs configuration snippet for `eglot` that launches the `compact-lsp` server for `.compact` files.

#### Scenario: Eglot snippet contains required fields
- **WHEN** a user reads the Emacs eglot documentation
- **THEN** the snippet SHALL register a `compact-mode` entry in `eglot-server-programs` with the command `("compact-lsp" "--stdio")`

#### Scenario: Eglot snippet includes mode setup
- **WHEN** a user reads the Emacs eglot documentation
- **THEN** the snippet SHALL include a `compact-mode` definition (or `auto-mode-alist` entry) mapping `*.compact` files to the mode

### Requirement: lsp-mode configuration snippet
The repository documentation SHALL include an Emacs configuration snippet for `lsp-mode` as an alternative to eglot.

#### Scenario: lsp-mode snippet contains required fields
- **WHEN** a user reads the Emacs lsp-mode documentation
- **THEN** the snippet SHALL register a `compact-lsp` client using `lsp-register-client` with the command `("compact-lsp" "--stdio")`
- **AND** the snippet SHALL specify `:major-modes` including `compact-mode`

### Requirement: Prerequisites documented
The documentation SHALL list prerequisites: Node.js installed, `compact-lsp` available on PATH, and either `eglot` (built-in since Emacs 29) or `lsp-mode` installed.

#### Scenario: Install instructions present
- **WHEN** a user reads the Emacs integration documentation
- **THEN** the documentation SHALL include the `npm install -g compact-lsp-server` command
- **AND** the documentation SHALL note the Node.js prerequisite
- **AND** the documentation SHALL note which Emacs LSP client packages are supported
