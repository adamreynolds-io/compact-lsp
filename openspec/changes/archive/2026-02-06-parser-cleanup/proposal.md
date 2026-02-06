## Why

The version registry will grow with every new Compact language release. Today, adding a version requires copy-pasting ~25 lines of arrays across `versionRegistry.ts`, keeping `symbols.ts` fallback arrays in sync manually, and remembering to add docs in `builtinDocs.ts`. Versions 0.20.0 and 0.21.0 are 100% identical yet fully duplicated. This is error-prone and will only get worse as more versions ship.

## What Changes

- **Delta-based version definitions**: Express each version as changes from the previous version (adds/removes) instead of repeating every built-in. Only the 0.14.0 baseline lists everything; later versions declare only what changed.
- **Single source of truth for built-ins**: Remove the duplicate `BUILTIN_TYPES`, `BUILTIN_FUNCTIONS`, `LEDGER_ADT_TYPES` arrays from `symbols.ts` and derive the fallback (no-version) set from the registry instead.
- **Fall-forward for unknown versions**: When a pragma declares an exact version not in the registry, resolve to the latest known version instead of failing. This gives correct modern built-ins (no removed items like `CurvePoint`) with a soft informational diagnostic.
- **Validation**: Add a test that ensures every built-in name across all versions has a corresponding entry in `BUILTIN_DOCS`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `built-in-registry`: Version entries switch from full arrays to delta-based definitions; fallback scope derived from registry union
- `version-aware-parsing`: Unknown exact versions fall forward to latest known version instead of failing
- `builtin-docs`: Add validation requirement — every built-in name must have a doc entry

## Impact

- `server/src/versionRegistry.ts` — Major refactor: delta-based version definitions, computed capabilities
- `server/src/symbols.ts` — Remove hardcoded fallback arrays, derive from registry
- `server/src/builtinDocs.ts` — No structural change, but new test coverage for completeness
- `server/src/versionDiagnostics.ts` — Updated diagnostic for fall-forward case
- Existing tests updated where they assert on unknown-version behavior
