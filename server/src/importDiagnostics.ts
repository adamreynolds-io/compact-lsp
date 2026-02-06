import { SourceFile, ImportDeclaration } from './ast';
import { Scope } from './symbols';
import { Diagnostic } from './diagnostics';
import { WorkspaceIndex } from './workspaceIndex';
import { resolveModuleName, resolveStringPath, WorkspaceFileInfo } from './moduleResolution';

// Known standard library modules that won't have .compact files in the workspace
const STANDARD_LIBRARY_MODULES = new Set(['CompactStandardLibrary', 'StandardLibrary', 'Stdlib']);

export function computeImportDiagnostics(
  sourceFile: SourceFile,
  fileScope: Scope,
  workspaceIndex: WorkspaceIndex,
  fileUri: string,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const decl of sourceFile.declarations) {
    if (decl.kind !== 'ImportDeclaration') continue;

    const targetUri = resolveImportTarget(decl, fileUri, workspaceIndex);

    if (!targetUri) {
      // Suppress for standard library modules
      if (isStandardLibraryModule(decl.moduleName)) continue;

      const moduleName = decl.source || decl.moduleName;
      diagnostics.push({
        message: `Module '${moduleName}' not found`,
        range: decl.range,
        severity: 'error',
        source: 'compact-lsp',
      });
      continue;
    }

    // Check specifiers are actually exported
    if (decl.specifiers) {
      const targetEntry = workspaceIndex.getFileEntry(targetUri);
      if (targetEntry) {
        for (const spec of decl.specifiers) {
          if (!targetEntry.exports.has(spec.name)) {
            diagnostics.push({
              message: `Module '${decl.moduleName}' does not export '${spec.name}'`,
              range: spec.range,
              severity: 'error',
              source: 'compact-lsp',
            });
          }
        }
      }
    }
  }

  return diagnostics;
}

function resolveImportTarget(
  decl: ImportDeclaration,
  fileUri: string,
  workspaceIndex: WorkspaceIndex,
): string | undefined {
  if (decl.source) {
    const targetUri = resolveStringPath(decl.source, fileUri);
    return workspaceIndex.files.has(targetUri) ? targetUri : undefined;
  }

  const workspaceFiles = new Map<string, WorkspaceFileInfo>();
  for (const [uri, entry] of workspaceIndex.files) {
    workspaceFiles.set(uri, { moduleName: entry.moduleName, uri });
  }
  return resolveModuleName(decl.moduleName, workspaceFiles);
}

function isStandardLibraryModule(moduleName: string): boolean {
  return STANDARD_LIBRARY_MODULES.has(moduleName);
}
