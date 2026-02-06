## Context

All three packages (`server/`, `extension/`, `zed-extension/`) have the code ready but lack publishing metadata. The server and extension have `"private": true`. The VS Code extension currently references the server via `path.join('..', 'server', 'out', 'server.js')` — a sibling directory traversal that won't work in a packaged `.vsix`.

## Goals / Non-Goals

**Goals:**
- Make `npm publish` work for `compact-lsp-server`
- Make `vsce package` + `vsce publish` work for the VS Code extension
- Make the Zed extension ready for marketplace PR submission
- VS Code extension is self-contained (bundles the server)

**Non-Goals:**
- CI/CD pipeline for automated publishing (future work)
- Automated version bumping or changelog generation
- npm publishing for the MCP server (separate concern)

## Decisions

### 1. Server bundling: copy server output into extension at build time

**Choice:** Add a build step that copies `server/out/` into `extension/server/` before packaging. Update `extension.ts` to resolve the server path as `path.join('server', 'out', 'server.js')` (relative to extension root, no `..` traversal).

**Alternatives considered:**
- Move server source into extension directory — breaks the monorepo structure and the MCP server's dependency on `compact-lsp-server`
- Use esbuild/webpack to bundle server into single file — adds build complexity for no real benefit at this scale

**Rationale:** Simplest approach. The extension build copies compiled server JS files. The `vsce package` step then includes them naturally. The monorepo structure stays intact.

### 2. Extension packaging: vsce with .vscodeignore

**Choice:** Add a `.vscodeignore` to exclude source files, keeping only `out/`, `server/`, `package.json`, `LICENSE`, and `README.md` in the packaged `.vsix`.

**Rationale:** Standard VS Code extension practice. Keeps the package small.

### 3. npm package: files whitelist

**Choice:** Use the `"files"` field in `server/package.json` to whitelist `out/` only. This is the inverse of `.npmignore` and more explicit.

**Rationale:** Safer than `.npmignore` — only listed files are included. Source TypeScript, tests, and config stay out of the published package.

### 4. Publisher ID: placeholder requiring user input

**Choice:** Add a `"publisher"` field to the extension package.json. The user will need to create a VS Code Marketplace publisher account and fill in their ID.

**Rationale:** Can't publish without it. We'll use a placeholder that the user replaces.

### 5. Zed extension: verify metadata completeness

**Choice:** The `extension.toml` already has all required fields. Just verify and document the submission process.

**Rationale:** Zed marketplace submission is a PR to `zed-industries/extensions` — no build changes needed, just metadata verification.

## Risks / Trade-offs

- **[Publisher account required]** → User must create a VS Code Marketplace publisher account and an Azure DevOps PAT. → Mitigation: Document the steps clearly.
- **[Server duplication in extension]** → The bundled extension contains a copy of the server. → Mitigation: Only `out/` JS files are copied (~100KB), not source.
- **[npm scope availability]** → The package name `compact-lsp-server` may already be taken on npm. → Mitigation: Check availability before publishing; fall back to scoped name if needed.

## Open Questions

- What VS Code Marketplace publisher ID should be used? (User needs to create one.)
