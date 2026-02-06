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

const mainSource = `module Main {
  circuit add(x: Field, y: Field): Field {
    return x + y;
  }
}`;

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compact-mcp-resources-'));
  fs.writeFileSync(path.join(tmpDir, 'Main.compact'), mainSource);
  fs.mkdirSync(path.join(tmpDir, 'lib'));
  fs.writeFileSync(path.join(tmpDir, 'lib', 'Utils.compact'), 'module Utils {}');

  const workspace = new CompactWorkspace(tmpDir);
  const server = createServer(workspace);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: 'test-client', version: '0.1.0' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('compact://files resource', () => {
  it('lists all .compact files in the workspace', async () => {
    const result = await client.readResource({ uri: 'compact://files' });
    const text = (result.contents as Array<{ text: string }>)[0].text;
    const files = JSON.parse(text);
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBe(2);
    expect(files.some((f: string) => f.includes('Main.compact'))).toBe(true);
    expect(files.some((f: string) => f.includes('Utils.compact'))).toBe(true);
  });
});

describe('compact://file/{path} resource', () => {
  it('reads a file by relative path', async () => {
    const result = await client.readResource({ uri: 'compact://file/Main.compact' });
    const text = (result.contents as Array<{ text: string }>)[0].text;
    expect(text).toBe(mainSource);
  });

  it('reads a file in a subdirectory', async () => {
    const result = await client.readResource({ uri: 'compact://file/lib/Utils.compact' });
    const text = (result.contents as Array<{ text: string }>)[0].text;
    expect(text).toBe('module Utils {}');
  });

  it('throws for non-existent file', async () => {
    await expect(
      client.readResource({ uri: 'compact://file/nonexistent.compact' }),
    ).rejects.toThrow();
  });
});
