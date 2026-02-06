## MODIFIED Requirements

### Requirement: Server initializes with parser
The LSP server SHALL initialize the Compact parser on startup and respond to the client's `initialize` request with supported capabilities.

#### Scenario: Successful initialization
- **WHEN** the LSP server starts
- **THEN** it responds to the client's `initialize` request with supported capabilities (hover, diagnostics, full document sync, definition, references, completion)

## ADDED Requirements

### Requirement: Server handles textDocument/definition requests
The LSP server SHALL handle `textDocument/definition` requests by delegating to the go-to-definition provider.

#### Scenario: Definition request for valid symbol
- **WHEN** the client sends `textDocument/definition` with a position on an identifier
- **THEN** the server returns the location of the symbol's declaration

#### Scenario: Definition request for non-symbol position
- **WHEN** the client sends `textDocument/definition` with a position on whitespace or a keyword
- **THEN** the server returns no result

### Requirement: Server handles textDocument/references requests
The LSP server SHALL handle `textDocument/references` requests by delegating to the find-references provider.

#### Scenario: References request for a symbol
- **WHEN** the client sends `textDocument/references` with a position on an identifier
- **THEN** the server returns all locations where that symbol is referenced

#### Scenario: References request with includeDeclaration
- **WHEN** the request context includes `includeDeclaration: true`
- **THEN** the declaration location is included in the results

### Requirement: Server handles textDocument/completion requests
The LSP server SHALL handle `textDocument/completion` requests by delegating to the auto-completion provider.

#### Scenario: Completion request inside circuit body
- **WHEN** the client sends `textDocument/completion` with a position inside a circuit body
- **THEN** the server returns a list of completion items for symbols visible in that scope

#### Scenario: Completion request at top level
- **WHEN** the client sends `textDocument/completion` with a position at the top level
- **THEN** the server returns a list of completion items for file-level symbols and built-ins
