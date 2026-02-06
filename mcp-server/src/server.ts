import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { getHoverInfo } from 'compact-lsp-server/out/hover.js';
import { getDefinition } from 'compact-lsp-server/out/definition.js';
import { findReferences } from 'compact-lsp-server/out/references.js';
import { getCompletions } from 'compact-lsp-server/out/completion.js';
import { getDocumentSymbols } from 'compact-lsp-server/out/documentSymbols.js';
import { prepareRename, getRenameEdits } from 'compact-lsp-server/out/rename.js';
import { getSignatureHelp } from 'compact-lsp-server/out/signatureHelp.js';
import { CompactWorkspace } from './workspace.js';

function formatRange(range: {
  start: { line: number; column: number };
  end: { line: number; column: number };
}) {
  return {
    start: { line: range.start.line, column: range.start.column },
    end: { line: range.end.line, column: range.end.column },
  };
}

export function createServer(workspace: CompactWorkspace): McpServer {
  const server = new McpServer({
    name: 'compact-lsp',
    version: '0.1.0',
  });

  // --- Tools ---

  server.registerTool(
    'compact_diagnostics',
    {
      description:
        'Run the full diagnostic pipeline on a Compact file and return structured results (parse errors, undefined references, import errors, lint warnings, version diagnostics)',
      inputSchema: {
        uri: z
          .string()
          .optional()
          .describe('File URI (file:///...) of a .compact file in the workspace'),
        source: z
          .string()
          .optional()
          .describe('Inline Compact source code to analyze (no cross-file resolution)'),
      },
    },
    async ({ uri, source }) => {
      if (source !== undefined) {
        const result = workspace.getDiagnosticsForSource(source);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result.diagnostics, null, 2) }],
        };
      }
      if (!uri) {
        return {
          content: [{ type: 'text' as const, text: 'Error: provide either "uri" or "source"' }],
          isError: true,
        };
      }
      const result = workspace.getDiagnosticsForFile(uri);
      if (!result) {
        return {
          content: [{ type: 'text' as const, text: `Error: file not found: ${uri}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.diagnostics, null, 2) }],
      };
    },
  );

  server.registerTool(
    'compact_hover',
    {
      description:
        'Get type information and documentation for a symbol at a specific position in a Compact file',
      inputSchema: {
        uri: z.string().describe('File URI (file:///...) of a .compact file'),
        line: z.number().describe('Zero-based line number'),
        column: z.number().describe('Zero-based column number'),
      },
    },
    async ({ uri, line, column }) => {
      const analysis = workspace.analyzeUri(uri);
      if (!analysis) {
        return {
          content: [{ type: 'text' as const, text: `Error: file not found: ${uri}` }],
          isError: true,
        };
      }
      const result = getHoverInfo(
        analysis.parseResult,
        analysis.fileScope,
        line,
        column,
        analysis.tokens,
        workspace.workspaceIndex,
      );
      if (!result) {
        return { content: [{ type: 'text' as const, text: 'null' }] };
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                contents: result.contents,
                documentation: result.documentation,
                range: formatRange(result.range),
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    'compact_definition',
    {
      description:
        'Find the definition location of a symbol at a specific position in a Compact file',
      inputSchema: {
        uri: z.string().describe('File URI (file:///...) of a .compact file'),
        line: z.number().describe('Zero-based line number'),
        column: z.number().describe('Zero-based column number'),
      },
    },
    async ({ uri, line, column }) => {
      const analysis = workspace.analyzeUri(uri);
      if (!analysis) {
        return {
          content: [{ type: 'text' as const, text: `Error: file not found: ${uri}` }],
          isError: true,
        };
      }
      const result = getDefinition(
        analysis.parseResult,
        analysis.fileScope,
        analysis.references,
        line,
        column,
        analysis.tokens,
        workspace.workspaceIndex,
      );
      if (!result) {
        return { content: [{ type: 'text' as const, text: 'null' }] };
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                uri: result.uri || uri,
                range: formatRange(result.range),
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    'compact_references',
    {
      description:
        'Find all locations where a symbol at a specific position is used across the workspace',
      inputSchema: {
        uri: z.string().describe('File URI (file:///...) of a .compact file'),
        line: z.number().describe('Zero-based line number'),
        column: z.number().describe('Zero-based column number'),
      },
    },
    async ({ uri, line, column }) => {
      const analysis = workspace.analyzeUri(uri);
      if (!analysis) {
        return {
          content: [{ type: 'text' as const, text: `Error: file not found: ${uri}` }],
          isError: true,
        };
      }
      const results = findReferences(
        analysis.parseResult,
        analysis.fileScope,
        analysis.references,
        line,
        column,
        analysis.tokens,
        true,
        workspace.workspaceIndex,
        uri,
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              results.map((r) => ({
                uri: r.uri || uri,
                range: formatRange(r.range),
              })),
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    'compact_completions',
    {
      description: 'Get auto-completion suggestions for a position in a Compact file',
      inputSchema: {
        uri: z.string().describe('File URI (file:///...) of a .compact file'),
        line: z.number().describe('Zero-based line number'),
        column: z.number().describe('Zero-based column number'),
      },
    },
    async ({ uri, line, column }) => {
      const analysis = workspace.analyzeUri(uri);
      if (!analysis) {
        return {
          content: [{ type: 'text' as const, text: `Error: file not found: ${uri}` }],
          isError: true,
        };
      }
      const items = getCompletions(
        analysis.parseResult,
        analysis.fileScope,
        line,
        column,
        workspace.workspaceIndex,
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              items.map((i) => ({
                label: i.label,
                kind: i.kind,
                detail: i.detail,
                documentation: i.documentation,
              })),
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    'compact_symbols',
    {
      description:
        'Get the hierarchical symbol outline of a Compact file (modules, circuits, structs, enums, etc.)',
      inputSchema: {
        uri: z.string().describe('File URI (file:///...) of a .compact file'),
      },
    },
    async ({ uri }) => {
      const analysis = workspace.analyzeUri(uri);
      if (!analysis) {
        return {
          content: [{ type: 'text' as const, text: `Error: file not found: ${uri}` }],
          isError: true,
        };
      }
      const symbols = getDocumentSymbols(analysis.parseResult.sourceFile);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(symbols, null, 2) }],
      };
    },
  );

  server.registerTool(
    'compact_rename',
    {
      description: 'Compute rename edits for a symbol at a specific position across the workspace',
      inputSchema: {
        uri: z.string().describe('File URI (file:///...) of a .compact file'),
        line: z.number().describe('Zero-based line number'),
        column: z.number().describe('Zero-based column number'),
        newName: z.string().describe('The new name for the symbol'),
      },
    },
    async ({ uri, line, column, newName }) => {
      const analysis = workspace.analyzeUri(uri);
      if (!analysis) {
        return {
          content: [{ type: 'text' as const, text: `Error: file not found: ${uri}` }],
          isError: true,
        };
      }
      const canRename = prepareRename(
        analysis.parseResult,
        analysis.fileScope,
        analysis.references,
        line,
        column,
        analysis.tokens,
      );
      if (!canRename) {
        return {
          content: [{ type: 'text' as const, text: 'Error: position is not renamable' }],
          isError: true,
        };
      }
      const edits = getRenameEdits(
        analysis.parseResult,
        analysis.fileScope,
        analysis.references,
        line,
        column,
        analysis.tokens,
        newName,
        workspace.workspaceIndex,
        uri,
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              edits.map((e) => ({
                uri: e.uri || uri,
                range: formatRange(e.range),
                newText: e.newText,
              })),
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    'compact_signature',
    {
      description:
        'Get parameter hints for a function call at a specific position in a Compact file',
      inputSchema: {
        uri: z.string().describe('File URI (file:///...) of a .compact file'),
        line: z.number().describe('Zero-based line number'),
        column: z.number().describe('Zero-based column number'),
      },
    },
    async ({ uri, line, column }) => {
      const analysis = workspace.analyzeUri(uri);
      if (!analysis) {
        return {
          content: [{ type: 'text' as const, text: `Error: file not found: ${uri}` }],
          isError: true,
        };
      }
      const result = getSignatureHelp(
        analysis.parseResult,
        analysis.fileScope,
        line,
        column,
        analysis.source,
        analysis.tokens,
      );
      if (!result) {
        return { content: [{ type: 'text' as const, text: 'null' }] };
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                label: result.label,
                parameters: result.parameters,
                activeParameter: result.activeParameter,
                documentation: result.documentation,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    'compact_analyze',
    {
      description:
        'Run the full analysis pipeline on a Compact file and return diagnostics, document symbols, and exported symbol names',
      inputSchema: {
        uri: z
          .string()
          .optional()
          .describe('File URI (file:///...) of a .compact file in the workspace'),
        source: z.string().optional().describe('Inline Compact source code to analyze'),
      },
    },
    async ({ uri, source }) => {
      if (source !== undefined) {
        const result = workspace.getDiagnosticsForSource(source);
        const symbols = getDocumentSymbols(result.analysis.parseResult.sourceFile);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ diagnostics: result.diagnostics, symbols }, null, 2),
            },
          ],
        };
      }
      if (!uri) {
        return {
          content: [{ type: 'text' as const, text: 'Error: provide either "uri" or "source"' }],
          isError: true,
        };
      }
      const result = workspace.getDiagnosticsForFile(uri);
      if (!result) {
        return {
          content: [{ type: 'text' as const, text: `Error: file not found: ${uri}` }],
          isError: true,
        };
      }
      const symbols = getDocumentSymbols(result.analysis.parseResult.sourceFile);
      const entry = workspace.workspaceIndex.getFileEntry(uri);
      const exports = entry ? Array.from(entry.exports.keys()) : [];
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ diagnostics: result.diagnostics, symbols, exports }, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    'compact_refresh',
    {
      description:
        'Re-scan the workspace directory and rebuild the file index. Use after files have been added, removed, or modified externally.',
      inputSchema: {},
    },
    async () => {
      workspace.scan();
      const fileCount = workspace.getFileUris().length;
      return {
        content: [
          {
            type: 'text' as const,
            text: `Workspace refreshed. Found ${fileCount} .compact file(s).`,
          },
        ],
      };
    },
  );

  // --- Resources ---

  server.registerResource(
    'compact-files',
    'compact://files',
    {
      description: 'List all .compact files in the workspace',
      mimeType: 'application/json',
    },
    async (resourceUri) => ({
      contents: [
        {
          uri: resourceUri.href,
          text: JSON.stringify(workspace.getFileUris(), null, 2),
          mimeType: 'application/json',
        },
      ],
    }),
  );

  server.registerResource(
    'compact-file',
    new ResourceTemplate('compact://file/{+path}', { list: undefined }),
    {
      description: 'Read the contents of a .compact file by its relative path in the workspace',
      mimeType: 'text/plain',
    },
    async (resourceUri, variables) => {
      const filePath = variables.path as string;
      const fullPath = path.resolve(workspace.getWorkspacePath(), filePath);
      try {
        const text = fs.readFileSync(fullPath, 'utf-8');
        return {
          contents: [
            {
              uri: resourceUri.href,
              text,
              mimeType: 'text/plain',
            },
          ],
        };
      } catch {
        throw new Error(`File not found: ${filePath}`);
      }
    },
  );

  return server;
}
