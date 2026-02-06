## Context

The LSP server provides 10 provider features but no code folding. VS Code falls back to indentation-based folding, which misidentifies fold regions in Compact code (e.g., multi-line expressions, chained method calls). The AST already tracks `SourceRange` for every node, giving us precise start/end positions for all block-level constructs.

## Goals / Non-Goals

**Goals:**
- Provide AST-aware folding ranges for all brace-delimited constructs
- Group consecutive import declarations into a single foldable region
- Follow the same provider pattern used by existing features (pure function, AST in, ranges out)

**Non-Goals:**
- Comment folding (multi-line comments are not tracked in the AST; can add later)
- Region markers (`// #region` / `// #endregion` — not a Compact convention)
- Incremental folding range updates (full recomputation is fine for Compact file sizes)

## Decisions

### 1. Pure function over AST, no symbol table needed

Folding ranges only need structural information (where blocks start/end), not semantic information. The provider will take a `SourceFile` (parsed AST) and return folding ranges. No dependency on the symbol table or workspace index.

**Alternative**: Walk the symbol table scopes for fold boundaries. Rejected because scopes don't map 1:1 to visual fold regions (e.g., import groups have no scope), and it adds unnecessary coupling.

### 2. Walk declarations recursively, walk statements for nested folds

The provider will:
1. Walk top-level declarations for module/circuit/struct/enum/contract/constructor folds
2. Recurse into module declarations
3. Walk statement bodies for for-loops, if-statements, and block statements
4. Group consecutive `ImportDeclaration` nodes into import region folds

This mirrors the `documentSymbols.ts` pattern of recursing through declarations.

### 3. Fold from opening line to closing line (exclusive end)

LSP `FoldingRange` uses 0-based line numbers. The convention is `startLine` = line with the opening brace, `endLine` = line with the closing brace. VS Code will typically hide lines after `startLine` up to and including `endLine` when collapsed. We fold from the declaration's start line to `end.line` since our AST ranges already include the closing brace.

For single-line constructs (start and end on the same line), no folding range is emitted.

### 4. FoldingRangeKind

- Import groups: `FoldingRangeKind.Imports`
- All block constructs: `FoldingRangeKind.Region`

### 5. File location and naming

New file: `server/src/foldingRanges.ts` — follows the existing naming convention (`hover.ts`, `completion.ts`, `rename.ts`, etc.).

## Risks / Trade-offs

- **[Incomplete AST on parse errors]** → The parser produces partial AST with `ErrorNode` entries. The provider simply skips error nodes and folds whatever valid structure exists. This is consistent with how other providers handle parse errors.
- **[No comment folding]** → Users may expect multi-line comment folding. Mitigated: VS Code's indentation-based fallback still works for comments. Can be added later by scanning tokens for comment runs.
