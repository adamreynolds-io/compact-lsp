## MODIFIED Requirements

### Requirement: Server initializes with parser
The LSP server SHALL initialize the Compact parser on startup, scan the workspace for `.compact` files, build the workspace index, and respond to the client's `initialize` request with supported capabilities.

#### Scenario: Successful initialization
- **WHEN** the LSP server starts
- **THEN** it responds to the client's `initialize` request with supported capabilities (hover, diagnostics, full document sync, definition, references, completion, folding ranges)

#### Scenario: Workspace scanning on initialize
- **WHEN** the LSP server receives workspace folder paths in the initialize params
- **THEN** it scans those folders for `*.compact` files, parses each, and populates the workspace index

## ADDED Requirements

### Requirement: Server handles foldingRange requests
The LSP server SHALL register `foldingRangeProvider: true` in its capabilities and handle `textDocument/foldingRange` requests by delegating to the folding ranges provider.

#### Scenario: FoldingRange request for open document
- **WHEN** a `textDocument/foldingRange` request is received for an open document
- **THEN** the server retrieves the cached parse result, calls `getFoldingRanges()`, and returns the result

#### Scenario: FoldingRange request for unknown document
- **WHEN** a `textDocument/foldingRange` request is received for a document not in the document state
- **THEN** the server returns an empty array
