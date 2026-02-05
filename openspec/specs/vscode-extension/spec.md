## ADDED Requirements

### Requirement: Extension activates for Compact files
The VS Code extension SHALL activate when a `.compact` file is opened.

#### Scenario: Open a .compact file
- **WHEN** the user opens a file with the `.compact` extension
- **THEN** the extension activates and starts the LSP server

#### Scenario: No .compact file opened
- **WHEN** no `.compact` file is open
- **THEN** the extension does not activate and does not consume resources

### Requirement: Extension launches LSP server
The VS Code extension SHALL launch the LSP server as a child process and communicate with it over stdio using JSON-RPC.

#### Scenario: Server startup
- **WHEN** the extension activates
- **THEN** it spawns the LSP server process and establishes a JSON-RPC connection over stdio

#### Scenario: Server crash
- **WHEN** the LSP server process exits unexpectedly
- **THEN** the extension reports an error to the user

### Requirement: Extension registers Compact language
The VS Code extension SHALL register the `compact` language ID and associate it with `.compact` file extensions.

#### Scenario: Language registration
- **WHEN** the extension is installed
- **THEN** VS Code recognizes `.compact` files as the `compact` language

### Requirement: Extension forwards LSP capabilities
The VS Code extension SHALL use `vscode-languageclient` to forward hover and diagnostics capabilities between VS Code and the LSP server.

#### Scenario: Hover forwarding
- **WHEN** the user hovers over a symbol in a `.compact` file
- **THEN** the extension forwards the hover request to the LSP server and displays the response

#### Scenario: Diagnostics display
- **WHEN** the LSP server publishes diagnostics
- **THEN** VS Code displays them as squiggles in the editor and entries in the Problems panel
