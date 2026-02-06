## Context

The LSP server has 6 providers (hover, definition, references, completion, diagnostics, text sync) built on a hand-written lexer → parser → AST → symbol table pipeline. Each provider follows the same pattern: a standalone module exporting a pure function that takes parsed state and cursor position, returning LSP-shaped results. The server wires providers to LSP handlers in `server.ts`.

The existing infrastructure — scope hierarchy, reference list, `resolveSymbol`, `formatSignature`, `findScopeForPosition`, `findTokenAtPosition` — provides most of what the four new features need. The main gaps are: (1) no AST walker that yields a flat symbol tree for document symbols, (2) rename needs the existing find-references logic plus a text-edit wrapper, (3) signature help needs to locate the enclosing CallExpression and determine active parameter index, (4) semantic tokens needs a full-document token walk mapping each token to an LSP semantic classification.

## Goals / Non-Goals

**Goals:**
- Add document symbols, rename, signature help, and semantic tokens providers
- Follow the existing provider pattern (pure functions, separate modules, wired in server.ts)
- Reuse existing infrastructure (scope, references, AST, lexer) wherever possible
- Add comprehensive test coverage matching existing test patterns

**Non-Goals:**
- Multi-file rename or workspace-wide symbol search (single-document only)
- Incremental semantic token updates (full document on each change is fine for typical file sizes)
- Semantic tokens for comments or string contents (tokens inside string literals are not classified)
- Formatting or code actions (separate future work)

## Decisions

### 1. Document Symbols: Walk AST declarations, not scope tree

**Decision**: Walk `sourceFile.declarations` recursively to build `DocumentSymbol[]` hierarchy.

**Rationale**: The scope tree merges built-ins and loses ordering. The AST preserves the source structure exactly as the user wrote it (modules containing circuits, etc.), which is what the outline panel needs. Mapping AST node kinds to LSP `SymbolKind` is straightforward (CircuitDefinition → Function, StructDefinition → Struct, etc.).

**Alternative considered**: Walking the scope tree. Rejected because scope contains built-ins, uses synthetic names like `<constructor>`, and doesn't preserve source ordering.

### 2. Rename: Compose existing find-references + prepare step

**Decision**: Implement rename by reusing `findReferences` (with `includeDeclaration: true`) and wrapping results as `TextEdit[]` in a `WorkspaceEdit`. Add a `prepareRename` handler that validates the cursor is on a renameable symbol (not built-in, not keyword).

**Rationale**: The rename operation is conceptually "find all references + replace text". The reference infrastructure already handles scope-correct resolution. Adding prepare-rename gives the editor a chance to show the current name and reject invalid positions before the user types.

**Alternative considered**: Building rename from scratch. Rejected — would duplicate all the scope resolution logic already in references.ts.

### 3. Signature Help: Find enclosing CallExpression by walking AST

**Decision**: When triggered (by `(` or `,`), find the CallExpression that encloses the cursor position by walking the AST. Resolve the callee to its declaration to get parameter info. Determine the active parameter by counting commas before the cursor position in the source text between the open-paren and cursor.

**Rationale**: The AST already has `CallExpression` nodes with `callee` and `args`. We need the cursor to be inside the call's argument list to trigger signature help. Counting commas in the raw source is simpler and more robust than trying to match against parsed argument positions (which may be incomplete during typing).

**Alternative considered**: Using token positions to find the matching open-paren. This works but the AST approach gives us callee resolution for free.

### 4. Semantic Tokens: Classify from lexer tokens + symbol resolution

**Decision**: Walk all tokens from the lexer. For each token, determine its semantic token type:
- Keywords → `keyword`
- TypeKeyword → `type`
- NumberLiteral → `number`
- StringLiteral → `string`
- BooleanLiteral → `keyword` (or a custom `boolean` type, but keyword is standard)
- Identifier → resolve via symbol table to determine: `function` (circuit/witness/builtin-function), `struct` (struct), `enum` (enum), `variable` (ledger/const/parameter), `type` (builtin-type), `namespace` (module/contract)
- Operators/punctuation → not classified (editor handles these)

Use LSP's `SemanticTokensLegend` to register token types and modifiers. Support modifiers: `declaration` (at definition site), `readonly` (const/ledger).

**Rationale**: The lexer gives us every token with position. Symbol resolution gives us the semantic classification for identifiers. This approach is simple and covers the whole document in one pass.

**Alternative considered**: Walking the AST instead of tokens. Rejected because the AST doesn't have token-level granularity for keywords/operators, and we'd need to reconstruct positions.

### 5. Shared helpers: Extract `findTokenAtPosition` and `findScopeForPosition`

**Decision**: Extract the duplicated `findTokenAtPosition`, `findScopeForPosition`, `findChildScopeForDecl`, and `isPositionInRange` helpers into a shared utility module (`utils.ts`), since they're currently copy-pasted across hover.ts, definition.ts, references.ts, and completion.ts.

**Rationale**: Four providers already duplicate these helpers. Adding four more would make it six. A single shared module reduces duplication and makes future fixes apply everywhere.

### 6. Trigger characters for signature help

**Decision**: Register `(` and `,` as trigger characters. Retrigger on `,` to advance the active parameter.

**Rationale**: These are the standard triggers for parameter hints. `)` dismisses the signature help automatically (VS Code handles this).

## Risks / Trade-offs

- **Signature help with incomplete/malformed expressions** → The AST may not have a valid CallExpression when the user is mid-typing. Mitigation: Fall back to token-level scanning (find matching open-paren, count commas) when the AST walk fails.
- **Semantic tokens performance on large files** → Full re-tokenization + symbol resolution on every edit. Mitigation: This is already the pattern for all providers (full document sync). Compact files are typically small. Can add incremental support later if needed.
- **Rename of symbols that shadow others** → A rename could surface names that were previously shadowed. Mitigation: The scope-based resolution in findReferences already handles this correctly — it only finds references that resolve to the exact same SymbolInfo.
