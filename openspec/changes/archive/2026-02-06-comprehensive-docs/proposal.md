## Why

compact-lsp has no user-facing documentation. There is no README, no contributor guide, no architecture overview, and no usage instructions. Anyone discovering the project — whether a potential user wanting IDE support for Compact, or a contributor wanting to understand the codebase — has no entry point. The project has matured beyond POC (14 LSP capabilities, 227 tests) and needs documentation to match.

## What Changes

- Add a root **README.md** with project overview, feature list, installation/usage instructions, and development setup
- Add a **CONTRIBUTING.md** with architecture overview, development workflow, testing guide, and code conventions
- Update **CLAUDE.md** to reflect the current state of the project (it still says "POC scope: Diagnostics and Hover only" despite having 14 capabilities)

## Capabilities

### New Capabilities
- `readme`: Root README.md with project overview, features, installation, usage, and development setup
- `contributing-guide`: CONTRIBUTING.md with architecture overview, development workflow, testing, and conventions

### Modified Capabilities
_(none — documentation is not a behavioral spec)_

## Impact

- New files: `README.md`, `CONTRIBUTING.md`
- Modified files: `CLAUDE.md`
- No code changes, no dependency changes, no behavioral changes
