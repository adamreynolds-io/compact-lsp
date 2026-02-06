## Context

The LSP server's hover, completion, and signature help providers return type signatures only. For built-in types (`Field`, `Boolean`, etc.), functions (`map`, `fold`, etc.), and ledger ADT types (`Counter`, `Set`, etc.), the output is just `(built-in type) Field` or `(built-in) map` with no explanation of what these symbols do. There are 32 built-in symbols total.

## Goals / Non-Goals

**Goals:**
- Provide a single-sentence description for every built-in type, function, and ledger ADT type
- Surface these descriptions in hover, completion, and signature help
- Use a design that naturally extends to user-defined doc comments later (Path B)

**Non-Goals:**
- Parameter-level documentation for built-in functions (future work)
- Web documentation links (separate initiative)
- Doc comment extraction from source code (Path B, separate change)
- Multi-paragraph or example-rich documentation

## Decisions

### 1. Add optional `documentation` field to `SymbolInfo`

Add `documentation?: string` to the `SymbolInfo` interface. This is the single point where all providers already look up symbol information, so threading docs through existing code paths is minimal.

**Alternative**: Have each provider independently look up docs from a registry. Rejected because it duplicates lookup logic and doesn't prepare for Path B (user doc comments), which would also attach docs at the symbol level.

### 2. Separate `builtinDocs.ts` registry file

Create a new file with a `Record<string, string>` mapping built-in names to descriptions. The `createRootScope()` function reads from this map when registering built-ins.

**Alternative**: Inline descriptions in the `BUILTIN_TYPES`/`BUILTIN_FUNCTIONS` arrays. Rejected because mixing data with logic makes the arrays harder to read, and a separate file is easier for non-technical contributors to review.

### 3. Markdown output format for hover

When documentation exists, hover output becomes:

```markdown
```compact
(built-in type) Field
```
A finite field element, the fundamental numeric type in Compact circuits.
```

The signature stays in a code block; the documentation follows as plain markdown text. This matches VS Code's hover rendering conventions.

### 4. Completion and signature help use existing LSP documentation fields

- `CompletionItem.documentation` → `MarkupContent` with the description
- `SignatureInformation.documentation` → `MarkupContent` with the description

These are standard LSP fields that VS Code already renders. No custom formatting needed.

### 5. Providers check `symbol.documentation` — no special built-in handling

Providers don't need to know whether a symbol is built-in. They just check if `symbol.documentation` is set and include it if present. This makes the same code path work for future user doc comments.

## Risks / Trade-offs

- **[Descriptions may be inaccurate]** → We're writing descriptions based on names without access to the Compact compiler source. Descriptions are intentionally kept to single sentences so they're easy to correct later.
- **[No parameter docs]** → Built-in functions like `map(collection, fn)` would benefit from per-parameter descriptions. Deferred: this requires a richer documentation model and is lower priority than having any docs at all.
