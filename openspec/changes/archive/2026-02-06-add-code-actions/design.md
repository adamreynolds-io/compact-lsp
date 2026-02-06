## Context

The LSP server currently reports three categories of diagnostics: parse errors, undefined references, and import errors (module not found, specifier not exported). Users see these errors in the editor but must manually fix each one. The LSP protocol's `textDocument/codeAction` request allows the server to offer automated fixes tied to specific diagnostics, and refactoring operations for selected code ranges.

All existing providers follow a consistent pattern: a pure function taking `(parseResult, fileScope, tokens, ..., workspaceIndex?)` and returning a result type. The server handler translates between LSP types and provider types.

## Goals / Non-Goals

**Goals:**
- Provide quick fixes for existing diagnostic types (undefined reference → add import, specifier not exported → remove specifier, module not found → suggest similar names)
- Provide a refactoring action to extract a selected expression to a `const` declaration
- Provide an action to remove unused import specifiers
- Follow the existing provider pattern for consistency
- Add diagnostic codes to enable reliable matching between diagnostics and code actions

**Non-Goals:**
- Auto-fix on save (editor-level configuration, not server responsibility)
- Code actions for parse errors (too varied and context-dependent to fix reliably)
- Preferred/source-fixall actions (can be added later)
- Inline refactoring (extract to function, inline variable) — future work

## Decisions

### 1. Diagnostic codes for action matching

**Decision**: Add a string `code` field to the `Diagnostic` interface and assign stable codes: `"undefined-reference"`, `"module-not-found"`, `"specifier-not-exported"`.

**Rationale**: The LSP `CodeAction` request includes `context.diagnostics` — the diagnostics overlapping the requested range. To determine which quick fix to offer, the provider needs to match on diagnostic type. String codes are readable and extensible without a lookup table.

**Alternative considered**: Match on message text via regex. Rejected — fragile and breaks if messages are reworded.

### 2. Single provider file with action-type functions

**Decision**: Create `server/src/codeActions.ts` with a main `getCodeActions()` function that dispatches to per-action-type helpers (e.g., `fixUndefinedReference()`, `fixSpecifierNotExported()`, `extractToConst()`).

**Rationale**: Follows the single-file-per-feature pattern of other providers. Internal dispatch keeps the public API simple while keeping action logic separated.

**Alternative considered**: One file per action type (codeActions/fixImport.ts, etc.). Rejected — over-structured for the initial set of 4-5 actions.

### 3. Provider function signature

**Decision**:
```typescript
getCodeActions(
  parseResult: ParseResult,
  fileScope: Scope,
  references: Reference[],
  tokens: Token[],
  diagnostics: Diagnostic[],
  range: SourceRange,
  source: string,
  workspaceIndex?: WorkspaceIndex,
): CodeActionResult[]
```

**Rationale**: Follows existing provider pattern. `diagnostics` param carries the diagnostics from the request context. `range` is the selection range (needed for refactoring actions). `source` is the document text (needed for extract-to-const to read the selected text). `references` needed for unused-import detection.

### 4. CodeActionResult type

**Decision**: Return a provider-level type, not raw LSP types:
```typescript
interface CodeActionResult {
  title: string;
  kind: 'quickfix' | 'refactor';
  edits: TextEditResult[];
  diagnostics?: Diagnostic[];
}
interface TextEditResult {
  range: SourceRange;
  newText: string;
  uri?: string;
}
```

**Rationale**: Consistent with how other providers return provider-level types that the server handler translates to LSP types. Keeps the provider free of LSP protocol dependencies.

### 5. "Add import" fix uses workspace index to find exports

**Decision**: When the diagnostic is `undefined-reference`, scan all workspace file exports for a matching symbol name and suggest `import { name } from ModuleName;` for each match.

**Rationale**: The workspace index already maintains per-file export maps. This is the highest-value quick fix — saves users from manually looking up which module exports a symbol.

### 6. Extract-to-const uses token-based selection

**Decision**: For extract-to-const, find the expression tokens that overlap the selection range, reconstruct the expression text from source, and insert a `const` declaration before the containing statement.

**Rationale**: Working at the token/source level avoids needing an AST-level "find enclosing expression" utility. The selected text becomes the initializer, and a placeholder name is used.

## Risks / Trade-offs

**[Risk]** Add-import fix may suggest too many modules for common names → **Mitigation**: Sort suggestions by file proximity (same directory first), limit to top 5 suggestions.

**[Risk]** Extract-to-const with invalid selection (partial expression, multiple statements) → **Mitigation**: Only offer the action when the selection maps cleanly to a single expression. If ambiguous, don't offer it.

**[Risk]** Diagnostic codes are a cross-cutting change to diagnostics → **Mitigation**: The `code` field is optional on `Diagnostic`, so existing code continues to work. Only the diagnostics provider and import diagnostics need updates.
