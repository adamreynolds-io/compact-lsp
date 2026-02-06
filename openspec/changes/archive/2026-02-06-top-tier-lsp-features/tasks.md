## 1. Shared Utilities Extraction

- [x] 1.1 Create `server/src/utils.ts` extracting `findTokenAtPosition`, `findScopeForPosition`, `findChildScopeForDecl`, and `isPositionInRange` from existing providers
- [x] 1.2 Update hover.ts, definition.ts, references.ts, and completion.ts to import from utils.ts instead of their local copies
- [x] 1.3 Run existing tests to verify no regressions from the extraction

## 2. Document Symbols

- [x] 2.1 Create `server/src/documentSymbols.ts` with a `getDocumentSymbols` function that walks `sourceFile.declarations` and returns a hierarchical `DocumentSymbol[]` tree
- [x] 2.2 Map AST node kinds to LSP SymbolKind (CircuitDefinition/ExternalCircuit/WitnessDeclaration → Function, StructDefinition → Struct, EnumDefinition → Enum, LedgerDeclaration → Variable, ConstDeclaration → Constant, ModuleDefinition → Module, ContractDeclaration → Interface)
- [x] 2.3 Include children: struct fields, enum variants, module nested declarations, contract circuits
- [x] 2.4 Set `range` to the full declaration range and `selectionRange` to the name identifier range
- [x] 2.5 Include detail string (parameter list, return type, type annotation) for each symbol
- [x] 2.6 Wire `documentSymbolProvider: true` in server.ts capabilities and add `onDocumentSymbol` handler
- [x] 2.7 Create `server/src/__tests__/documentSymbols.test.ts` with tests covering all declaration types, nested modules, contracts, and empty documents

## 3. Rename Symbol

- [x] 3.1 Create `server/src/rename.ts` with `prepareRename` function that validates cursor position and returns range + placeholder text
- [x] 3.2 Implement `getRenameEdits` function that uses `findReferences` (with includeDeclaration) and returns `TextEdit[]` with the new name
- [x] 3.3 Reject rename for built-in types, built-in functions, keywords, whitespace, and unresolved identifiers in prepareRename
- [x] 3.4 Wire `renameProvider: { prepareProvider: true }` in server.ts capabilities and add `onPrepareRename` and `onRenameRequest` handlers
- [x] 3.5 Create `server/src/__tests__/rename.test.ts` with tests for: rename circuit with references, rename parameter within scope, shadowed symbols, for-loop variables, and rejection cases (built-ins, keywords)

## 4. Signature Help

- [x] 4.1 Create `server/src/signatureHelp.ts` with a `getSignatureHelp` function that finds the enclosing CallExpression at the cursor position
- [x] 4.2 Implement active parameter detection by counting commas between the call's open-paren and cursor position in the source text
- [x] 4.3 Resolve the callee to its declaration and extract parameter labels and signature string
- [x] 4.4 Handle edge cases: nested calls (innermost wins), unresolved callees (return undefined), zero-parameter calls
- [x] 4.5 Wire `signatureHelpProvider: { triggerCharacters: ['(', ','] }` in server.ts capabilities and add `onSignatureHelp` handler
- [x] 4.6 Create `server/src/__tests__/signatureHelp.test.ts` with tests for: basic call, comma advancement, nested calls, witness calls, built-in calls, unresolved callee, and no-param calls

## 5. Semantic Tokens

- [x] 5.1 Create `server/src/semanticTokens.ts` with a `getSemanticTokens` function that walks all lexer tokens and classifies each
- [x] 5.2 Define the token type legend: keyword, type, function, variable, parameter, struct, enum, namespace, number, string
- [x] 5.3 Define the modifier legend: declaration, readonly
- [x] 5.4 Map keyword tokens to `keyword`, TypeKeyword to `type`, NumberLiteral to `number`, StringLiteral to `string`, BooleanLiteral to `keyword`
- [x] 5.5 For Identifier tokens, resolve via symbol table and map SymbolKind to semantic type (circuit/witness/builtin-function → function, struct → struct, enum → enum, module/contract → namespace, parameter → parameter, const/ledger → variable)
- [x] 5.6 Apply `declaration` modifier when the token position matches the symbol's declaration range
- [x] 5.7 Apply `readonly` modifier for const and ledger symbols
- [x] 5.8 Encode tokens using LSP delta encoding (line delta, start delta, length, type index, modifier bitmask)
- [x] 5.9 Wire `semanticTokensProvider` in server.ts capabilities with the legend and full document support, add `onRequest` handler for `textDocument/semanticTokens/full`
- [x] 5.10 Create `server/src/__tests__/semanticTokens.test.ts` with tests for: keyword classification, type keywords, identifiers resolving to various symbol kinds, declaration modifier, readonly modifier, unresolved identifiers, and delta encoding correctness

## 6. Integration Verification

- [x] 6.1 Run the full test suite to verify all existing and new tests pass
- [x] 6.2 Run lint and format checks
