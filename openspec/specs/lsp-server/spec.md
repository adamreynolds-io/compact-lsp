## MODIFIED Requirements

### Requirement: Server initializes with parser
The LSP server SHALL initialize the Compact parser on startup, scan the workspace for `.compact` files, build the workspace index, and respond to the client's `initialize` request with supported capabilities.

#### Scenario: Successful initialization
- **WHEN** the LSP server starts
- **THEN** it responds to the client's `initialize` request with supported capabilities (hover, diagnostics, full document sync, definition, references, completion, folding ranges)

#### Scenario: Workspace scanning on initialize
- **WHEN** the LSP server receives workspace folder paths in the initialize params
- **THEN** it scans those folders for `*.compact` files, parses each, and populates the workspace index

### Requirement: Server triggers analysis pipeline on document events
The LSP server SHALL run the analysis pipeline (parse → build symbol table → resolve imports → compute diagnostics) on `didOpen` and `didChange` events, then push diagnostics to the client.

#### Scenario: Document opened triggers full analysis
- **WHEN** a `textDocument/didOpen` event is received
- **THEN** the server parses the document, builds the symbol table, resolves imports via the workspace index, computes diagnostics (including import diagnostics), and publishes them via `textDocument/publishDiagnostics`

#### Scenario: Document changed triggers re-analysis
- **WHEN** a `textDocument/didChange` event is received
- **THEN** the server reparses, rebuilds the symbol table, updates the workspace index entry, resolves imports, recomputes diagnostics, and publishes updated diagnostics

#### Scenario: Document changed triggers dependent file re-analysis
- **WHEN** a file's exports change (symbols added, removed, or renamed)
- **THEN** the server re-analyzes import diagnostics for all files that import from the changed module

## ADDED Requirements

### Requirement: Server registers workspace folder support
The LSP server SHALL declare workspace folder support in its capabilities and read workspace folder paths from the initialize params.

#### Scenario: Workspace folders provided
- **WHEN** the client provides `workspaceFolders` in the initialize params
- **THEN** the server uses those paths for the initial workspace scan

#### Scenario: No workspace folders
- **WHEN** the client provides no workspace folders (e.g., single file opened)
- **THEN** the server operates in single-file mode without workspace indexing

### Requirement: Server registers file watcher
The LSP server SHALL register a file system watcher for `**/*.compact` files to detect creation, deletion, and modification of files not currently open.

#### Scenario: File created outside editor
- **WHEN** a new `.compact` file is created in the workspace (not via the editor)
- **THEN** the server parses the file and adds it to the workspace index

#### Scenario: File deleted outside editor
- **WHEN** a `.compact` file is deleted from the workspace
- **THEN** the server removes it from the workspace index

#### Scenario: File modified outside editor
- **WHEN** a `.compact` file is modified outside the editor (and is not currently open)
- **THEN** the server re-parses the file and updates its workspace index entry

### Requirement: Server handles foldingRange requests
The LSP server SHALL register `foldingRangeProvider: true` in its capabilities and handle `textDocument/foldingRange` requests by delegating to the folding ranges provider.

#### Scenario: FoldingRange request for open document
- **WHEN** a `textDocument/foldingRange` request is received for an open document
- **THEN** the server retrieves the cached parse result, calls `getFoldingRanges()`, and returns the result

#### Scenario: FoldingRange request for unknown document
- **WHEN** a `textDocument/foldingRange` request is received for a document not in the document state
- **THEN** the server returns an empty array
