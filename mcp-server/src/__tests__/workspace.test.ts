import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CompactWorkspace } from '../workspace.js';

let tmpDir: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compact-mcp-test-'));
  fs.writeFileSync(
    path.join(tmpDir, 'Main.compact'),
    `module Main {
  circuit add(x: Field, y: Field): Field {
    return x + y;
  }
}`,
  );
  fs.mkdirSync(path.join(tmpDir, 'sub'));
  fs.writeFileSync(
    path.join(tmpDir, 'sub', 'Helper.compact'),
    `module Helper {
  circuit identity(x: Field): Field {
    return x;
  }
}`,
  );
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('CompactWorkspace', () => {
  it('scans workspace and finds .compact files', () => {
    const ws = new CompactWorkspace(tmpDir);
    const uris = ws.getFileUris();
    expect(uris.length).toBe(2);
    expect(uris.some((u) => u.includes('Main.compact'))).toBe(true);
    expect(uris.some((u) => u.includes('Helper.compact'))).toBe(true);
  });

  it('analyzeUri returns analysis for a known file', () => {
    const ws = new CompactWorkspace(tmpDir);
    const uris = ws.getFileUris();
    const mainUri = uris.find((u) => u.includes('Main.compact'))!;
    const analysis = ws.analyzeUri(mainUri);
    expect(analysis).toBeDefined();
    expect(analysis!.parseResult.sourceFile.declarations.length).toBeGreaterThan(0);
    expect(analysis!.tokens.length).toBeGreaterThan(0);
  });

  it('analyzeUri returns undefined for unknown file', () => {
    const ws = new CompactWorkspace(tmpDir);
    const analysis = ws.analyzeUri('file:///nonexistent.compact');
    expect(analysis).toBeUndefined();
  });

  it('analyzeSource parses inline source without workspace', () => {
    const ws = new CompactWorkspace(tmpDir);
    const analysis = ws.analyzeSource('module Test { circuit f(x: Field): Field { return x; } }');
    expect(analysis.parseResult.errors.length).toBe(0);
    expect(analysis.parseResult.sourceFile.declarations.length).toBe(1);
  });

  it('getDiagnosticsForSource returns empty diagnostics for valid code', () => {
    const ws = new CompactWorkspace(tmpDir);
    const result = ws.getDiagnosticsForSource('module Test { circuit f(x: Field): Field { return x; } }');
    // Should have no errors (may have lint warnings like unused param)
    const errors = result.diagnostics.filter((d) => d.severity === 'error');
    expect(errors.length).toBe(0);
  });

  it('getDiagnosticsForSource returns errors for invalid code', () => {
    const ws = new CompactWorkspace(tmpDir);
    const result = ws.getDiagnosticsForSource('module { }');
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  it('getDiagnosticsForFile returns diagnostics for a workspace file', () => {
    const ws = new CompactWorkspace(tmpDir);
    const uris = ws.getFileUris();
    const mainUri = uris.find((u) => u.includes('Main.compact'))!;
    const result = ws.getDiagnosticsForFile(mainUri);
    expect(result).toBeDefined();
    expect(result!.diagnostics).toBeDefined();
  });

  it('scan() refreshes the workspace', () => {
    const ws = new CompactWorkspace(tmpDir);
    expect(ws.getFileUris().length).toBe(2);

    // Add a new file
    fs.writeFileSync(path.join(tmpDir, 'New.compact'), 'module New {}');
    ws.scan();
    expect(ws.getFileUris().length).toBe(3);

    // Clean up
    fs.unlinkSync(path.join(tmpDir, 'New.compact'));
    ws.scan();
    expect(ws.getFileUris().length).toBe(2);
  });

  it('getWorkspacePath returns the configured path', () => {
    const ws = new CompactWorkspace(tmpDir);
    expect(ws.getWorkspacePath()).toBe(tmpDir);
  });
});
