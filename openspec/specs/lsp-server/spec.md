## ADDED Requirements

### Requirement: Server initializes with parser
The LSP server SHALL initialize the Compact parser on startup and respond to the client's `initialize` request with supported capabilities.

#### Scenario: Successful initialization
- **WHEN** the LSP server starts
- **THEN** it responds to the client's `initialize` request with supported capabilities (hover, diagnostics, full document sync)

### Requirement: Server uses full document sync
The LSP server SHALL use `TextDocumentSyncKind.Full` for document synchronization.

#### Scenario: Document opened
- **WHEN** the client sends `textDocument/didOpen`
- **THEN** the server parses the full document text and stores the resulting AST

#### Scenario: Document changed
- **WHEN** the client sends `textDocument/didChange` with full document content
- **THEN** the server reparses the full document text and replaces the stored AST

#### Scenario: Document closed
- **WHEN** the client sends `textDocument/didClose`
- **THEN** the server removes the document's AST and symbol table from memory

### Requirement: Server triggers analysis pipeline on document events
The LSP server SHALL run the analysis pipeline (parse → build symbol table → compute diagnostics) on `didOpen` and `didChange` events, then push diagnostics to the client.

#### Scenario: Document opened triggers full analysis
- **WHEN** a `textDocument/didOpen` event is received
- **THEN** the server parses the document, builds the symbol table, computes diagnostics, and publishes them via `textDocument/publishDiagnostics`

#### Scenario: Document changed triggers re-analysis
- **WHEN** a `textDocument/didChange` event is received
- **THEN** the server reparses, rebuilds the symbol table, recomputes diagnostics, and publishes updated diagnostics
