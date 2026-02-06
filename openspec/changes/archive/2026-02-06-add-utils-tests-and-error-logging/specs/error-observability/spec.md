## MODIFIED Requirements

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
