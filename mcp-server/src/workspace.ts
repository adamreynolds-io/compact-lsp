import * as fs from 'fs';
import * as path from 'path';
import { tokenize, Token } from 'compact-lsp-server/out/lexer.js';
import { parse } from 'compact-lsp-server/out/parser.js';
import { buildSymbolTable, Scope, Reference } from 'compact-lsp-server/out/symbols.js';
import { ParseResult } from 'compact-lsp-server/out/ast.js';
import { WorkspaceIndex } from 'compact-lsp-server/out/workspaceIndex.js';
import { computeDiagnostics } from 'compact-lsp-server/out/diagnostics.js';
import { computeImportDiagnostics } from 'compact-lsp-server/out/importDiagnostics.js';
import { computeLintDiagnostics } from 'compact-lsp-server/out/lintDiagnostics.js';
import { computeVersionDiagnostics } from 'compact-lsp-server/out/versionDiagnostics.js';
import { fsPathToUri } from 'compact-lsp-server/out/moduleResolution.js';

export interface FileAnalysis {
  parseResult: ParseResult;
  fileScope: Scope;
  references: Reference[];
  tokens: Token[];
  source: string;
}

export class CompactWorkspace {
  workspaceIndex: WorkspaceIndex;
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
    this.workspaceIndex = new WorkspaceIndex();
    this.scan();
  }

  scan(): void {
    this.workspaceIndex = new WorkspaceIndex();
    this.scanDir(this.workspacePath);
  }

  private scanDir(dirPath: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        this.scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.compact')) {
        try {
          const text = fs.readFileSync(fullPath, 'utf-8');
          const uri = fsPathToUri(fullPath);
          this.workspaceIndex.addFile(uri, text);
        } catch {
          // Skip files that can't be read
        }
      }
    }
  }

  analyzeFile(uri: string): FileAnalysis | undefined {
    // Read fresh from disk
    const entry = this.workspaceIndex.getFileEntry(uri);
    if (!entry) return undefined;

    // Re-resolve imports for this file
    this.workspaceIndex.resolveFileImports(uri);

    return {
      parseResult: entry.parseResult,
      fileScope: entry.fileScope,
      references: entry.references,
      tokens: entry.tokens,
      source: '', // Will be populated from disk read
    };
  }

  analyzeUri(uri: string): FileAnalysis | undefined {
    // Re-read from disk and update the index
    let fsPath: string;
    try {
      fsPath = new URL(uri).pathname;
    } catch {
      return undefined;
    }

    let text: string;
    try {
      text = fs.readFileSync(fsPath, 'utf-8');
    } catch {
      return undefined;
    }

    this.workspaceIndex.updateFile(uri, text);
    this.workspaceIndex.resolveFileImports(uri);

    const entry = this.workspaceIndex.getFileEntry(uri);
    if (!entry) return undefined;

    return {
      parseResult: entry.parseResult,
      fileScope: entry.fileScope,
      references: entry.references,
      tokens: entry.tokens,
      source: text,
    };
  }

  analyzeSource(source: string): FileAnalysis {
    const tokens = tokenize(source);
    const parseResult = parse(source);
    const { fileScope, references } = buildSymbolTable(parseResult.sourceFile);
    return { parseResult, fileScope, references, tokens, source };
  }

  getDiagnosticsForFile(uri: string) {
    const analysis = this.analyzeUri(uri);
    if (!analysis) return undefined;

    const diags = computeDiagnostics(analysis.parseResult.errors, analysis.references, analysis.fileScope);
    const importDiags = computeImportDiagnostics(
      analysis.parseResult.sourceFile,
      analysis.fileScope,
      this.workspaceIndex,
      uri,
    );
    diags.push(...importDiags);
    diags.push(...computeLintDiagnostics(analysis.parseResult.sourceFile, analysis.fileScope, analysis.references));
    diags.push(...computeVersionDiagnostics(analysis.parseResult.sourceFile));
    return { diagnostics: diags, analysis };
  }

  getDiagnosticsForSource(source: string) {
    const analysis = this.analyzeSource(source);
    const diags = computeDiagnostics(analysis.parseResult.errors, analysis.references, analysis.fileScope);
    diags.push(...computeLintDiagnostics(analysis.parseResult.sourceFile, analysis.fileScope, analysis.references));
    diags.push(...computeVersionDiagnostics(analysis.parseResult.sourceFile));
    return { diagnostics: diags, analysis };
  }

  getFileUris(): string[] {
    return Array.from(this.workspaceIndex.files.keys());
  }

  getWorkspacePath(): string {
    return this.workspacePath;
  }
}
