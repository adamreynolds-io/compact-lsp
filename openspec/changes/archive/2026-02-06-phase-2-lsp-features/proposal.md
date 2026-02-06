## Why

The POC LSP server only provides hover and syntax-error diagnostics. Developers still can't navigate code (go-to-definition, find references), get completions while typing, or see errors inside circuit/constructor bodies. Adding these features turns the LSP from a demo into a genuinely useful development tool. Expression parsing is the prerequisite — the current parser skips bodies entirely, so none of these features can work inside function bodies today.

## What Changes

- Add full expression and statement parsing inside circuit and constructor bodies (if/else, for, assignments, function calls, operators, return, assert)
- Add go-to-definition: jump from any identifier usage to its declaration
- Add find-all-references: find every usage of a symbol across the file
- Add auto-completion: suggest symbols in scope when typing identifiers
- Extend the symbol table to track identifier references (usages) with positions, enabling bidirectional declaration↔reference lookups
- Extend the LSP server to handle `textDocument/definition`, `textDocument/references`, and `textDocument/completion` requests
- Extend diagnostics to report errors found inside expression bodies (undefined refs in bodies, not just at declaration level)

## Capabilities

### New Capabilities
- `expression-parser`: Full expression and statement parsing — if/else, for/of, assignments, binary/unary operators, function calls, member access, return, assert. Produces AST nodes inside circuit/constructor bodies.
- `go-to-definition`: Go-to-definition provider — given a cursor position on an identifier, return the location of its declaration.
- `find-references`: Find-all-references provider — given a cursor position on an identifier, return all locations where that symbol is referenced.
- `auto-completion`: Auto-completion provider — given a cursor position, return a list of symbols visible in the current scope with their kinds and signatures.

### Modified Capabilities
- `parser`: Add expression/statement AST nodes and parsing inside circuit/constructor bodies (currently skipped via brace matching)
- `symbol-table`: Track identifier references (usages) with positions and enclosing scope, enabling resolution for go-to-def and find-refs
- `lsp-server`: Register and handle `textDocument/definition`, `textDocument/references`, and `textDocument/completion` capabilities
- `diagnostics`: Report undefined-reference errors found inside expression bodies

## Impact

- `server/src/ast.ts`: New AST node types for expressions and statements
- `server/src/lexer.ts`: No changes expected (tokens already cover expression operators)
- `server/src/parser.ts`: Major addition — expression/statement parsers, error recovery at statement boundaries
- `server/src/symbols.ts`: Add reference tracking, extend scope builder to walk expression bodies
- `server/src/hover.ts`: Minor — may benefit from richer AST but no direct changes
- `server/src/diagnostics.ts`: Extend to check references inside bodies
- `server/src/server.ts`: Add definition, references, and completion handlers
- New files: `server/src/definition.ts`, `server/src/references.ts`, `server/src/completion.ts`
- Test files: New tests for each provider, extended parser/symbol tests
