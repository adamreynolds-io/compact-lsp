## ADDED Requirements

### Requirement: Parser catch blocks record errors
The parser's catch blocks SHALL capture exception details and add them to the parse errors array, instead of silently swallowing exceptions.

#### Scenario: Body parsing catch block records error
- **WHEN** the body parsing loop (around `collectStatement`) throws an unrecoverable exception
- **THEN** the parser SHALL add a parse error to `this.errors` with a message that includes the word "internal" or "recovery"
- **AND** the parser SHALL still perform fallback brace matching as before

#### Scenario: Statement parsing catch block records error
- **WHEN** the statement parsing (`collectStatement`) throws an exception
- **THEN** the parser SHALL add a parse error to `this.errors` with a message describing the recovery
- **AND** the parser SHALL still recover to the next statement boundary as before

#### Scenario: Exception message is preserved when available
- **WHEN** a caught exception has a `message` property
- **THEN** the recorded parse error SHALL include that message for diagnostic purposes

### Requirement: Silent catch blocks log errors at debug level
The server SHALL log a message via `connection.console.log()` in each catch block that currently silently swallows errors during workspace scanning and file watching. Errors SHALL remain non-fatal — the server continues operating after logging.

#### Scenario: Workspace folder scan fails
- **WHEN** `scanWorkspaceFolder()` throws an error while scanning a directory
- **THEN** the error is logged with context (e.g. folder path)
- **AND** the server continues initialization without crashing

#### Scenario: File read fails during directory scan
- **WHEN** `fs.readFileSync()` throws while reading a `.compact` file during scan
- **THEN** the error is logged with the file path
- **AND** the scan continues to the next file

#### Scenario: File watch update fails
- **WHEN** reading a changed file in `onDidChangeWatchedFiles` throws
- **THEN** the error is logged with the file URI
- **AND** the watcher continues processing other changes
