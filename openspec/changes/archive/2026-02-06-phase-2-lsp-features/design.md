## Context

The POC LSP server (Phase 1) parses Compact declarations and their signatures but skips circuit/constructor bodies entirely via brace matching. The symbol table tracks declarations and parameters but not identifier references. This limits the server to hover and syntax-error diagnostics at the declaration level only.

Phase 2 adds expression parsing, go-to-definition, find-references, and auto-completion — transforming the LSP from a demo into a productive tool. Expression parsing is the critical enabler: without AST nodes inside bodies, the other three features have nothing to work with.

Existing specs cover: parser (declaration-level), symbol-table (declarations + scopes), hover, diagnostics, lsp-server, and vscode-extension. The lexer already tokenizes all operators and punctuation needed for expressions — no lexer changes required.

## Goals / Non-Goals

**Goals:**
- Parse expressions and statements inside circuit and constructor bodies into full AST nodes
- Support: const bindings, if/else, for/of, return, assert, assignments, binary/unary operators, function calls, member access, index access, struct construction, tuple literals, arrow functions
- Track identifier references in the symbol table with positions and enclosing scope
- Provide go-to-definition (jump to declaration from any usage)
- Provide find-all-references (find all usages of a symbol within the file)
- Provide auto-completion (suggest in-scope symbols at cursor position)
- Report undefined-reference diagnostics inside expression bodies
- Add statement-level error recovery (synchronize at `;` and `}`)

**Non-Goals:**
- Type inference or type checking (only annotated types, no inference from expressions)
- Cross-file resolution (imports/includes still not resolved)
- Generic instantiation or resolution
- Rename symbol (future feature)
- Signature help / parameter hints (future feature)
- Incremental reparsing (still full reparse on every change)
- Semantic analysis beyond undefined references (no type errors, domain checks, etc.)

## Decisions

### 1. Pratt parser for expressions

Use a Pratt parser (top-down operator precedence) for expression parsing, integrated into the existing recursive descent parser.

**Rationale:** Pratt parsing handles operator precedence and associativity naturally without separate grammar rules per precedence level. It composes cleanly with the existing recursive descent structure — the Pratt `parseExpression(minPrecedence)` function is called from statement parsers. This is the standard approach in hand-written parsers (TypeScript, Rust, Lua all use this).

**Alternatives considered:**
- Recursive descent with explicit precedence levels (one function per level): verbose, harder to maintain as operators are added
- Shunting-yard: only handles binary expressions, doesn't integrate with the rest of the parser

**Precedence levels (low to high):**
1. `||` (logical or)
2. `&&` (logical and)
3. `==`, `!=` (equality)
4. `<`, `>`, `<=`, `>=` (comparison)
5. `..` (range)
6. `+`, `-` (additive)
7. `*` (multiplicative)
8. `as` (cast)
9. `!` (unary prefix)
10. `.` (member access), `[` (index), `(` (call) — postfix

### 2. Replace skipBody with parseBody, keeping skipBody as fallback

Replace `skipBody()` calls with `parseBody()` which parses a `{ ... }` block into a list of statement AST nodes. Keep `skipBody()` as a fallback during error recovery — if the statement parser encounters an unrecoverable error inside a body, it can fall back to brace matching to avoid losing the rest of the file.

**Rationale:** Graceful degradation. Broken code inside one circuit body shouldn't prevent parsing the next declaration. The fallback ensures we never get worse than Phase 1 behavior.

### 3. Statement-level error recovery

On parse errors inside a body, synchronize at the next `;` or `}` boundary, emit an error node, and continue parsing statements. This is more granular than Phase 1's declaration-level recovery.

**Rationale:** Users are editing inside bodies most of the time. Statement-level recovery keeps the rest of the body parseable even when one statement is broken, which is critical for hover and completion to work while typing.

### 4. Reference collector walks expression AST nodes

Extend the symbol table builder to walk expression AST nodes (not just declarations). When it encounters an `Identifier` expression node, record it as a reference: `{ name, position, scope }`. Store references in a flat list on the file scope for efficient lookup.

**Rationale:** A flat reference list is simpler than per-scope tracking and sufficient for single-file analysis. Go-to-definition resolves the reference by looking up the name in the scope chain. Find-references filters the list by resolved declaration identity.

**Data structure:**
```
Reference { name: string, range: SourceRange, scope: Scope }
```
File scope holds: `references: Reference[]`

### 5. Go-to-definition uses token-at-position + scope resolution

Same pattern as hover: find the token at the cursor, determine its scope, resolve the name. Return the declaration's source range. For parameters, return the parameter's range within the function signature.

**Rationale:** Reuses existing infrastructure (token lookup, scope resolution) with minimal new code. The only new part is returning the declaration position rather than a formatted signature.

### 6. Find-references scans the reference list

Given a cursor position, resolve the symbol under the cursor to its declaration, then scan the reference list for all entries that resolve to the same declaration. Also include the declaration itself.

**Rationale:** Simple linear scan is fast enough for single-file analysis with typical file sizes. No need for a pre-built index.

### 7. Completion uses scope walk to collect visible symbols

At the cursor position, determine the enclosing scope, then collect all symbols from that scope and all parent scopes up to root. Map each symbol to a `CompletionItem` with appropriate `kind` (function, variable, struct, enum, etc.) and `detail` (signature).

**Rationale:** Scope walking already exists for resolution. Completion just collects all candidates instead of filtering by name. No fancy scoring or fuzzy matching for now — VS Code's built-in filtering handles that client-side.

### 8. New provider files: definition.ts, references.ts, completion.ts

Create one file per LSP capability, following the same pattern as `hover.ts`. Each exports a single handler function that takes the parse result, symbol table, position, and source text.

**Rationale:** Keeps each provider focused and testable in isolation. Consistent with the existing architecture.

## Risks / Trade-offs

- **Expression parsing complexity** → The Compact expression grammar has some ambiguity (struct construction `Name { ... }` vs block after identifier, generic calls `foo<T>(...)` vs comparison). Mitigation: use context from the parser state to disambiguate; struct construction only valid after a known type name.
- **`<` ambiguity** → `foo<T>(x)` could be a generic call or `foo < T > (x)` comparisons. Mitigation: since we don't resolve generics, treat `<` after an identifier followed by types and `>` then `(` as a call with generic args. Fall back to comparison otherwise.
- **Performance with full parsing** → Parsing bodies adds work. Mitigation: Compact files are typically small (< 1000 lines). Full reparse is still fast. Benchmark after implementation.
- **Error recovery quality** → Statement-level recovery may still produce poor ASTs for heavily broken code. Mitigation: fallback to brace matching ensures we don't do worse than Phase 1. Improve recovery heuristics iteratively.
- **Incomplete reference tracking** → Since we don't do type inference, `foo.bar` member accesses can't be resolved to the struct field declaration. Mitigation: track what we can (local variables, parameters, top-level declarations). Member access resolution is a Phase 3 goal.
