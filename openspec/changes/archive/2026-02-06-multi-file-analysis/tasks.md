## 1. SymbolInfo Extension

- [x] 1.1 Add optional `resolvedUri?: string` and `resolvedName?: string` fields to `SymbolInfo` in `symbols.ts`
- [x] 1.2 Write tests verifying that non-imported symbols have `resolvedUri` and `resolvedName` as undefined

## 2. Export Tracking

- [x] 2.1 Implement `getExportedSymbols(sourceFile, fileScope)` function that returns a `Map<string, SymbolInfo>` of all exported symbols from a file (checking `isExport` on declarations and processing `ExportList` entries)
- [x] 2.2 Write tests for `getExportedSymbols` covering: exported circuit, exported struct, export list, non-exported symbol excluded, exported ledger, exported new type

## 3. Module Resolution

- [x] 3.1 Create `moduleResolution.ts` with `resolveModuleName(moduleName: string, workspaceFiles: Map<string, { moduleName: string; uri: string }>): string | undefined` — searches by module declaration name, then by file stem
- [x] 3.2 Create `resolveStringPath(importPath: string, importingFileUri: string): string` — resolves relative path, appends `.compact` if needed, normalizes to URI
- [x] 3.3 Write tests for identifier module resolution: explicit module match, file stem match, module declaration takes priority, no match returns undefined
- [x] 3.4 Write tests for string-path resolution: relative path, path with extension, normalization

## 4. Workspace Index

- [x] 4.1 Create `workspaceIndex.ts` with `WorkspaceIndex` class containing: `files: Map<string, FileEntry>`, `moduleMap: Map<string, string>` (module name → URI), methods `addFile`, `removeFile`, `updateFile`, `resolveImport`
- [x] 4.2 Define `FileEntry` interface: `{ uri: string, moduleName: string, exports: Map<string, SymbolInfo>, fileScope: Scope, parseResult: ParseResult, tokens: Token[] }`
- [x] 4.3 Implement `addFile(uri, text)` — tokenize, parse, buildSymbolTable, extract module name, extract exports, add to maps
- [x] 4.4 Implement `removeFile(uri)` — remove from files and moduleMap
- [x] 4.5 Implement `updateFile(uri, text)` — re-analyze and update entry
- [x] 4.6 Implement `resolveImport(importDecl, importingFileUri)` — use module resolution to find file, then look up specifier in exports
- [x] 4.7 Implement `resolveFileImports(uri)` — iterate all imports in a file's AST, resolve each, and patch `resolvedUri`/`resolvedName` on imported symbols in the file scope
- [x] 4.8 Write tests for WorkspaceIndex: add/remove/update file, resolveImport for selective import, alias import, unresolvable module, unresolvable specifier

## 5. Import Diagnostics

- [x] 5.1 Create `importDiagnostics.ts` with `computeImportDiagnostics(sourceFile, fileScope, workspaceIndex, fileUri)` returning diagnostic entries
- [x] 5.2 Implement module-not-found diagnostic for each import whose module cannot be resolved
- [x] 5.3 Implement specifier-not-exported diagnostic for each selective import specifier not in the module's exports
- [x] 5.4 Add suppression for known standard library module names (skip module-not-found for those)
- [x] 5.5 Write tests: unknown module, unknown specifier, valid import no diagnostic, standard library suppression

## 6. Server Integration

- [x] 6.1 Add workspace folder support to `onInitialize` — read `params.workspaceFolders`, declare `workspace.workspaceFolders` capability
- [x] 6.2 Create workspace index instance in server.ts and implement initial workspace scan (glob for `*.compact` files, parse each, add to index)
- [x] 6.3 Register `workspace/didChangeWatchedFiles` handler — add/remove/update files in workspace index based on change type
- [x] 6.4 Update `analyzeDocument()` to also update the workspace index entry for the document and call `resolveFileImports`
- [x] 6.5 Update `analyzeDocument()` to merge import diagnostics into published diagnostics
- [x] 6.6 Implement dependent file re-analysis — when a file's exports change, re-analyze import diagnostics for files that import from it

## 7. Cross-File Definition

- [x] 7.1 Update `getDefinition()` to accept optional workspace index parameter
- [x] 7.2 When the resolved symbol has `resolvedUri`, return a `Location` in the resolved file instead of the current file
- [x] 7.3 Update server.ts definition handler to pass workspace index
- [x] 7.4 Write tests: go-to-definition on imported symbol returns location in source file, unresolvable import returns no result

## 8. Cross-File References

- [x] 8.1 Update `findReferences()` to accept optional workspace index parameter
- [x] 8.2 When finding references for a symbol that may be imported by other files, search all indexed files for matching import specifiers and body references
- [x] 8.3 Update server.ts references handler to pass workspace index
- [x] 8.4 Write tests: find-references on exported symbol returns usages from importing files, includeDeclaration flag works across files

## 9. Cross-File Hover

- [x] 9.1 Update `getHoverInfo()` to accept optional workspace index parameter
- [x] 9.2 When hovering over an imported symbol with `resolvedUri`, display the resolved symbol's signature from the source file
- [x] 9.3 Update server.ts hover handler to pass workspace index
- [x] 9.4 Write tests: hover on imported symbol shows source signature, hover on unresolvable import shows import-only info

## 10. Cross-File Completion

- [x] 10.1 Update `getCompletions()` to accept optional workspace index parameter
- [x] 10.2 Include imported symbols (already in scope from import registration) with detail indicating source module
- [x] 10.3 Update server.ts completion handler to pass workspace index
- [x] 10.4 Write tests: completions include imported symbols with module detail

## 11. Cross-File Rename

- [x] 11.1 Update `getRenameEdits()` to accept optional workspace index parameter
- [x] 11.2 When renaming an exported symbol, collect edits from all files that import it (update import specifier name and all local usages)
- [x] 11.3 When renaming an import alias, only rename the alias and local usages (not the source symbol)
- [x] 11.4 Update server.ts rename handler to pass workspace index
- [x] 11.5 Write tests: rename exported symbol propagates to importing files, rename alias does not propagate to source

## 12. Validation

- [x] 12.1 Run full test suite and verify all existing + new tests pass
- [x] 12.2 Run `npm run lint` and fix lint issues
- [x] 12.3 Run `npm run format:check` and fix formatting issues
- [ ] 12.4 Manual smoke test: open a workspace with multiple `.compact` files in VS Code, verify cross-file go-to-definition and hover work
