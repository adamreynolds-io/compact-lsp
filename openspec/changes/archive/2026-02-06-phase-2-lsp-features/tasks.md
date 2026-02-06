## 1. Expression & Statement AST Nodes

- [x] 1.1 Add expression AST node types: IdentifierExpression, LiteralExpression, BinaryExpression, UnaryExpression, ConditionalExpression, CallExpression, MemberExpression, IndexExpression, TupleLiteral, StructConstruction, CastExpression, ArrowFunction, AssignmentExpression
- [x] 1.2 Add statement AST node types: ConstStatement, ReturnStatement, IfStatement, ForStatement, AssertStatement, ExpressionStatement, BlockStatement, ErrorStatement
- [x] 1.3 Add body representation to CircuitDefinition and ConstructorDeclaration (list of statement nodes replacing the skipped token run)

## 2. Expression Parser (Pratt)

- [x] 2.1 Implement Pratt parser core: parseExpression(minPrecedence) with prefix and infix dispatch
- [x] 2.2 Implement prefix parsers: identifiers, numeric/boolean/string literals, unary `!`, parenthesized expressions, tuple literals `[...]`
- [x] 2.3 Implement infix parsers: binary operators (`+`, `-`, `*`, `==`, `!=`, `<`, `>`, `<=`, `>=`, `&&`, `||`, `..`), member access `.`, index access `[`, call `(`
- [x] 2.4 Implement cast expression (`as` keyword)
- [x] 2.5 Implement struct construction (`Name { field: expr, ... }`)
- [x] 2.6 Implement conditional (ternary) expression (`cond ? a : b`)
- [x] 2.7 Implement assignment expressions (`=`, `+=`, `-=`)
- [x] 2.8 Implement arrow function expressions (`(params) => body`)
- [x] 2.9 Add expression parser tests: precedence, associativity, all expression types

## 3. Statement Parser

- [x] 3.1 Implement parseBody: parse `{ ... }` into a list of statements, replacing skipBody calls
- [x] 3.2 Implement statement parsers: const binding, return, if/else, for/of, assert, expression statement, block statement
- [x] 3.3 Implement statement-level error recovery: synchronize at `;` or `}`, emit ErrorStatement, continue
- [x] 3.4 Implement fallback to brace matching on unrecoverable body errors
- [x] 3.5 Add statement parser tests: each statement type, error recovery scenarios

## 4. Symbol Table Enhancements

- [x] 4.1 Add Reference type (`{ name, range, scope }`) and references list on file scope
- [x] 4.2 Extend symbol table builder to walk expression AST nodes and collect identifier references
- [x] 4.3 Register local variables from ConstStatement in the enclosing scope
- [x] 4.4 Add block scopes for BlockStatement and for-loop body scopes for ForStatement
- [x] 4.5 Add symbol table tests: reference tracking, local variable registration, block scoping, for-loop scoping

## 5. Go-to-Definition Provider

- [x] 5.1 Create `server/src/definition.ts`: find token at position, resolve to declaration via scope chain, return declaration source range
- [x] 5.2 Handle edge cases: cursor on declaration name (return self), built-in types (no result), keywords (no result), unresolved identifiers (no result)
- [x] 5.3 Add go-to-definition tests: circuit references, parameter references, local variables, ledgers, structs, enums, no-result cases

## 6. Find-References Provider

- [x] 6.1 Create `server/src/references.ts`: resolve symbol at cursor, scan reference list for matching declarations, return all locations
- [x] 6.2 Handle includeDeclaration option: include or exclude the declaration itself
- [x] 6.3 Handle edge cases: keywords, whitespace, unresolved identifiers return empty list
- [x] 6.4 Add find-references tests: circuits, parameters, local variables, ledgers, structs, include/exclude declaration, no-result cases

## 7. Auto-Completion Provider

- [x] 7.1 Create `server/src/completion.ts`: determine enclosing scope at cursor, walk scope chain collecting all visible symbols
- [x] 7.2 Map symbols to CompletionItems with appropriate CompletionItemKind and detail strings
- [x] 7.3 Handle edge cases: empty file (built-ins only), top-level position, module-scoped position
- [x] 7.4 Add completion tests: parameters in scope, file-level declarations, built-ins, local variables, module-scoped symbols, empty file

## 8. LSP Server Wiring

- [x] 8.1 Register definition, references, and completion capabilities in server initialization
- [x] 8.2 Add `textDocument/definition` request handler delegating to definition provider
- [x] 8.3 Add `textDocument/references` request handler delegating to references provider
- [x] 8.4 Add `textDocument/completion` request handler delegating to completion provider
- [x] 8.5 Extend diagnostics to report undefined references from the reference list (references that fail scope resolution)

## 9. Integration & Validation

- [x] 9.1 Add integration tests: full pipeline from source text through parse, symbols, to each new provider
- [x] 9.2 Verify existing hover and diagnostics tests still pass with the new body parsing
- [x] 9.3 Run full test suite, lint, and format checks
- [x] 9.4 Manual smoke test in VS Code: go-to-definition, find-references, and completion on a sample .compact file
