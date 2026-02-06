## Context

compact-lsp is a TypeScript LSP server for the Compact smart contract language, structured as a monorepo with `server/` (LSP server) and `extension/` (VS Code extension). It has grown from a POC with 2 features (diagnostics, hover) to a capable language server with 14 LSP features and 227 tests across 13 test files. However, the project has zero user-facing documentation — no README, no contributor guide, and the CLAUDE.md still describes the original POC scope.

The codebase has a clear architecture: hand-written lexer → Pratt parser → AST → symbol table → LSP providers, all wired through vscode-languageserver. This architecture should be documented for contributors.

## Goals / Non-Goals

**Goals:**
- Provide a README that lets a new user understand, install, and use the extension in under 5 minutes
- Provide a CONTRIBUTING guide that lets a new developer understand the architecture and start contributing
- Update CLAUDE.md to accurately reflect the current project state

**Non-Goals:**
- API documentation or JSDoc for individual functions (the codebase is small enough to read directly)
- Auto-generated documentation tooling
- A documentation website or hosted docs
- Compact language reference (that belongs in the Compact repo, not the LSP)

## Decisions

### README structure
README will follow a standard open-source project layout: badge area → one-line description → feature list → screenshot placeholder → installation → development setup → project structure → links. This is the most recognizable format for GitHub repos.

**Alternative considered:** Minimal README with just installation. Rejected because the project has enough features to warrant showcasing them — it helps users evaluate whether the extension meets their needs.

### CONTRIBUTING as a separate file
Architecture and development workflow go in CONTRIBUTING.md rather than the README. This keeps the README focused on users while giving contributors a dedicated, detailed guide.

**Alternative considered:** Keeping everything in README. Rejected because it makes the README too long and mixes audiences (users vs contributors).

### CLAUDE.md update scope
Update CLAUDE.md to reflect current capabilities (all 14 features, not just diagnostics/hover) and remove outdated "POC only" constraints. Keep the existing structure since it works well as project context.

## Risks / Trade-offs

- [Docs drift from code] → Accepted. The project is small and actively developed; docs can be updated alongside feature changes. No automated doc generation needed at this scale.
- [Screenshot placeholder] → The README will include a placeholder for a screenshot/GIF. Actual screenshots require a running VS Code instance and a `.compact` file, which can be added later.
