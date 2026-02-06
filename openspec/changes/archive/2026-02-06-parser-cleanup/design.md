## Context

The version registry (`versionRegistry.ts`) defines 5 language versions, each with full arrays of built-in types, functions, and ADT types. Adding a version means copy-pasting ~25 lines and manually diffing. The same baseline arrays are duplicated in `symbols.ts` as the fallback for files with no pragma. There is no validation that `builtinDocs.ts` covers every built-in name.

## Goals / Non-Goals

**Goals:**
- Make adding a new version a 1–5 line change (just the delta)
- Single source of truth for all built-in names — no duplicate arrays in `symbols.ts`
- Catch missing documentation entries at test time

**Goals:**
- Unknown exact versions fall forward to the latest known version (correct modern built-ins, not the full union)

**Non-Goals:**
- Restructuring `builtinDocs.ts` (flat Record is fine)
- Adding new versions or built-ins as part of this change

## Decisions

### 1. Delta-based version definitions

**Choice:** Define a `VERSION_CHAIN` — an ordered array of `{ version, addFunctions?, removeFunctions?, addAdtTypes?, removeAdtTypes?, addTypes?, removeTypes? }` entries. A `buildVersionCapabilities()` function walks the chain and accumulates the full `VersionCapabilities` for each version at module load time.

**Rationale:** The chain mirrors how versions actually evolve — each one adds or removes a handful of identifiers. 0.21.0 adds nothing, so its entry is just `{ version: '0.21.0' }`. Adding 0.22.0 means appending one entry with only what changed.

**Alternative considered:** Inheritance via `extends` field referencing a parent version string. Rejected because version evolution is strictly linear — there's no branching — so a flat chain is simpler and the ordering is self-documenting.

**Shape:**

```typescript
interface VersionDelta {
  version: string;
  addTypes?: string[];
  removeTypes?: string[];
  addFunctions?: string[];
  removeFunctions?: string[];
  addAdtTypes?: string[];
  removeAdtTypes?: string[];
}

const VERSION_CHAIN: VersionDelta[] = [
  {
    version: '0.14.0',
    // Baseline — addTypes/addFunctions/addAdtTypes list everything
    addTypes: ['Field', 'Boolean', 'Uint', 'Bytes', 'Vector', 'Opaque', 'Void'],
    addFunctions: ['map', 'fold', 'disclose', ...],
    addAdtTypes: ['Counter', 'Set', 'Map', ...],
  },
  {
    version: '0.18.0',
    addFunctions: ['left', 'right', 'burnAddress'],
    addAdtTypes: ['Either', 'ZswapCoinPublicKey', 'ContractAddress', 'Maybe', 'CurvePoint'],
  },
  {
    version: '0.19.0',
    addFunctions: ['NativePointX', 'NativePointY'],
    removeAdtTypes: ['CurvePoint'],
    addAdtTypes: ['NativePoint'],
  },
  {
    version: '0.20.0',
    removeFunctions: ['NativePointX', 'NativePointY'],
    addFunctions: ['nativePointX', 'nativePointY', 'constructNativePoint'],
  },
  {
    version: '0.21.0',
    // Identical to 0.20.0 — no delta
  },
];
```

The module-level init computes and caches `LANGUAGE_VERSIONS` from the chain, so all existing call sites (`getVersionCapabilities`, `resolveVersion`, `isKnownVersion`) keep working unchanged.

### 2. Derive fallback built-ins from registry union

**Choice:** Export a `getAllBuiltins()` function from `versionRegistry.ts` that unions all built-in names across every version. `symbols.ts` calls this instead of maintaining its own `BUILTIN_TYPES`, `BUILTIN_FUNCTIONS`, `LEDGER_ADT_TYPES` arrays.

**Rationale:** Eliminates the second copy of the baseline. When a new version adds a function, it automatically appears in the no-version fallback without touching `symbols.ts`.

**Shape:**

```typescript
export function getAllBuiltins(): VersionCapabilities {
  // Union of all versions' capabilities
}
```

### 3. Fall-forward for unknown exact versions

**Choice:** Change `resolveVersion()` so that when `operator === '='` and the version is not in the registry, it resolves to the **latest** known version with `fallback: true`, instead of returning `undefined`.

**Current behavior:**
- `pragma language_version 0.22.0;` → `undefined` → all built-ins (including removed items like `CurvePoint`) + `"unsupported-version"` warning

**New behavior:**
- `pragma language_version 0.22.0;` → latest version (e.g., `0.21.0`) with `fallback: true` → correct modern built-ins + `"version-resolved"` info diagnostic

**Rationale:** An unknown future version is most likely a newer release than what the LSP knows about. Using the latest known version gives the best approximation — it won't include deprecated/removed built-ins. The `"version-resolved"` diagnostic tells the user what's happening without being alarming.

**Impact on diagnostics:** `versionDiagnostics.ts` already handles the `fallback: true` case by emitting `"version-resolved"` info. The `"unsupported-version"` warning now only fires when `>=` resolution fails (no version high enough), which is unlikely in practice.

### 4. Doc completeness validation via test

**Choice:** Add a test in `builtinDocs.test.ts` that iterates `getAllBuiltins()` and asserts every name exists in `BUILTIN_DOCS`.

**Alternative considered:** Runtime assertion in `createRootScope`. Rejected — a missing doc string is not a crash-worthy error, and the test gives a better error message.

## Risks / Trade-offs

- **Startup cost**: `buildVersionCapabilities()` runs once at module load. With 5 versions and ~30 identifiers each, this is negligible.
- **Remove semantics**: If a future version removes many things, the delta chain still works but the union (`getAllBuiltins`) will include removed items in the no-version fallback. This is correct behavior — no pragma means "show everything" — but worth noting.
- **Test coupling**: The doc completeness test couples `builtinDocs.ts` to `versionRegistry.ts`. This is intentional — they should stay in sync.
