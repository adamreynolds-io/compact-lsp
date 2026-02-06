## Why

The version registry currently only contains Compact 0.14.0. The OpenZeppelin compact-contracts library (https://github.com/OpenZeppelin/compact-contracts) uses `pragma language_version >= 0.18.0`, meaning files from this widely-used library resolve to 0.14.0 via fallback and trigger an informational diagnostic. Adding 0.18.0 provides first-class support for the most actively used Compact version in the ecosystem, including new built-in types and functions introduced since 0.14.0.

## What Changes

- Add `0.18.0` entry to the version registry with its built-in types, functions, and ADT types
- New built-in functions in 0.18.0: `left`, `right`, `burnAddress`
- New built-in ADT types in 0.18.0: `Either`, `ZswapCoinPublicKey`, `ContractAddress`, `Maybe`
- All 0.14.0 built-ins carry forward to 0.18.0
- Add documentation strings for the new built-ins in `builtinDocs.ts`
- Add a note to CLAUDE.md about periodically checking OpenZeppelin compact-contracts for pragma version updates
- Update tests for the new version entry

## Capabilities

### New Capabilities

(none — this extends existing version-aware infrastructure)

### Modified Capabilities

- `version-aware-parsing`: The version registry requirement gains a new version entry for `0.18.0` with additional built-ins

## Impact

- `server/src/versionRegistry.ts` — new `0.18.0` entry
- `server/src/builtinDocs.ts` — new documentation entries for `left`, `right`, `burnAddress`, `Either`, `ZswapCoinPublicKey`, `ContractAddress`, `Maybe`
- `server/src/__tests__/versionRegistry.test.ts` — tests for the new version entry
- `server/src/__tests__/builtinDocs.test.ts` — update count expectations
- `CLAUDE.md` — add maintenance note about checking OpenZeppelin pragma versions
