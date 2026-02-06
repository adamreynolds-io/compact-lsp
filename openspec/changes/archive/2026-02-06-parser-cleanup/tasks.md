## 1. Delta-based version registry

- [x] 1.1 Define `VersionDelta` interface and `VERSION_CHAIN` array in `versionRegistry.ts` with baseline (0.14.0) and deltas for 0.18.0, 0.19.0, 0.20.0, 0.21.0
- [x] 1.2 Implement `buildVersionCapabilities()` that walks the chain and accumulates full `VersionCapabilities` per version
- [x] 1.3 Replace the existing hardcoded `LANGUAGE_VERSIONS` map with the computed one from `buildVersionCapabilities()`
- [x] 1.4 Export `getAllBuiltins()` function that returns the union of all built-in names across every version
- [x] 1.5 Add tests: computed capabilities for each version match the previously hardcoded values
- [x] 1.6 Add tests: `getAllBuiltins()` includes both current and removed built-ins (e.g., `CurvePoint` and `NativePoint`)

## 2. Remove duplicate arrays from symbols.ts

- [x] 2.1 Remove `BUILTIN_TYPES`, `BUILTIN_FUNCTIONS`, and `LEDGER_ADT_TYPES` arrays from `symbols.ts`
- [x] 2.2 Update `createRootScope()` no-version fallback to call `getAllBuiltins()` from `versionRegistry.ts`
- [x] 2.3 Verify all existing symbol table tests pass without changes

## 3. Fall-forward for unknown exact versions

- [x] 3.1 Update `resolveVersion()` so that `operator === '='` with an unknown version resolves to the latest known version with `fallback: true`
- [x] 3.2 Update `versionDiagnostics.ts` so `"unsupported-version"` warning only fires when `>=` resolution fails entirely
- [x] 3.3 Add tests: unknown exact version (e.g., `0.22.0`) resolves to latest with `fallback: true`
- [x] 3.4 Add tests: unknown exact version emits `"version-resolved"` info diagnostic (not `"unsupported-version"` warning)
- [x] 3.5 Update any existing tests that assert on unknown-version behavior

## 4. Doc completeness validation

- [x] 4.1 Add test in `builtinDocs.test.ts` that iterates `getAllBuiltins()` and asserts every name has a non-empty entry in `BUILTIN_DOCS`

## 5. Final verification

- [x] 5.1 Run full test suite and fix any regressions
- [x] 5.2 Run lint and format checks
