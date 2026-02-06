## ADDED Requirements

### Requirement: Extension package is publishable to VS Code Marketplace
The `extension/package.json` SHALL NOT have `"private": true` and SHALL include all metadata required by the VS Code Marketplace.

#### Scenario: Required marketplace metadata present
- **WHEN** `extension/package.json` is inspected
- **THEN** it SHALL include `publisher`, `repository`, `license` (set to `"Apache-2.0"`), and `icon` fields
- **AND** it SHALL NOT include `"private": true`

### Requirement: Extension bundles the LSP server
The extension build process SHALL copy the compiled server output into the extension directory so the packaged `.vsix` is self-contained.

#### Scenario: Server files copied during build
- **WHEN** the extension is built for packaging
- **THEN** `extension/server/out/` SHALL contain the compiled server JavaScript files

#### Scenario: Extension resolves bundled server path
- **WHEN** the extension activates in VS Code
- **THEN** it SHALL resolve the server module path as `server/out/server.js` relative to the extension root (no `..` traversal)

### Requirement: vscodeignore excludes source files
The extension directory SHALL contain a `.vscodeignore` file that excludes source TypeScript, config, and development files from the packaged `.vsix`.

#### Scenario: Packaged extension is minimal
- **WHEN** `vsce package` is run in the extension directory
- **THEN** the `.vsix` SHALL contain only `out/`, `server/`, `package.json`, `LICENSE`, and `README.md`
- **AND** it SHALL NOT contain `src/`, `tsconfig.json`, or `node_modules/`

### Requirement: Extension build script packages server
The extension `package.json` SHALL include a `vscode:prepublish` script that builds both the server and extension, then copies the server into the extension.

#### Scenario: Prepublish builds and bundles
- **WHEN** `vsce package` is run
- **THEN** the `vscode:prepublish` script SHALL compile the server, compile the extension, and copy `server/out/` into `extension/server/out/`
