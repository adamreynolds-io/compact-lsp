## Context

The LSP server analyzes each `.compact` file in isolation. Import syntax is fully parsed (selective, prefix, and string-path forms), and selective import specifiers are registered as symbols in the file scope. However, there is no mechanism to resolve an import's module name to a file on disk, and no workspace-level state that tracks what each file exports. Every LSP feature (hover, definition, references, completion, rename, diagnostics) operates only on the current document's symbol table.

The Compact language has two module-naming conventions:
1. **Identifier modules** — `import { foo } from MyModule;` where `MyModule` matches a module name declared in another file, or a file's stem.
2. **String-path modules** — `import "path/to/file" prefix P$;` resolved relative to the importing file.

Compact projects also use `include "standard_library.compact";` which is a textual include (not an import) — out of scope for this change.

## Goals / Non-Goals

**Goals:**
- Build a workspace index that maps module names to files and tracks each file's exported symbols
- Resolve import declarations to their source files
- Enable cross-file go-to-definition, find-references, hover, completion, and rename for imported symbols
- Report diagnostics for unresolvable imports (unknown module, unknown export)
- Keep the workspace index current as files change, including unwatched files

**Non-Goals:**
- Supporting `include` directives (textual inclusion, different semantics)
- Prefix-qualified access (`M$.foo`) — this requires expression-level resolution, a future enhancement
- Cross-workspace or cross-project imports
- Type checking across files (structural type compatibility)
- Incremental reparsing of unchanged files (full reparse on change is fine for typical Compact projects)
- Go-to-definition into standard library files (no `.compact` source available)

## Decisions

### 1. Workspace index as a new module (`workspaceIndex.ts`)

**Decision:** Create a `WorkspaceIndex` class that maintains:
- A map of file URI → `FileEntry { uri, moduleName, exports: Map<string, ExportedSymbol>, fileScope, parseResult, tokens }`
- A reverse map of module name → file URI for fast lookup
- A method to resolve `import { name } from Module` to a `{ uri, symbolInfo }` pair

**Why a class:** The index has mutable state (file entries added/removed) and multiple methods that operate on that state. A class with clear methods is more readable than a bag of functions sharing a Map.

**Alternative considered:** Storing the index as a plain Map in `server.ts`. Rejected because the resolution logic (name→file→export) is complex enough to warrant its own module with tests.

### 2. Module resolution strategy

**Decision:** Two resolution paths:
- **Identifier module names** (`import ... from MyModule`): Scan the index for a file whose `module` declaration name matches, OR whose file stem (without `.compact`) matches. Module declaration takes priority.
- **String-path modules** (`import "path/to/file"`): Resolve relative to the importing file's directory. Append `.compact` if no extension. Normalize to a URI.

**Why file stem fallback:** Not all Compact files wrap their content in a `module Foo { }`. Many files are implicitly their own module, identified by filename.

**Alternative considered:** Requiring all files to have explicit `module` declarations. Rejected — too restrictive for existing Compact codebases.

### 3. Eagerly index all workspace `.compact` files on open

**Decision:** On `onInitialize`, scan workspace folders for all `*.compact` files using `glob`. Parse each file, build its symbol table, and populate the workspace index. On file change (open, edit, save), re-analyze that file and update its index entry. On file delete, remove its entry.

**Why eager:** Compact projects are small (tens of files, each under 10KB). Parsing all files upfront takes <100ms and avoids lazy-resolution complexity.

**Alternative considered:** Lazy indexing (only parse files when they're first referenced by an import). Rejected — adds complexity and latency to the first go-to-definition call. Eager indexing is simple and fast enough.

### 4. File watcher for unwatched files

**Decision:** Register a `workspace/didChangeWatchedFiles` handler watching `**/*.compact`. When a file is created, parse and add it to the index. When deleted, remove it. When changed (and not currently open), re-analyze it.

For open files, continue using `didOpen`/`didChange`/`didClose` as today — these take priority over file watcher events.

**Why both:** Files that are open are managed by the TextDocuments manager. Files that are not open (but exist in the workspace) need the file watcher to stay current.

### 5. Extend SymbolInfo with resolved import metadata

**Decision:** Add optional `resolvedUri?: string` and `resolvedName?: string` fields to `SymbolInfo` in `symbols.ts`. When the workspace index resolves an import, it patches the imported symbol's entry with the resolved file URI and original symbol name.

**Why patch after build:** `buildSymbolTable()` runs without workspace context (it's a pure per-file operation). The workspace index runs a second pass to resolve imports by looking up module names in the index and writing `resolvedUri`/`resolvedName` into the file's imported symbols.

**Alternative considered:** Passing the workspace index into `buildSymbolTable()`. Rejected — it would couple the symbol table builder to workspace state, making it harder to test and breaking the current clean pipeline.

### 6. Provider changes — thin cross-file redirect

**Decision:** Each provider (definition, references, hover, completion, rename) gains a small "if imported, follow the link" check:
- **definition**: If the symbol has `resolvedUri`, return the location in the resolved file.
- **references**: Search all indexed files for references to the same symbol name that resolve to the same URI.
- **hover**: If imported, show the resolved symbol's signature (from the source file's symbol table).
- **completion**: When computing completions, include exported symbols from imported modules.
- **rename**: Propagate rename across all files that import or reference the renamed symbol.

Each provider gets the workspace index passed as an optional parameter (undefined in tests that don't need it).

### 7. Import diagnostics in a new module (`importDiagnostics.ts`)

**Decision:** Create a separate function `computeImportDiagnostics(sourceFile, fileScope, workspaceIndex)` that checks:
- Each import's module name resolves to a file
- Each selective import specifier is actually exported by the resolved module
- Report errors: "Module 'X' not found" and "Module 'X' does not export 'Y'"

This runs after `analyzeDocument` and the workspace index resolution pass, and its diagnostics are merged with existing parse/reference diagnostics.

## Risks / Trade-offs

- **Eager indexing may slow startup for very large workspaces** → Mitigated by the reality that Compact projects are small. If needed, we can add a file count threshold that switches to lazy mode.
- **Workspace index increases memory usage** → Each file stores a parse result, scope, and tokens. For 50 files at ~10KB each, this is ~5MB — negligible.
- **Cross-file rename is risky** → A rename in one file must update imports in all files that reference the symbol. We'll require the user to confirm multi-file renames via the LSP `WorkspaceEdit` response, which editors show as a preview.
- **Module name collisions** → Two files could declare the same module name. We'll resolve to the first match and report a warning diagnostic on the second.
- **File watcher race conditions** → A file could be deleted between resolution and reading. We'll handle missing files gracefully (return undefined, log warning).
- **Standard library imports will show as unresolved** → `include "standard_library.compact"` is out of scope, so imports from standard library modules won't resolve. We'll suppress "module not found" diagnostics for known standard library module names.
