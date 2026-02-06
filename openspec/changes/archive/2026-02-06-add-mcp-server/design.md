## Context

compact-lsp has a clean separation between its analysis pipeline (lexer, parser, symbol table, providers) and the LSP transport layer (`server.ts`). All provider functions accept plain data types (AST nodes, tokens, scopes) and return plain result objects — none depend on vscode-languageserver at the type level. This makes it straightforward to wrap them as MCP tools.

The `WorkspaceIndex` class already manages multi-file state (parsing, symbol resolution, export tracking) independently of the LSP connection. The MCP server can instantiate its own `WorkspaceIndex` and `documentState` map, reusing the same analysis pipeline.

## Goals / Non-Goals

**Goals:**
- Expose Compact language intelligence as MCP tools that AI agents can call
- Reuse 100% of existing analysis logic — no duplication
- Support stdio transport for local tool use (Claude Code, Cursor, etc.)
- Provide workspace-level file listing and content as MCP resources

**Non-Goals:**
- HTTP/SSE transport (can be added later)
- Streaming or incremental analysis results
- Modifying existing LSP server code — the MCP server is a separate entry point
- Authentication or multi-tenant access

## Decisions

### Decision 1: Separate package in the monorepo

The MCP server lives in `mcp-server/` as a new workspace package, importing from `compact-lsp-server`.

**Why:** Keeps MCP dependencies (`@modelcontextprotocol/sdk`, `zod`) out of the LSP server and VS Code extension. The LSP server stays lean for editor use. The MCP package can have its own entry point and build config.

**Alternative considered:** Adding MCP endpoints inside `server/src/server.ts`. Rejected because it would couple MCP transport to the LSP server process and add unnecessary dependencies to the extension bundle.

### Decision 2: Own WorkspaceIndex instance

The MCP server creates its own `WorkspaceIndex` on startup, scanning the workspace path provided via CLI argument. It maintains its own `documentState` map mirroring `server.ts`'s pattern.

**Why:** The LSP server's `WorkspaceIndex` is tied to its process lifecycle. Running a separate instance avoids IPC complexity and gives the MCP server independent state management.

**Alternative considered:** Connecting to a running LSP server via IPC. Rejected because it would require the LSP server to be running, add latency, and introduce coupling between two transport layers.

### Decision 3: Tool-per-capability mapping

Each LSP provider maps to one MCP tool:

| MCP Tool | Provider Function | Key Params |
|---|---|---|
| `compact_diagnostics` | `computeDiagnostics` + import/lint/version diagnostics | `uri` |
| `compact_hover` | `getHoverInfo` | `uri`, `line`, `column` |
| `compact_definition` | `getDefinition` | `uri`, `line`, `column` |
| `compact_references` | `findReferences` | `uri`, `line`, `column` |
| `compact_completions` | `getCompletions` | `uri`, `line`, `column` |
| `compact_symbols` | `getDocumentSymbols` | `uri` |
| `compact_rename` | `getRenameEdits` | `uri`, `line`, `column`, `newName` |
| `compact_signature` | `getSignatureHelp` | `uri`, `line`, `column` |
| `compact_analyze` | Full pipeline (parse + all diagnostics) | `uri` or `source` (inline) |

**Why:** 1:1 mapping is simple, discoverable, and matches what AI agents expect. Each tool has a clear input schema (Zod) and returns structured JSON.

**Alternative considered:** A single `compact_query` tool with a `method` parameter. Rejected because it obscures available capabilities and makes tool discovery harder for agents.

### Decision 4: Stdio transport only (initial)

The MCP server uses stdio transport, launched as `node mcp-server/out/index.js --workspace <path>`.

**Why:** Stdio is the standard for local MCP servers (Claude Code, Cursor). It's the simplest transport with no networking concerns. HTTP transport can be layered on later without changing the tool definitions.

### Decision 5: Resources for file access

Expose two MCP resources:
- `compact://files` — list all `.compact` files in the workspace
- `compact://file/{path}` — read a specific file's contents

**Why:** Agents need to browse the workspace to know which files exist and read their contents before calling analysis tools. Resources are the MCP-standard way to expose read-only data.

### Decision 6: Re-read files from disk on each tool call

Rather than maintaining a persistent in-memory document store that could go stale, the MCP server reads files from disk when tools are called. The `WorkspaceIndex` is used for cross-file resolution but individual file analysis is fresh.

**Why:** MCP tool calls are stateless from the agent's perspective. Files may be edited between calls. Reading from disk ensures results reflect the current state. The performance cost is negligible for typical Compact project sizes.

**Alternative considered:** Persistent in-memory caching with file watchers. Rejected as unnecessary complexity — Compact projects are small and re-parsing is fast.

## Risks / Trade-offs

- **[Stale cross-file state]** → The workspace index is built on startup. If files change after startup, cross-file references may be stale. Mitigation: re-scan on each tool call that uses the workspace index, or provide a `compact_refresh` tool.
- **[CommonJS import compatibility]** → The server package uses CommonJS (`module: "commonjs"`). The MCP SDK may prefer ESM. Mitigation: use `esModuleInterop` and verify imports work; if needed, the MCP package can use ESM with dynamic imports.
- **[Zod peer dependency]** → The MCP SDK requires `zod`. This is a new dependency not used elsewhere. Mitigation: contained to the mcp-server package only; does not affect the LSP server or extension.
