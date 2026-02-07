## MODIFIED Requirements

### Requirement: Extension launches LSP server
The VS Code extension SHALL launch the LSP server as a child process and communicate with it over stdio using JSON-RPC. The extension SHALL resolve the server module path by checking for a bundled server first (`extension/server/out/server.js`), then falling back to the development path (`../server/out/server.js` relative to the extension root).

#### Scenario: Server startup
- **WHEN** the extension activates
- **THEN** it spawns the LSP server process and establishes a JSON-RPC connection over stdio

#### Scenario: Server crash
- **WHEN** the LSP server process exits unexpectedly
- **THEN** the extension reports an error to the user

#### Scenario: Development mode server resolution
- **WHEN** the extension is launched via F5 (extensionDevelopmentPath) and the bundled server does not exist
- **THEN** the extension resolves the server module from the parent directory (`../server/out/server.js`)

#### Scenario: Packaged mode server resolution
- **WHEN** the extension is installed as a .vsix package and the bundled server exists at `extension/server/out/server.js`
- **THEN** the extension uses the bundled server path
