## Why

The LSP server currently analyzes each `.compact` file in isolation. Import statements are parsed and their specifiers are registered as symbols, but there is no connection to the actual source module — go-to-definition on an imported symbol doesn't jump to the other file, completions don't suggest symbols from imported modules, and cross-file rename doesn't propagate. For any project with more than one file, this makes the LSP experience incomplete. Multi-file analysis is the single biggest gap between the current POC and a usable daily-driver tool.

## What Changes

- **Workspace index**: A workspace-level registry that tracks all `.compact` files, their exported symbols, and their module names. Built on workspace open, updated incrementally on file change.
- **Module resolution**: Map `import ... from ModuleName` and `import "path/to/file"` to actual files on disk. Support both identifier-based module names (resolved by scanning for matching `module` declarations or file names) and string-path imports (resolved relative to the importing file).
- **Cross-file symbol resolution**: When a provider (hover, definition, references, completion, rename) encounters an imported symbol, resolve it through the workspace index to its source declaration in another file.
- **Cross-file diagnostics**: Report errors for unresolvable imports (module not found, symbol not exported from module).
- **Export registry**: Track which symbols each file exports (via `export` keyword on declarations and `export { ... }` lists) so that import resolution can validate against actual exports.
- **File watcher integration**: Watch for `.compact` file creation, deletion, and rename in the workspace so the index stays current without requiring files to be open.

## Capabilities

### New Capabilities
- `workspace-index`: Workspace-level registry of files, their module names, and exported symbols. Incrementally maintained on file changes.
- `module-resolution`: Resolving import declarations to source files on disk. Handles identifier module names and string-path imports.
- `cross-file-providers`: Extending existing LSP providers (definition, references, hover, completion, rename) to follow imports across file boundaries.
- `import-diagnostics`: Diagnostics for unresolvable imports — unknown module, symbol not exported, etc.

### Modified Capabilities
- `lsp-server`: Server must register workspace folder support, file watchers, and manage workspace-level state alongside per-document state.
- `symbol-table`: Symbol table must link imported symbols to their resolved source (file URI + symbol name) so providers can follow the chain.
- `diagnostics`: Diagnostics must include import-related errors (unresolved module, unresolved import specifier).

## Impact

- **server.ts**: Major changes — workspace state management, file watcher registration, analysis orchestration across files.
- **symbols.ts**: Import symbol entries need a `resolvedUri` / `resolvedName` link. `buildSymbolTable` may need access to the workspace index.
- **All providers** (hover, definition, references, completion, rename, semanticTokens): Need to follow cross-file links when encountering imported symbols. The changes are incremental — each provider gains a "if imported, look up in workspace index" path.
- **New files**: Workspace index module, module resolver module, file watcher handler.
- **Extension**: May need to pass workspace folder info to the server (likely already handled by vscode-languageclient defaults).
- **Performance**: Workspace scan on open, incremental updates on change. For typical Compact projects (tens of files, each under 10KB), this should be negligible.
