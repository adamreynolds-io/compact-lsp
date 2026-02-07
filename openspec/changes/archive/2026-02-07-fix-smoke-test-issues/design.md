## Context

The VS Code extension launches the LSP server using `context.asAbsolutePath(path.join('server', 'out', 'server.js'))`. When running via F5 (extensionDevelopmentPath = `extension/`), this resolves to `extension/server/out/server.js` — which only exists after running `bundle:server` for packaging. The actual dev server is at `../server/out/server.js` relative to the extension root.

The smoke test file (`smoke-test.compact`) was written with incorrect syntax assumptions about for-loops, module access operators, constructor placement in contracts, and non-existent built-in functions.

## Goals / Non-Goals

**Goals:**
- Extension starts successfully in both F5 dev mode and packaged .vsix mode
- Smoke test file parses with zero parse errors (only the one intentional undefined reference error)
- Smoke test exercises all 18 LSP feature categories

**Non-Goals:**
- Changing the parser to support additional syntax (e.g., `for i in`, `::` operator)
- Automated smoke test runner — this remains a manual process

## Decisions

**Server path resolution**: Use `fs.existsSync()` to check for the bundled server path first, then fall back to the dev path. This is the simplest approach that works for both modes without requiring environment variables or build flags.

**Alternative considered**: Changing the launch.json `extensionDevelopmentPath` to point at the repo root. Rejected because it would break the extension's package.json resolution and language contribution points.

**Smoke test syntax fixes**: Correct the file to match what the parser actually supports rather than modifying the parser to support the incorrect syntax. The parser's current behavior matches the Compact language spec.

## Risks / Trade-offs

- [Risk] `fs.existsSync` adds a synchronous filesystem check on every activation → Acceptable; this runs once at startup and is negligible overhead.
- [Risk] If someone moves the server output directory, the fallback path breaks silently → Low risk; the server path is conventional and documented.
