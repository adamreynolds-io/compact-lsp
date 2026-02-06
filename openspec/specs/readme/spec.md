## Requirements

### Requirement: README contains project overview
The README SHALL include a one-line description of compact-lsp as an LSP server for the Compact smart contract language, with links to the Compact language repositories.

#### Scenario: Reader understands what the project is
- **WHEN** a user reads the first section of the README
- **THEN** they understand that compact-lsp provides IDE features for `.compact` files via the Language Server Protocol

### Requirement: README lists all supported features
The README SHALL list all LSP capabilities currently supported by the server.

#### Scenario: Feature list is comprehensive
- **WHEN** a user reads the features section
- **THEN** they see all current capabilities: diagnostics, hover, go-to-definition, find references, auto-completion, document symbols, rename symbol, signature help, semantic tokens, code actions, folding ranges, multi-file analysis, version-aware parsing, and MCP server

### Requirement: README includes installation instructions
The README SHALL include instructions for installing the VS Code extension from source.

#### Scenario: User can install from source
- **WHEN** a user follows the installation instructions
- **THEN** they can build the server, build the extension, and load it in VS Code via the Extension Development Host

### Requirement: README includes development setup
The README SHALL include instructions for setting up a development environment including cloning, installing dependencies, building, running tests, and linting.

#### Scenario: Developer can set up the project
- **WHEN** a developer follows the development setup instructions
- **THEN** they can clone the repo, run `npm install`, `npm run build`, `npm test`, and `npm run lint` successfully

### Requirement: README includes MCP server section
The README SHALL include a dedicated MCP server section with usage instructions (build command, launch command with `--workspace` argument), a table of all available tools, and a table of available resources.

#### Scenario: User can launch the MCP server
- **WHEN** a user reads the MCP server section
- **THEN** they see the build and launch commands, understand the `--workspace` argument, and know the server communicates over stdio

#### Scenario: User sees all MCP tools
- **WHEN** a user reads the MCP tools table
- **THEN** they see all 10 tools: `compact_diagnostics`, `compact_hover`, `compact_definition`, `compact_references`, `compact_completions`, `compact_symbols`, `compact_rename`, `compact_signature`, `compact_analyze`, `compact_refresh`

#### Scenario: User sees MCP resources
- **WHEN** a user reads the MCP resources table
- **THEN** they see `compact://files` and `compact://file/{path}`

### Requirement: README includes project structure overview
The README SHALL include a brief project structure section showing the monorepo layout (server/, extension/, mcp-server/) and key files.

#### Scenario: Reader understands the codebase layout
- **WHEN** a user reads the project structure section
- **THEN** they understand the monorepo layout with server, extension, and mcp-server workspaces

### Requirement: README includes tech stack summary
The README SHALL list the core technologies: TypeScript, Node.js, Vitest, vscode-languageserver.

#### Scenario: Reader knows the tech stack
- **WHEN** a user reads the tech stack section
- **THEN** they see TypeScript, Node.js, Vitest, and vscode-languageserver listed
