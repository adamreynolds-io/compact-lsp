## Context

The LSP server currently reports three categories of diagnostics, all at error severity:
1. Parse errors (from the parser)
2. Undefined reference errors (from the symbol table + reference list)
3. Import errors (from `importDiagnostics.ts` + workspace index)

Developers benefit from warning-level diagnostics that flag valid-but-suspicious code patterns. The existing infrastructure already has the data needed: the symbol table tracks all declarations, the reference list tracks all usages, and the AST provides statement structure for control flow analysis.

## Goals / Non-Goals

**Goals:**
- Detect unused imports, unused variables, unused parameters, and unreachable code
- Report as warnings (not errors) so they don't block development
- Integrate into the existing diagnostics pipeline with stable diagnostic codes
- Connect unused-import warnings to the existing "remove unused import" code action

**Non-Goals:**
- Type checking or type-level lint rules (no type system yet)
- Style linting (naming conventions, formatting, etc.)
- Configuration or rule toggling (all rules always on for now)
- Cross-file lint analysis (file-local only)

## Decisions

### Decision 1: New `lintDiagnostics.ts` module

Create a separate `computeLintDiagnostics()` function rather than extending the existing `computeDiagnostics()`. Rationale: lint warnings are conceptually different from parse/reference errors, and a separate module keeps each file focused. The server merges all diagnostic sources into a single array before publishing.

**Signature:**
```typescript
export function computeLintDiagnostics(
  sourceFile: SourceFile,
  fileScope: Scope,
  references: Reference[],
): Diagnostic[]
```

No workspace index needed — all lint checks are file-local.

### Decision 2: Detecting unused symbols via reference list

For each symbol declared in the file scope (imports, consts, parameters), check if any entry in the `references` array matches that name within the symbol's visible scope. A symbol is "unused" if no reference resolves to it.

- **Unused imports**: Walk `sourceFile.declarations` for `ImportDeclaration` with specifiers. For each specifier, check if the name (or alias) appears in `references`.
- **Unused variables**: Walk declarations/statements for `ConstDeclaration`. For each const, check if its name appears in `references`.
- **Unused parameters**: Walk `CircuitDefinition` and `WitnessDeclaration` parameters. For each parameter, check if its name appears in `references` scoped within the circuit body.

### Decision 3: Detecting unreachable code via AST walking

Walk statement lists in circuit/constructor bodies. If a `ReturnStatement` is followed by more statements in the same block, flag all subsequent statements as unreachable. This is a simple linear scan — no control flow graph needed.

### Decision 4: Diagnostic codes

Each lint diagnostic gets a stable string code:
- `"unused-import"` — import specifier never referenced
- `"unused-variable"` — const binding never referenced
- `"unused-parameter"` — parameter never referenced
- `"unreachable-code"` — statement after return

### Decision 5: Code action integration

The existing "remove unused import" refactoring action in `codeActions.ts` currently triggers only when the cursor is on an import specifier. With the new `unused-import` diagnostic, it should also be offered as a quick fix attached to the diagnostic. This means checking for `code: "unused-import"` in the diagnostics array, similar to how `"undefined-reference"` triggers the add-import quick fix.

### Decision 6: Suppressing false positives

- Built-in types and functions (in root scope) are excluded — they're always "unused" since they're ambient.
- Symbols with kind `'module'` registered from non-selective imports (bare `import Foo;`) are excluded since they don't register named specifiers.
- The `_` convention: parameters or variables named `_` are excluded from unused checks (common convention for intentionally unused bindings).

## Risks / Trade-offs

- **[Risk] Unused parameter false positives for witness declarations** — Witness declarations have parameters but no body in Compact (implementation is in TypeScript). All witness parameters would be flagged as "unused" since there are no references. → Mitigation: Exclude witness parameters from unused-parameter checks.
- **[Risk] Unreachable code false positives in branches** — An `if/else` where both branches return doesn't make code after the if/else unreachable in our simple analysis (we don't do branch analysis). → Mitigation: Only flag statements directly after a return in the same block. Accept that we miss some cases rather than over-report.
- **[Trade-off] No configuration** — All lint rules are always on. Some users might find unused-parameter warnings noisy. → Acceptable for now; can add config later if needed.
