import * as path from 'path';
import { Token, tokenize } from './lexer';
import { parse } from './parser';
import { SourceFile, ParseResult, ImportDeclaration } from './ast';
import { buildSymbolTable, Scope, SymbolInfo, Reference, getExportedSymbols } from './symbols';
import {
  resolveModuleName,
  resolveStringPath,
  WorkspaceFileInfo,
  uriToFsPath,
} from './moduleResolution';

export interface FileEntry {
  uri: string;
  moduleName: string;
  exports: Map<string, SymbolInfo>;
  fileScope: Scope;
  references: Reference[];
  parseResult: ParseResult;
  tokens: Token[];
}

export interface ResolvedImport {
  uri: string;
  symbolInfo: SymbolInfo;
}

export class WorkspaceIndex {
  files: Map<string, FileEntry> = new Map();
  moduleMap: Map<string, string> = new Map(); // module name → URI

  addFile(uri: string, text: string): void {
    const tokens = tokenize(text);
    const parseResult = parse(text);
    const { fileScope, references } = buildSymbolTable(parseResult.sourceFile);
    const moduleName = extractModuleName(parseResult.sourceFile, uri);
    const exports = getExportedSymbols(parseResult.sourceFile, fileScope);

    const entry: FileEntry = {
      uri,
      moduleName,
      exports,
      fileScope,
      references,
      parseResult,
      tokens,
    };

    this.files.set(uri, entry);
    if (moduleName) {
      this.moduleMap.set(moduleName, uri);
    }
  }

  removeFile(uri: string): void {
    const entry = this.files.get(uri);
    if (entry) {
      // Remove from moduleMap if this file owned the module name
      if (entry.moduleName && this.moduleMap.get(entry.moduleName) === uri) {
        this.moduleMap.delete(entry.moduleName);
      }
      this.files.delete(uri);
    }
  }

  updateFile(uri: string, text: string): void {
    this.removeFile(uri);
    this.addFile(uri, text);
  }

  resolveImport(
    importDecl: ImportDeclaration,
    importingFileUri: string,
  ): Map<string, ResolvedImport> {
    const resolved = new Map<string, ResolvedImport>();

    // Find the target file
    let targetUri: string | undefined;

    if (importDecl.source) {
      // String-path import: import "path/to/file" prefix P$;
      targetUri = resolveStringPath(importDecl.source, importingFileUri);
      // Verify the resolved URI exists in the index
      if (!this.files.has(targetUri)) {
        targetUri = undefined;
      }
    } else {
      // Identifier module import: import { ... } from ModuleName;
      const workspaceFiles = new Map<string, WorkspaceFileInfo>();
      for (const [uri, entry] of this.files) {
        workspaceFiles.set(uri, { moduleName: entry.moduleName, uri });
      }
      targetUri = resolveModuleName(importDecl.moduleName, workspaceFiles);
    }

    if (!targetUri) return resolved;

    const targetEntry = this.files.get(targetUri);
    if (!targetEntry) return resolved;

    // For selective imports, resolve each specifier
    if (importDecl.specifiers) {
      for (const spec of importDecl.specifiers) {
        const originalName = spec.name;
        const localName = spec.alias || spec.name;
        const exportedSym = targetEntry.exports.get(originalName);
        if (exportedSym) {
          resolved.set(localName, { uri: targetUri, symbolInfo: exportedSym });
        }
      }
    }

    return resolved;
  }

  resolveFileImports(uri: string): void {
    const entry = this.files.get(uri);
    if (!entry) return;

    for (const decl of entry.parseResult.sourceFile.declarations) {
      if (decl.kind !== 'ImportDeclaration') continue;

      const resolvedImports = this.resolveImport(decl, uri);

      for (const [localName, resolved] of resolvedImports) {
        const sym = entry.fileScope.symbols.get(localName);
        if (sym) {
          sym.resolvedUri = resolved.uri;
          sym.resolvedName = resolved.symbolInfo.name;
        }
      }
    }
  }

  getFileEntry(uri: string): FileEntry | undefined {
    return this.files.get(uri);
  }
}

function extractModuleName(sourceFile: SourceFile, uri: string): string {
  // Look for an explicit module declaration
  for (const decl of sourceFile.declarations) {
    if (decl.kind === 'ModuleDefinition') {
      return decl.name;
    }
  }

  // Fall back to file stem
  const fsPath = uriToFsPath(uri);
  return path.basename(fsPath, '.compact');
}
