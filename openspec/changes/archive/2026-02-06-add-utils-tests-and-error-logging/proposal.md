## Why

The `utils.ts` module provides four critical helper functions used by 7+ providers, but has zero direct test coverage — bugs here silently break hover, definition, completion, and more. Additionally, three catch blocks in `server.ts` silently swallow workspace scanning errors, making it difficult to diagnose file-loading issues.

## What Changes

- Add a comprehensive test suite for all 4 exported functions in `utils.ts`
- Add debug-level logging to the 3 silent catch blocks in `server.ts`

## Capabilities

### New Capabilities
- `utils-tests`: Unit test coverage for `findTokenAtPosition`, `findScopeForPosition`, `findChildScopeForDecl`, and `isPositionInRange`

### Modified Capabilities
- `error-observability`: Add connection.console.log() calls to silent catch blocks in server.ts for workspace scanning errors

## Impact

- **New file**: `server/src/utils.test.ts`
- **Modified**: `server/src/server.ts` (3 catch blocks)
