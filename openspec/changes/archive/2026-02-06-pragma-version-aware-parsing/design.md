## Context

The LSP parses `pragma language_version [>=] X.Y.Z;` into a `PragmaDeclaration` AST node but discards the information — the symbol table builder skips pragmas entirely. The Compact language is evolving (0.14.0 → 0.26.0+), and different versions have different built-in types, functions, and syntax. Users need the LSP to understand which version their file targets so it can provide accurate completions, diagnostics, and hover information.

Currently, all built-in types and functions are defined in a single flat root scope (`createRootScope()` in `symbols.ts`) with documentation from `builtinDocs.ts`. There is no mechanism to vary these based on version.

## Goals / Non-Goals

**Goals:**
- Extract `language_version` from pragma declarations and surface it on `SourceFile`
- Create a version registry that maps version strings to their available built-ins
- Report a diagnostic for unrecognized version strings
- Filter completion suggestions based on declared version
- Show version info on hover over pragma lines

**Non-Goals:**
- Version-specific parser grammar changes (e.g., new syntax in 0.26.0) — this requires parser rewriting, not just gating
- Automatic version detection from project configuration files
- Version migration/upgrade tooling
- Complex version constraints beyond `>=` (e.g., ranges like `>=0.14.0 <0.20.0`, or `^`, `~`)

## Decisions

### 1. Version extraction happens in the parser, not the symbol table

**Decision:** The parser extracts `languageVersion` and `languageVersionOperator` (`"="` or `">="`) from the first `PragmaDeclaration` with `name === "language_version"` and stores both directly on the `SourceFile` node. The parser strips the `>=` prefix from the pragma value to isolate the version string.

**Rationale:** The version is a property of the source file itself, not a symbol. Extracting it during parsing (where pragma nodes are already created) avoids an extra pass. The symbol table builder already skips pragmas. Parsing the operator at this stage keeps downstream consumers simple — they receive a clean version string and an operator enum.

**Alternative considered:** Extract in `buildSymbolTable()` — rejected because the version is needed before symbol table construction (to gate which built-ins are registered).

### 2. Version registry as a simple static map

**Decision:** Create a `versionRegistry.ts` file with a `Record<string, VersionCapabilities>` mapping version strings to `{ builtinTypes: string[], builtinFunctions: string[] }`.

**Rationale:** The set of Compact versions is small and changes infrequently. A static map is simple, testable, and avoids over-engineering. New versions are added by extending the map.

**Alternative considered:** Dynamic registry loaded from external config — rejected as over-engineered for a small, stable set.

### 2b. Version resolution with >= fallback

**Decision:** Add a `resolveVersion(version: string, operator: "=" | ">="): { effectiveVersion: string; fallback: boolean } | undefined` function. For `=`, it returns the version if it exists in the registry, else `undefined`. For `>=`, it returns the exact version if present, otherwise the next highest version in the registry (sorted by semver). If no version >= the requested one exists, it returns `undefined`. The `fallback` flag indicates whether the effective version differs from the requested one.

**Rationale:** The `>=` operator is common in Compact pragma declarations (e.g., OpenZeppelin contracts use `>= 0.26.0`). Ignoring the `>` and using the exact version when available, then falling back to the next highest, provides the best available behavior while making it clear to the user which version is actually being used (via an informational diagnostic).

**Alternative considered:** Treat `>=` as exact match only — rejected because it would produce unnecessary `unsupported-version` warnings for files that work fine with a newer registered version. Full semver range resolution — rejected as over-engineered; only `>=` is used in practice.

### 3. Root scope construction gated by version

**Decision:** `createRootScope()` in `symbols.ts` accepts an optional effective version string (already resolved via `resolveVersion`). When provided, only the built-ins for that version are registered. When absent (no pragma or resolution failed), all built-ins are registered (current behavior preserved).

**Rationale:** This is the minimal change to the existing architecture. The root scope is the single place where built-ins are registered, so gating happens naturally there. Resolution failures fall back to full built-ins to avoid false-positive "undefined reference" errors. The caller is responsible for resolving the version first.

### 4. Version diagnostic computed alongside lint diagnostics

**Decision:** Add version validation to the diagnostics pipeline — a new `computeVersionDiagnostics(sourceFile)` function resolves the version and returns diagnostics. It produces: (a) an `"unsupported-version"` warning if resolution fails entirely, or (b) a `"version-resolved"` informational diagnostic if `>=` resolved to a different version than requested (telling the user which version is being used). This runs alongside existing parse/reference/import/lint diagnostics.

**Rationale:** Follows the existing pattern of composable diagnostic functions. Keeps version checking isolated and testable. The informational diagnostic for fallback resolution ensures users know exactly which version's capabilities are active — no silent surprises.

### 5. Hover checks pragma range before symbol lookup

**Decision:** The hover provider checks if the cursor is on a `PragmaDeclaration` with `name === "language_version"` before falling through to normal symbol lookup. If matched, it returns version info.

**Rationale:** Pragmas don't create symbols, so they'd never match the existing symbol-based hover path. A range check against the AST declarations is straightforward and doesn't require changing the symbol table.

## Risks / Trade-offs

- **Incomplete version data** → The registry starts with only `0.14.0` (the version our parser targets). Adding more versions requires knowing exactly which built-ins each version introduced. Mitigation: start with what we know, document the registry format for easy extension.
- **False positives on version-gated completions** → If the registry is missing a built-in for a version, users won't see it in completions. Mitigation: when version is unrecognized, fall back to showing all built-ins.
- **No syntax-level gating** → Some version differences are syntactic (new keywords, new expression forms). This change only gates built-in availability, not parser grammar. Mitigation: explicitly a non-goal; parser grammar changes are a separate, larger effort.
