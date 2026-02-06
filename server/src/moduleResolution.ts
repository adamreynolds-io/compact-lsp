import * as path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

export interface WorkspaceFileInfo {
  moduleName: string;
  uri: string;
}

/**
 * Resolves an identifier module name (e.g., `MyModule`) to a file URI
 * by searching the workspace files. Matches by explicit module declaration
 * name first, then by file stem.
 */
export function resolveModuleName(
  moduleName: string,
  workspaceFiles: Map<string, WorkspaceFileInfo>,
): string | undefined {
  // First pass: match by explicit module declaration name
  for (const [, info] of workspaceFiles) {
    if (info.moduleName === moduleName) {
      return info.uri;
    }
  }

  // Second pass: match by file stem
  for (const [uri] of workspaceFiles) {
    const fsPath = uriToFsPath(uri);
    const stem = path.basename(fsPath, '.compact');
    if (stem === moduleName) {
      return uri;
    }
  }

  return undefined;
}

/**
 * Resolves a string-path import (e.g., `"utils/helpers"`) relative to the
 * importing file's directory. Appends `.compact` if no extension present.
 * Returns a normalized file URI.
 */
export function resolveStringPath(importPath: string, importingFileUri: string): string {
  const importingFsPath = uriToFsPath(importingFileUri);
  const importingDir = path.dirname(importingFsPath);

  let resolvedPath = importPath;
  if (!resolvedPath.endsWith('.compact')) {
    resolvedPath += '.compact';
  }

  const absolutePath = path.resolve(importingDir, resolvedPath);
  return fsPathToUri(absolutePath);
}

export function uriToFsPath(uri: string): string {
  return fileURLToPath(uri);
}

export function fsPathToUri(fsPath: string): string {
  return pathToFileURL(fsPath).toString();
}
