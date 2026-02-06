## Why

The Compact language has evolved through versions 0.19.0, 0.20.0, and 0.21.0 (the current release), but the LSP version registry only contains entries for 0.14.0 and 0.18.0. Users writing `pragma language_version >= 0.19.0` or later get a fallback diagnostic and may not see the correct built-in identifiers for their version. The Compact compiler changelog documents concrete built-in changes across these versions (NativePoint replacing CurvePoint, new accessor circuits, renamed identifiers) that the LSP should track.

## What Changes

- **Add version registry entry for 0.19.0**: Same built-in types/functions as 0.18.0, plus `CurvePoint` ADT renamed to `NativePoint`, and new accessor functions `NativePointX`, `NativePointY`
- **Add version registry entry for 0.20.0**: Renames `NativePointX`/`NativePointY` → `nativePointX`/`nativePointY` (lowercase), adds `constructNativePoint` function
- **Add version registry entry for 0.21.0**: Same capabilities as 0.20.0 (no built-in changes, but registers the current language version as known)
- **Add `CurvePoint` to 0.18.0 ADT types**: It was an exported standard library type available at 0.18.0 but was not tracked in the registry
- **Add documentation entries** for new built-in identifiers: `CurvePoint`, `NativePoint`, `NativePointX`, `NativePointY`, `nativePointX`, `nativePointY`, `constructNativePoint`
- **Update tests** for the new version entries, documentation coverage, and version resolution scenarios

## Capabilities

### New Capabilities

_(none — this change extends existing capabilities)_

### Modified Capabilities

- `version-aware-parsing`: The version registry requirement changes from "entries for 0.14.0 and 0.18.0" to "entries for 0.14.0, 0.18.0, 0.19.0, 0.20.0, and 0.21.0", with version-specific built-in differences. Fallback resolution scenarios change (e.g., `>= 0.19.0` now resolves exactly instead of falling back).
- `builtin-docs`: The documentation registry must cover new identifiers introduced in 0.19.0–0.21.0 (`CurvePoint`, `NativePoint`, `NativePointX`, `NativePointY`, `nativePointX`, `nativePointY`, `constructNativePoint`).
- `built-in-registry`: The root scope must register the correct set of ADT types and functions per resolved version, including the NativePoint family of identifiers.

## Impact

- **`server/src/versionRegistry.ts`**: Add 3 new version entries, add `CurvePoint` to 0.18.0
- **`server/src/builtinDocs.ts`**: Add 7 new documentation entries
- **`server/src/__tests__/versionRegistry.test.ts`**: Tests for new version entries and resolution
- **`server/src/__tests__/builtinDocs.test.ts`**: Update pragma to 0.21.0 to test all docs in root scope
- **`server/src/__tests__/versionDiagnostics.test.ts`**: New scenarios for 0.19.0–0.21.0 pragmas
- **CLAUDE.md / MEMORY.md**: Update registered version list
