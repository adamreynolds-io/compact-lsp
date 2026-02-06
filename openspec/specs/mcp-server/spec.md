### Requirement: MCP server initializes with workspace
The MCP server SHALL accept a `--workspace` CLI argument specifying the root directory, scan it for `.compact` files, build a `WorkspaceIndex`, and start the stdio transport.

#### Scenario: Successful startup with workspace path
- **WHEN** the MCP server is launched with `--workspace /path/to/project`
- **THEN** it scans the directory recursively for `*.compact` files, parses each file, populates the workspace index, and starts listening on stdio

#### Scenario: Missing workspace argument
- **WHEN** the MCP server is launched without a `--workspace` argument
- **THEN** it exits with a non-zero exit code and prints a usage message to stderr

#### Scenario: Invalid workspace path
- **WHEN** the `--workspace` path does not exist or is not a directory
- **THEN** it exits with a non-zero exit code and prints an error message to stderr

### Requirement: MCP server exposes diagnostics tool
The MCP server SHALL expose a `compact_diagnostics` tool that runs the full diagnostic pipeline on a file and returns structured results.

#### Scenario: Diagnostics for a workspace file
- **WHEN** the `compact_diagnostics` tool is called with `{ "uri": "file:///path/to/file.compact" }`
- **THEN** the server reads the file from disk, runs the analysis pipeline (parse, symbol table, import resolution, lint, version diagnostics), and returns an array of diagnostics with message, severity, range, and optional code

#### Scenario: Diagnostics for inline source
- **WHEN** the `compact_diagnostics` tool is called with `{ "source": "module Foo { ... }" }`
- **THEN** the server analyzes the inline source (without cross-file resolution) and returns diagnostics

#### Scenario: File not found
- **WHEN** the `compact_diagnostics` tool is called with a URI that does not exist on disk
- **THEN** the tool returns an error indicating the file was not found

### Requirement: MCP server exposes hover tool
The MCP server SHALL expose a `compact_hover` tool that returns type information and documentation for a position in a file.

#### Scenario: Hover on a symbol
- **WHEN** the `compact_hover` tool is called with `{ "uri": "...", "line": 5, "column": 10 }`
- **THEN** the server reads and analyzes the file, calls the hover provider, and returns the hover contents (signature, documentation) and range

#### Scenario: Hover on empty space
- **WHEN** the `compact_hover` tool is called at a position with no symbol
- **THEN** the tool returns null

### Requirement: MCP server exposes definition tool
The MCP server SHALL expose a `compact_definition` tool that returns the location of a symbol's definition.

#### Scenario: Definition of a local symbol
- **WHEN** the `compact_definition` tool is called with a position on a symbol reference
- **THEN** the server returns the definition location (uri, range)

#### Scenario: Definition of an imported symbol
- **WHEN** the `compact_definition` tool is called on a symbol imported from another file
- **THEN** the server returns the definition location in the other file, including the target URI

### Requirement: MCP server exposes references tool
The MCP server SHALL expose a `compact_references` tool that returns all locations where a symbol is used.

#### Scenario: References for a symbol
- **WHEN** the `compact_references` tool is called with a position on a symbol
- **THEN** the server returns all reference locations across the workspace, each with uri and range

### Requirement: MCP server exposes completions tool
The MCP server SHALL expose a `compact_completions` tool that returns completion suggestions for a position.

#### Scenario: Completions at a position
- **WHEN** the `compact_completions` tool is called with a uri, line, and column
- **THEN** the server returns an array of completion items with label, kind, detail, and optional documentation

### Requirement: MCP server exposes document symbols tool
The MCP server SHALL expose a `compact_symbols` tool that returns the hierarchical symbol outline of a file.

#### Scenario: Symbols for a file
- **WHEN** the `compact_symbols` tool is called with `{ "uri": "..." }`
- **THEN** the server returns the document symbol tree with name, kind, range, and children

### Requirement: MCP server exposes rename tool
The MCP server SHALL expose a `compact_rename` tool that computes rename edits across the workspace.

#### Scenario: Rename a symbol
- **WHEN** the `compact_rename` tool is called with `{ "uri": "...", "line": 3, "column": 8, "newName": "bar" }`
- **THEN** the server returns an array of edits (each with uri, range, newText) that apply the rename across all affected files

#### Scenario: Rename at non-renamable position
- **WHEN** the `compact_rename` tool is called at a position that cannot be renamed (e.g., a keyword)
- **THEN** the tool returns an error indicating the position is not renamable

### Requirement: MCP server exposes signature help tool
The MCP server SHALL expose a `compact_signature` tool that returns parameter hints for a function call.

#### Scenario: Signature help inside a call
- **WHEN** the `compact_signature` tool is called at a position inside function call parentheses
- **THEN** the server returns the function signature, parameter list, and active parameter index

### Requirement: MCP server exposes analyze tool
The MCP server SHALL expose a `compact_analyze` tool that runs the full analysis pipeline and returns a combined summary (diagnostics, symbols, exports).

#### Scenario: Analyze a file
- **WHEN** the `compact_analyze` tool is called with `{ "uri": "..." }`
- **THEN** the server returns diagnostics, document symbols, and exported symbol names for the file

#### Scenario: Analyze inline source
- **WHEN** the `compact_analyze` tool is called with `{ "source": "..." }`
- **THEN** the server returns diagnostics and document symbols (no exports since there is no workspace context)

### Requirement: MCP server exposes file list resource
The MCP server SHALL expose a `compact://files` resource that lists all `.compact` files in the workspace.

#### Scenario: List workspace files
- **WHEN** a client reads the `compact://files` resource
- **THEN** the server returns a list of file URIs for all `.compact` files in the workspace index

### Requirement: MCP server exposes file content resource
The MCP server SHALL expose a `compact://file/{path}` resource template that returns a file's contents.

#### Scenario: Read a workspace file
- **WHEN** a client reads `compact://file/src/main.compact`
- **THEN** the server returns the file contents as text

#### Scenario: Read a non-existent file
- **WHEN** a client reads a `compact://file/{path}` where the path does not exist
- **THEN** the server returns an error

### Requirement: MCP server refreshes workspace state
The MCP server SHALL expose a `compact_refresh` tool that re-scans the workspace directory and rebuilds the index.

#### Scenario: Refresh after external file changes
- **WHEN** the `compact_refresh` tool is called
- **THEN** the server re-scans the workspace directory, re-parses all `.compact` files, and rebuilds the workspace index
- **AND** subsequent tool calls use the updated index
