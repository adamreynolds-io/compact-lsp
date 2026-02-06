## ADDED Requirements

### Requirement: Server binary entry point
The server package SHALL expose a `compact-lsp` binary via the `bin` field in `server/package.json`, pointing to the compiled `out/server.js`.

#### Scenario: Global install makes binary available
- **WHEN** a user runs `npm install -g compact-lsp-server` (or links the package locally)
- **THEN** the `compact-lsp` command SHALL be available on PATH

#### Scenario: Direct node invocation
- **WHEN** a user runs `node server/out/server.js`
- **THEN** the server SHALL start and listen on stdio for LSP messages

### Requirement: Shebang in compiled output
The server build process SHALL prepend `#!/usr/bin/env node` to `out/server.js` after TypeScript compilation so the file is directly executable on Unix systems.

#### Scenario: Build produces executable output
- **WHEN** the server is built with `npm run build` in the server package
- **THEN** `server/out/server.js` SHALL begin with `#!/usr/bin/env node`

#### Scenario: File is executable
- **WHEN** the build completes
- **THEN** `server/out/server.js` SHALL have executable permissions (chmod +x equivalent)

### Requirement: --stdio flag
The server SHALL accept a `--stdio` flag. Since stdio is the default (and only) transport, this flag SHALL be a no-op but accepted without error.

#### Scenario: Server starts with --stdio
- **WHEN** the server is invoked as `compact-lsp --stdio`
- **THEN** the server SHALL start normally on stdio transport

#### Scenario: Server starts without flags
- **WHEN** the server is invoked as `compact-lsp` with no arguments
- **THEN** the server SHALL start normally on stdio transport (same behavior as with --stdio)

### Requirement: --version flag
The server SHALL accept a `--version` flag that prints the version from `server/package.json` and exits.

#### Scenario: Version output
- **WHEN** the server is invoked as `compact-lsp --version`
- **THEN** the server SHALL print the version string from `package.json` to stdout and exit with code 0

#### Scenario: Version does not start LSP
- **WHEN** the server is invoked as `compact-lsp --version`
- **THEN** the server SHALL NOT start the LSP connection or listen for messages

### Requirement: Unknown flags ignored
The server SHALL ignore unknown command-line flags and start normally, to maintain compatibility with editors that pass additional flags.

#### Scenario: Unknown flag passed
- **WHEN** the server is invoked as `compact-lsp --unknown-flag`
- **THEN** the server SHALL start normally on stdio transport
