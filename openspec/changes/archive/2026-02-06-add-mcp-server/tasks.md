## 1. Package Setup

- [x] 1.1 Create `mcp-server/` directory with `package.json` (name: `compact-mcp-server`, dependencies: `@modelcontextprotocol/sdk`, `zod`, `compact-lsp-server`)
- [x] 1.2 Create `mcp-server/tsconfig.json` extending the server's pattern (ES2022, CommonJS, outDir: out)
- [x] 1.3 Add `mcp-server` to root `package.json` workspaces array
- [x] 1.4 Verify `npm install` and `npm run build` work with the new package

## 2. Core Server Infrastructure

- [x] 2.1 Create `mcp-server/src/index.ts` — CLI entry point that parses `--workspace` arg, validates the path, initializes the workspace, and starts the MCP server on stdio
- [x] 2.2 Create `mcp-server/src/workspace.ts` — workspace manager that wraps `WorkspaceIndex`, handles file scanning (recursive `*.compact` glob), and provides `analyzeFile(uri)` returning `{ parseResult, fileScope, references, tokens, source }`
- [x] 2.3 Wire stdio transport using `@modelcontextprotocol/sdk` `StdioServerTransport` and `McpServer`

## 3. MCP Tools

- [x] 3.1 Register `compact_diagnostics` tool — accepts `{ uri }` or `{ source }`, returns diagnostics array
- [x] 3.2 Register `compact_hover` tool — accepts `{ uri, line, column }`, returns hover contents or null
- [x] 3.3 Register `compact_definition` tool — accepts `{ uri, line, column }`, returns definition location or null
- [x] 3.4 Register `compact_references` tool — accepts `{ uri, line, column }`, returns reference locations array
- [x] 3.5 Register `compact_completions` tool — accepts `{ uri, line, column }`, returns completion items array
- [x] 3.6 Register `compact_symbols` tool — accepts `{ uri }`, returns document symbol tree
- [x] 3.7 Register `compact_rename` tool — accepts `{ uri, line, column, newName }`, returns rename edits array
- [x] 3.8 Register `compact_signature` tool — accepts `{ uri, line, column }`, returns signature help or null
- [x] 3.9 Register `compact_analyze` tool — accepts `{ uri }` or `{ source }`, returns combined diagnostics + symbols + exports
- [x] 3.10 Register `compact_refresh` tool — re-scans workspace directory and rebuilds index

## 4. MCP Resources

- [x] 4.1 Register `compact://files` resource — returns list of `.compact` file URIs from workspace index
- [x] 4.2 Register `compact://file/{path}` resource template — reads and returns file contents

## 5. Testing

- [x] 5.1 Create `mcp-server/src/__tests__/workspace.test.ts` — test workspace scanning, file analysis, and refresh
- [x] 5.2 Create `mcp-server/src/__tests__/tools.test.ts` — test each MCP tool with sample Compact source (diagnostics, hover, definition, references, completions, symbols, rename, signature, analyze)
- [x] 5.3 Create `mcp-server/src/__tests__/resources.test.ts` — test file list and file content resources
- [x] 5.4 Verify all tests pass with `npm test`
