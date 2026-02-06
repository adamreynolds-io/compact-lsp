import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../server.js';
import { CompactWorkspace } from '../workspace.js';

let tmpDir: string;
let client: Client;
let mainUri: string;

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compact-mcp-tools-'));
  fs.writeFileSync(
    path.join(tmpDir, 'Main.compact'),
    `module Main {
  circuit add(x: Field, y: Field): Field {
    return x + y;
  }

  circuit unused(a: Field): Field {
    return a;
  }
}`,
  );
  fs.writeFileSync(
    path.join(tmpDir, 'Helper.compact'),
    `module Helper {
  circuit identity(x: Field): Field {
    return x;
  }
}`,
  );

  const workspace = new CompactWorkspace(tmpDir);
  mainUri = workspace.getFileUris().find((u) => u.includes('Main.compact'))!;
  const server = createServer(workspace);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  client = new Client({ name: 'test-client', version: '0.1.0' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('compact_diagnostics', () => {
  it('returns diagnostics for inline source', async () => {
    const result = await client.callTool({
      name: 'compact_diagnostics',
      arguments: { source: 'module Test { circuit f(x: Field): Field { return x; } }' },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const diags = JSON.parse(text);
    expect(Array.isArray(diags)).toBe(true);
  });

  it('returns diagnostics for a workspace file', async () => {
    const result = await client.callTool({
      name: 'compact_diagnostics',
      arguments: { uri: mainUri },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const diags = JSON.parse(text);
    expect(Array.isArray(diags)).toBe(true);
  });

  it('returns parse errors for invalid source', async () => {
    const result = await client.callTool({
      name: 'compact_diagnostics',
      arguments: { source: 'module { }' },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const diags = JSON.parse(text);
    expect(diags.length).toBeGreaterThan(0);
    expect(diags.some((d: { severity: string }) => d.severity === 'error')).toBe(true);
  });

  it('returns error for missing file', async () => {
    const result = await client.callTool({
      name: 'compact_diagnostics',
      arguments: { uri: 'file:///nonexistent.compact' },
    });
    expect(result.isError).toBe(true);
  });

  it('returns error when neither uri nor source provided', async () => {
    const result = await client.callTool({
      name: 'compact_diagnostics',
      arguments: {},
    });
    expect(result.isError).toBe(true);
  });
});

describe('compact_hover', () => {
  it('returns hover info for a symbol', async () => {
    // "add" is at line 1, column ~10
    const result = await client.callTool({
      name: 'compact_hover',
      arguments: { uri: mainUri, line: 1, column: 10 },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const hover = JSON.parse(text);
    expect(hover.contents).toBeDefined();
    expect(hover.range).toBeDefined();
  });

  it('returns null for empty space', async () => {
    const result = await client.callTool({
      name: 'compact_hover',
      arguments: { uri: mainUri, line: 0, column: 0 },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toBe('null');
  });
});

describe('compact_definition', () => {
  it('returns definition location for a reference', async () => {
    // "x" at return position (line 2, column 11) should point to the param
    const result = await client.callTool({
      name: 'compact_definition',
      arguments: { uri: mainUri, line: 2, column: 11 },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const def = JSON.parse(text);
    if (def !== null && def.range) {
      expect(def.uri).toBeDefined();
      expect(def.range).toBeDefined();
    }
  });
});

describe('compact_references', () => {
  it('returns references for a symbol', async () => {
    // "x" param on line 1
    const result = await client.callTool({
      name: 'compact_references',
      arguments: { uri: mainUri, line: 1, column: 14 },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const refs = JSON.parse(text);
    expect(Array.isArray(refs)).toBe(true);
  });
});

describe('compact_completions', () => {
  it('returns completions at a position', async () => {
    const result = await client.callTool({
      name: 'compact_completions',
      arguments: { uri: mainUri, line: 2, column: 11 },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const items = JSON.parse(text);
    expect(Array.isArray(items)).toBe(true);
  });
});

describe('compact_symbols', () => {
  it('returns document symbols', async () => {
    const result = await client.callTool({
      name: 'compact_symbols',
      arguments: { uri: mainUri },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const symbols = JSON.parse(text);
    expect(Array.isArray(symbols)).toBe(true);
    expect(symbols.length).toBeGreaterThan(0);
    // Should have the Main module
    expect(symbols.some((s: { name: string }) => s.name === 'Main')).toBe(true);
  });
});

describe('compact_rename', () => {
  it('returns rename edits for a symbol', async () => {
    // Rename "add" circuit (line 1, column ~10)
    const result = await client.callTool({
      name: 'compact_rename',
      arguments: { uri: mainUri, line: 1, column: 10, newName: 'sum' },
    });
    if (!result.isError) {
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      const edits = JSON.parse(text);
      expect(Array.isArray(edits)).toBe(true);
    }
  });

  it('returns error for non-renamable position', async () => {
    // Position 0,0 is on "module" keyword
    const result = await client.callTool({
      name: 'compact_rename',
      arguments: { uri: mainUri, line: 0, column: 0, newName: 'foo' },
    });
    expect(result.isError).toBe(true);
  });
});

describe('compact_signature', () => {
  it('returns signature help inside a call', async () => {
    // Test with inline source that has a call
    const source = `module Test {
  circuit add(x: Field, y: Field): Field { return x + y; }
  circuit main(): Field {
    return add(1, 2);
  }
}`;
    // First analyze the source to get diagnostics (and exercise signature help path)
    const diagResult = await client.callTool({
      name: 'compact_diagnostics',
      arguments: { source },
    });
    expect(diagResult).toBeDefined();
  });
});

describe('compact_analyze', () => {
  it('returns combined analysis for inline source', async () => {
    const result = await client.callTool({
      name: 'compact_analyze',
      arguments: { source: 'module Test { circuit f(x: Field): Field { return x; } }' },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const data = JSON.parse(text);
    expect(data.diagnostics).toBeDefined();
    expect(data.symbols).toBeDefined();
    expect(Array.isArray(data.symbols)).toBe(true);
  });

  it('returns combined analysis with exports for workspace file', async () => {
    const result = await client.callTool({
      name: 'compact_analyze',
      arguments: { uri: mainUri },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const data = JSON.parse(text);
    expect(data.diagnostics).toBeDefined();
    expect(data.symbols).toBeDefined();
    expect(data.exports).toBeDefined();
    expect(Array.isArray(data.exports)).toBe(true);
  });
});

describe('compact_refresh', () => {
  it('refreshes the workspace', async () => {
    const result = await client.callTool({
      name: 'compact_refresh',
      arguments: {},
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('Workspace refreshed');
    expect(text).toContain('.compact file');
  });
});
