## Context

`utils.ts` is a pure utility module with no dependencies beyond types from `lexer.ts`, `ast.ts`, and `symbols.ts`. Tests can be written with simple setup — tokenize a string, build a symbol table, call the function, assert the result. The catch blocks in `server.ts` already have access to `connection.console.log()`.

## Goals / Non-Goals

**Goals:**
- Add direct unit tests for all 4 exported functions in `utils.ts`
- Add debug-level logging to the 3 silent catch blocks in `server.ts`

**Non-Goals:**
- Refactoring `utils.ts` or changing its API
- Changing error-handling behavior (errors remain non-fatal)

## Decisions

### 1. Test by parsing real Compact source

**Decision**: Test utils functions by parsing real Compact source strings (same pattern as other test files like `hover.test.ts`, `definition.test.ts`) rather than manually constructing mock Token/Scope objects.

**Rationale**: Parsing real source ensures tokens and scopes have realistic shapes. Manual mocks can drift from actual data structures.

### 2. Use connection.console.log for error logging

**Decision**: Use `connection.console.log()` rather than `console.error()` or a logging library.

**Rationale**: The LSP connection's console routes output to the editor's output channel (e.g. "Compact LSP" in VS Code), which is where developers look when debugging extension issues. `console.error` would go to stderr which is harder to find.
