#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { createServer } from './server.js';
import { CompactWorkspace } from './workspace.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

function main(): void {
  const args = process.argv.slice(2);
  const workspaceIdx = args.indexOf('--workspace');

  if (workspaceIdx === -1 || workspaceIdx + 1 >= args.length) {
    process.stderr.write(
      'Usage: compact-mcp-server --workspace <path>\n\n' +
        '  --workspace <path>  Path to the Compact project directory\n',
    );
    process.exit(1);
  }

  const workspacePath = path.resolve(args[workspaceIdx + 1]);

  if (!fs.existsSync(workspacePath) || !fs.statSync(workspacePath).isDirectory()) {
    process.stderr.write(`Error: "${workspacePath}" is not a valid directory\n`);
    process.exit(1);
  }

  const workspace = new CompactWorkspace(workspacePath);
  const server = createServer(workspace);
  const transport = new StdioServerTransport();

  server.connect(transport).then(() => {
    process.stderr.write('Compact MCP Server running on stdio\n');
  }).catch((error: unknown) => {
    process.stderr.write(`Fatal error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}

main();
