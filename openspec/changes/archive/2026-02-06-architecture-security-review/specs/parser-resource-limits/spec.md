## ADDED Requirements

### Requirement: Expression recursion depth limit
The parser SHALL enforce a maximum recursion depth of 200 for expression parsing. When the limit is exceeded, the parser SHALL emit a parse error and return an error expression node instead of recursing further.

#### Scenario: Normal expressions parse successfully
- **WHEN** the parser encounters an expression with nesting depth under 200
- **THEN** the expression SHALL parse normally with no depth-related errors

#### Scenario: Deeply nested expression hits depth limit
- **WHEN** the parser encounters an expression with nesting depth exceeding 200
- **THEN** the parser SHALL add a parse error with message containing "too deeply nested"
- **AND** the parser SHALL return an error expression node
- **AND** the parser SHALL NOT crash or throw an unhandled exception

### Requirement: File size limit
The server SHALL skip analysis for documents larger than 1,000,000 characters. When a document exceeds this limit, the server SHALL send a single warning diagnostic indicating the file is too large.

#### Scenario: Normal-sized file is analyzed
- **WHEN** a document with fewer than 1,000,000 characters is opened or changed
- **THEN** the server SHALL perform full analysis (parse, build symbol table, compute diagnostics)

#### Scenario: Oversized file is skipped
- **WHEN** a document with 1,000,000 or more characters is opened or changed
- **THEN** the server SHALL NOT call the parser
- **AND** the server SHALL send a warning diagnostic with a message indicating the file is too large for analysis
- **AND** the server SHALL clear any previous document state for that URI

### Requirement: Lookahead bounds
The parser's lookahead functions SHALL limit the number of tokens scanned during disambiguation. The `looksLikeArrowFunction()` function SHALL stop scanning after 500 tokens and return `false`.

#### Scenario: Arrow function lookahead within bounds
- **WHEN** the parser uses lookahead to check for an arrow function and the matching close-paren is within 500 tokens
- **THEN** the lookahead SHALL correctly identify whether the syntax is an arrow function

#### Scenario: Arrow function lookahead exceeds bounds
- **WHEN** the parser uses lookahead to check for an arrow function and no matching close-paren is found within 500 tokens
- **THEN** the lookahead SHALL return `false`
- **AND** the parser SHALL NOT scan beyond 500 tokens
