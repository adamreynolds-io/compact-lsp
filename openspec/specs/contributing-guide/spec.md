## Requirements

### Requirement: Contributing guide includes architecture overview
The CONTRIBUTING guide SHALL describe the server architecture: lexer → parser → AST → symbol table → LSP providers pipeline.

#### Scenario: Contributor understands the data flow
- **WHEN** a contributor reads the architecture section
- **THEN** they understand how a `.compact` file is processed from raw text through lexing, parsing, symbol table construction, and into LSP provider responses

### Requirement: Contributing guide describes module responsibilities
The CONTRIBUTING guide SHALL list each server module (lexer.ts, parser.ts, ast.ts, symbols.ts, and each provider) with a brief description of its responsibility.

#### Scenario: Contributor knows where to find code
- **WHEN** a contributor wants to modify hover behavior
- **THEN** they can look up the module list and find that `hover.ts` is the hover provider

### Requirement: Contributing guide includes development workflow
The CONTRIBUTING guide SHALL describe the development workflow: how to run tests, how to lint/format, how to test in VS Code, and how to add a new LSP feature.

#### Scenario: Contributor knows how to run tests
- **WHEN** a contributor reads the development workflow
- **THEN** they know to run `npm test` for the full suite and `npx vitest run <file>` for individual test files

### Requirement: Contributing guide includes testing conventions
The CONTRIBUTING guide SHALL describe testing patterns: where tests live, how to write provider tests using the parse-and-query pattern, and the test helper utilities available.

#### Scenario: Contributor can write a new test
- **WHEN** a contributor wants to test a new LSP provider
- **THEN** they understand the pattern of parsing a Compact source string and calling the provider function with position coordinates

### Requirement: Contributing guide includes code style conventions
The CONTRIBUTING guide SHALL reference ESLint and Prettier configuration and the commands to run them.

#### Scenario: Contributor formats code correctly
- **WHEN** a contributor reads the code style section
- **THEN** they know to run `npm run lint` and `npm run format` before committing
