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
