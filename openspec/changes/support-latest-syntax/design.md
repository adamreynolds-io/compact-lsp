## Context

The LSP's hand-written lexer/parser targets Compact ~v0.14. The language is now at v0.21 with significant syntax additions. Users editing modern `.compact` files get false parse errors and broken IDE features. The lexer, parser, AST, symbol table, and all providers need updates.

Current architecture: `lexer.ts` → `parser.ts` → `ast.ts` → `symbols.ts` → providers. Full document sync, no incremental reparsing.

## Goals / Non-Goals

**Goals:**
- Parse all Compact v0.21 syntax without false errors
- Maintain all existing LSP features (hover, definition, references, completion, etc.) for new syntax constructs
- Register new built-in functions and ledger ADT types so completion/hover work out of the box
- Keep error recovery working for partially-written new syntax

**Non-Goals:**
- Multi-file import resolution (resolving `import` to actual files) — deferred
- Semantic type checking (we parse types but don't validate them)
- Full compiler parity — we aim for parse-level correctness, not semantic analysis
- Division operator `/` (not in the language; `//` is comments)

## Decisions

### 1. Phased implementation: Lexer → AST → Parser → Symbols → Providers

**Rationale:** Each layer depends on the previous. Lexer changes (new tokens) must land before the parser can consume them. AST types must exist before the parser can produce them. Symbol table updates depend on new AST nodes. Providers adapt last.

**Alternative considered:** Big-bang change — rejected because it's harder to test incrementally and debug.

### 2. Extend existing AST types with union variants rather than deep restructuring

**Rationale:** Minimize blast radius. For example:
- `ImportDeclaration` gains optional `specifiers`, `prefix`, and `source` fields rather than splitting into separate node types
- `ConstStatement` and `Parameter` gain an optional `pattern` field (union of `string | TuplePattern | StructPattern`) rather than replacing `name`
- `ArrowFunction.body` becomes `Expression | Statement[]` rather than a new node type
- `AssertStatement` gains an optional `message` field

**Alternative considered:** Separate AST node types per import variant — rejected as it fragments matching logic across all providers.

### 3. New AST nodes only where semantically distinct

New node types needed:
- `SpreadExpression { kind, argument: Expression }` — for `...expr` in tuples and struct construction
- `BytesLiteral { kind, elements: Expression[] }` — for `Bytes[1, 2, 3]`
- `NewTypeDeclaration { kind, name, generics, typeExpr, isExport }` — semantically different from `ConstDeclaration`
- `ExportList { kind, names: { name, range }[] }` — for `export { a, b }`
- `TuplePattern { kind, elements: (string | null)[] }` and `StructPattern { kind, fields: { key, alias? }[] }` — for destructuring

### 4. Lexer: add `from` and `prefix` as contextual keywords

**Rationale:** `from` and `prefix` are only keywords in import context. Making them full keywords would break existing code using them as identifiers. The lexer emits them as `Identifier` tokens; the parser checks the text value when parsing imports.

**Alternative considered:** New token kinds — rejected because they'd break backward compatibility for identifier usage.

### 5. Number literal parsing in the lexer

The lexer already handles decimal numbers. Extend `scanNumber()` to detect `0x`, `0b`, `0o` prefixes and consume the appropriate digit sets. The token kind stays `NumberLiteral`; the value string preserves the original text (e.g., `"0xff"`).

### 6. Single-quoted strings share `StringLiteral` token kind

**Rationale:** No semantic difference between `'hello'` and `"hello"`. The lexer accepts both quote styles and strips quotes for the value. Same token kind, same AST handling.

### 7. Built-in registry as a data-driven table

Expand `initializeRootScope()` in `symbols.ts` with a structured table of built-in functions and ledger ADT type methods. Each entry includes name, generic parameters, parameter types, and return type. This enables hover, completion, and signature help without hardcoding provider logic.

**Structure:**
```
{ name, generics?, params: { name, type }[], returnType, description? }
```

### 8. `Bytes[...]` parsed as a dedicated expression node

**Rationale:** `Bytes[1, 2, 3]` looks like an index expression on an identifier, but it's semantically a literal constructor. The parser detects `Identifier("Bytes") + [` and switches to `BytesLiteral` parsing. This avoids ambiguity with regular index expressions.

## Risks / Trade-offs

- **[Scope creep]** → The proposal lists many features. Mitigate by implementing in priority order (imports, number literals, single-quoted strings first) and treating each capability as independently shippable.
- **[AST backward compatibility]** → Adding optional fields to existing AST nodes means providers must handle `undefined` for new fields. → Mitigate by defaulting new optional fields and only extending provider logic where the feature requires it.
- **[Parser complexity]** → Destructuring patterns add significant lookahead complexity (is `[` starting a tuple literal or destructuring?). → Mitigate by using context: destructuring only appears after `const` keyword or in parameter position.
- **[Incomplete language spec]** → We're reverse-engineering syntax from compiler tests, not a formal grammar. → Mitigate by testing against real `.compact` files from the Compact repositories.
- **[Test volume]** → Each new construct needs lexer, parser, symbol table, and provider tests. → Mitigate by writing focused unit tests per layer, not end-to-end for every combination.
