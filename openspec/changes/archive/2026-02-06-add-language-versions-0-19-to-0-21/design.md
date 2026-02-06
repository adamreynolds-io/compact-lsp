## Context

The Compact language version registry (`versionRegistry.ts`) currently tracks two versions: 0.14.0 and 0.18.0. The Compact compiler has since released language versions 0.19.0, 0.20.0, and 0.21.0 (current), each introducing changes to the standard library's exported types and functions — particularly around the `CurvePoint` → `NativePoint` transition and its accessor circuits.

The LSP treats certain standard library exports (e.g., `Either`, `ContractAddress`, `left`, `right`) as "built-in" identifiers registered in the root scope, alongside true grammar-level built-ins like `Field` and `map`. This pattern should extend to the NativePoint family of identifiers for versions where they exist.

## Goals / Non-Goals

**Goals:**
- Register language versions 0.19.0, 0.20.0, and 0.21.0 in the version registry with correct built-in capabilities
- Backfill `CurvePoint` into the 0.18.0 ADT types (it was present but untracked)
- Add documentation strings for all new identifiers
- Ensure version resolution produces correct results for new version pragmas
- Update tests to cover the new versions

**Non-Goals:**
- Tracking the full standard library (functions like `mintToken`, `tokenType`, `receive` etc. are imported from `CompactStandardLibrary`, not registered as built-ins)
- Tracking sub-versions (0.18.100, 0.19.101, etc.) — only major language versions
- Adding standard library function signatures or method resolution for NativePoint accessors (they're registered as identifier names only, same as existing built-ins like `left`/`right`)

## Decisions

### 1. Track CurvePoint/NativePoint as ADT types, accessor circuits as functions

**Decision:** `CurvePoint` (0.18.0) and `NativePoint` (0.19.0+) go in `builtinAdtTypes`. The accessor circuits (`NativePointX`/`NativePointY` in 0.19.0, `nativePointX`/`nativePointY` + `constructNativePoint` in 0.20.0+) go in `builtinFunctions`.

**Rationale:** This follows the existing pattern where `Either`, `ContractAddress`, etc. are ADT types and `left`, `right`, `burnAddress` are functions. NativePoint is a type; its accessors are circuits (callable like functions).

### 2. Version 0.21.0 has identical capabilities to 0.20.0

**Decision:** Register 0.21.0 with the same built-in lists as 0.20.0.

**Rationale:** The Compact changelog shows no built-in type/function changes between 0.20.0 and 0.21.0. Registering it as a known version ensures `pragma language_version 0.21.0` resolves exactly instead of falling back or failing.

### 3. Keep 0.14.0 unchanged

**Decision:** Do not add `CurvePoint` to 0.14.0, even though it may have existed in pre-public versions.

**Rationale:** 0.14.0 predates the public repository. We have no authoritative data on what standard library exports it had. It serves as a conservative baseline with only grammar-level built-ins and core ledger ADTs.

### 4. Version-specific identifier transitions

The NativePoint identifiers transition across versions:

| Version | ADT Type | Functions |
|---------|----------|-----------|
| 0.18.0 | `CurvePoint` | _(none — accessed via struct fields)_ |
| 0.19.0 | `NativePoint` | `NativePointX`, `NativePointY` |
| 0.20.0 | `NativePoint` | `nativePointX`, `nativePointY`, `constructNativePoint` |
| 0.21.0 | `NativePoint` | `nativePointX`, `nativePointY`, `constructNativePoint` |

## Risks / Trade-offs

- **[Incomplete standard library tracking]** → We only track a subset of standard library exports. Users may see `CurvePoint`/`NativePoint` in completions but not `SimplePoint` (internal struct) or other unexported types. This is acceptable — the LSP has always tracked a curated subset.
- **[Sub-version changes lost]** → Renames that happened within a major version (e.g., `burnAddress` → `shieldedBurnAddress` at 0.18.103) are not captured. Mitigation: major versions represent the initial API surface; users on newer sub-versions get the same completions. This matches how the compiler resolves `>=` pragmas.
- **[Test pragma updates]** → The `builtinDocs.test.ts` uses a pragma to activate all built-ins in the root scope. It must be updated to use `0.21.0` to cover the new doc entries. Low risk, straightforward change.
