## 1. Project Scaffolding

- [x] 1.1 Initialize monorepo: root `package.json` with workspaces, `tsconfig.json`, ESLint, Prettier, Vitest configs
- [x] 1.2 Create `server/` package with `package.json`, `tsconfig.json`, entry point `src/server.ts`
- [x] 1.3 Create `extension/` package with `package.json`, `tsconfig.json`, VS Code extension manifest (`package.json` with `contributes`, `activationEvents`), entry point `src/extension.ts`
- [x] 1.4 Add `vscode-languageserver` and `vscode-languageclient` dependencies to server and extension respectively

## 2. Lexer

- [x] 2.1 Define token types: keywords, identifiers, type keywords, literals, punctuation, operators
- [x] 2.2 Implement lexer that tokenizes Compact source into a token stream with positions (line, column, offset)
- [x] 2.3 Handle comments (skip `//` to end of line) and whitespace (skip, don't emit)
- [x] 2.4 Write lexer tests covering keywords, identifiers, literals, operators, comments, and position tracking

## 3. Parser — AST Types

- [x] 3.1 Define AST node types: `SourceFile`, `CircuitDefinition`, `ExternalCircuit`, `LedgerDeclaration`, `WitnessDeclaration`, `StructDefinition`, `EnumDefinition`, `ModuleDefinition`, `Constructor`, `ConstDeclaration`, `ContractDeclaration`, `Pragma`, `ImportDeclaration`, `IncludeDeclaration`
- [x] 3.2 Define type annotation AST nodes: `TypeReference`, `ParameterizedType`, `TupleType`
- [x] 3.3 Define parameter AST node with name and type annotation
- [x] 3.4 Ensure all AST nodes carry source position ranges

## 4. Parser — Declaration Parsing

- [x] 4.1 Implement top-level parser loop: consume tokens, dispatch to declaration parsers based on keyword
- [x] 4.2 Implement circuit definition parser: modifiers (`export`, `pure`), name, optional generics, parameter list, return type, body (skip body content by matching braces)
- [x] 4.3 Implement external circuit parser: same as circuit but ending with `;` instead of body
- [x] 4.4 Implement ledger declaration parser: modifiers (`export`, `sealed`), name, type, semicolon
- [x] 4.5 Implement witness declaration parser: modifiers, name, optional generics, parameter list, return type, semicolon
- [x] 4.6 Implement struct definition parser: modifiers, name, optional generics, field list with types
- [x] 4.7 Implement enum definition parser: modifiers, name, variant list
- [x] 4.8 Implement module definition parser: modifiers, name, optional generics, opening brace, nested declarations (recurse), closing brace
- [x] 4.9 Implement constructor parser: parameter list, body (skip content)
- [x] 4.10 Implement contract declaration parser: modifiers, name, opening brace, circuit signatures, closing brace
- [x] 4.11 Implement pragma, import, and include parsers
- [x] 4.12 Implement type annotation parser: simple types, parameterized types (`Uint<32>`, `Vector<10, Field>`), tuple types (`[Field, Boolean]`), user-defined generic types
- [x] 4.13 Implement basic error recovery: on unexpected token, skip to next declaration keyword and continue
- [x] 4.14 Write parser tests for each declaration type, type annotations, and error recovery

## 5. Symbol Table

- [x] 5.1 Define symbol table data structures: `Symbol` (name, kind, signature, position, scope), `Scope` (parent, children, symbols)
- [x] 5.2 Implement symbol table builder: walk AST, create scopes for file/module/circuit/block, register declarations
- [x] 5.3 Register built-in types (`Field`, `Boolean`, `Uint`, `Bytes`, `Vector`, `Opaque`, `Void`) and built-in functions (`map`, `fold`, `disclose`, `pad`, `default`) in the root scope
- [x] 5.4 Implement scope-aware symbol resolution: search current scope, then parent scopes up to file scope
- [x] 5.5 Write symbol table tests: scope nesting, declaration registration, resolution of defined and undefined identifiers

## 6. Hover Provider

- [x] 6.1 Implement hover handler: given a position, find the AST node at that position, look up the symbol, format and return the signature
- [x] 6.2 Format signatures for each declaration kind: circuit (with modifiers, params, return type), ledger (with type, modifiers), witness, struct (with fields), enum (with variants), const (with type if annotated), parameter
- [x] 6.3 Return no result for keywords, whitespace, and unresolved identifiers
- [x] 6.4 Write hover tests for each declaration kind and edge cases

## 7. Diagnostics Provider

- [x] 7.1 Implement syntax error diagnostics: convert parser errors to LSP `Diagnostic` objects with range, severity `Error`, message, and `source: "compact-lsp"`
- [x] 7.2 Implement undefined reference diagnostics: walk identifier references, check resolution against symbol table, report unresolved as `Error`
- [x] 7.3 Publish empty diagnostics array when no errors found (clears previous squiggles)
- [x] 7.4 Write diagnostics tests for syntax errors, undefined refs, built-in exemptions, and error clearing

## 8. LSP Server Wiring

- [x] 8.1 Set up LSP connection with `createConnection` and `TextDocuments` from `vscode-languageserver`
- [x] 8.2 Handle `initialize`: return capabilities (hover, full document sync, diagnostics)
- [x] 8.3 Handle `textDocument/didOpen` and `textDocument/didChange`: run analysis pipeline (parse → symbol table → diagnostics → publish)
- [x] 8.4 Handle `textDocument/didClose`: clean up stored state
- [x] 8.5 Handle `textDocument/hover`: delegate to hover provider
- [x] 8.6 Integration test: send LSP messages, verify hover and diagnostic responses

## 9. VS Code Extension

- [x] 9.1 Implement extension activation: register `compact` language, associate `.compact` file extension
- [x] 9.2 Implement LSP client: launch server process, establish stdio JSON-RPC connection using `vscode-languageclient`
- [x] 9.3 Handle server crash: report error to user
- [x] 9.4 Manual smoke test: open a `.compact` file in VS Code, verify hover and diagnostics work end-to-end
