## Why

AI coding assistants (Claude Code, Cursor, Copilot, etc.) are increasingly used alongside LSP-powered editors but have no structured way to access Compact language intelligence. An MCP server exposes the LSP's parsing, analysis, and symbol resolution capabilities as tools that AI agents can call directly — giving them accurate, real-time understanding of Compact codebases without reimplementing language analysis.

## What Changes

- Add a new `mcp-server` package to the monorepo that wraps the existing server-side analysis pipeline as MCP tools
- Expose Compact language capabilities (diagnostics, hover/type info, completions, definitions, references, symbol outlines, rename previews) as MCP tools callable by AI agents
- Expose workspace file listing and file contents as MCP resources for codebase navigation
- Reuse the existing lexer, parser, symbol table, and workspace index — no duplication of language logic
- Add `@modelcontextprotocol/sdk` as a dependency for the new package
- Add stdio transport for local use (e.g., Claude Code, Cursor)

## Capabilities

### New Capabilities
- `mcp-server`: MCP server package that exposes Compact language intelligence as tools and resources, using stdio transport

### Modified Capabilities
_None — the MCP server consumes the existing analysis pipeline without changing its behavior._

## Impact

- **New package:** `mcp-server/` added to the monorepo workspace
- **Dependencies:** `@modelcontextprotocol/sdk` (+ `zod` peer dep) added to the new package; imports server-side modules from `compact-lsp-server`
- **Existing code:** No changes to the LSP server, extension, or any existing provider — the MCP server imports and calls the same functions
- **Build:** New workspace entry in root `package.json`; new `tsconfig.json` for the mcp-server package
- **Distribution:** Runs as a standalone Node.js process via stdio (e.g., `node mcp-server/out/index.js --workspace /path/to/project`)
